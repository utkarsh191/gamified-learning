import { Request, Response } from "express";

const GITHUB_API_BASE = "https://api.github.com";

const XP_RULES = {
  COMMIT: 1,
  PULL_REQUEST: 10,
  MERGED_PULL_REQUEST: 15,
  ISSUE: 3,
  PULL_REQUEST_REVIEW: 5,
} as const;

// Controlled concurrency limit for per-PR review fetches.
// Keeps requests well under GitHub's secondary rate limits without going
// fully sequential (which was the original bottleneck).
const REVIEW_FETCH_CONCURRENCY = 15;

// GitHub Search API only lets you page through the first 1000 matching
// ITEMS per query (total_count itself stays accurate beyond that). When we
// need actual PR objects — not just a count — we split by PR creation-date
// so each chunk stays under 1000 and older history is never dropped.
const SEARCH_ITEM_CAP = 1000;
const MIN_DATE_RANGE_DAYS = 1; // recursion floor — guarantees no infinite loop

interface GithubRepo {
  name: string;
  [key: string]: any;
}

interface GithubSearchIssueItem {
  number: number;
  repository_url: string; // e.g. "https://api.github.com/repos/owner/repo"
  [key: string]: any;
}

interface GithubReview {
  user: { login: string } | null;
  [key: string]: any;
}

interface GithubUser {
  created_at: string;
  [key: string]: any;
}

interface GithubActivityResponse {
  username: string;

  publicRepositories: number;

  totalCommits: number;
  commitXP: number;

  pullRequests: number;
  pullRequestXP: number;

  mergedPullRequests: number;
  mergedPullRequestXP: number;

  issues: number;
  issueXP: number;

  pullRequestReviews: number;
  pullRequestReviewXP: number;

  totalGithubXP: number;
}

const githubHeaders = () => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  "X-GitHub-Api-Version": "2026-03-10",
});

/**
 * Runs `worker` over `items` with at most `limit` requests in flight at
 * once. This is a small worker pool: each "lane" keeps pulling the next
 * item off a shared cursor until the list is exhausted — instead of firing
 * everything at once (unlimited Promise.all) or one request at a time.
 */
async function runWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const lanes = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const currentIndex = cursor;
        cursor++;
        results[currentIndex] = await worker(items[currentIndex]);
      }
    }
  );

  await Promise.all(lanes);
  return results;
}

/**
 * Search API's `total_count` is accurate even for result sets larger than
 * 1000 — the 1000 cap only limits how many *items* you can page through,
 * not the count GitHub reports. So for pure counting (PRs, merged PRs,
 * issues) a single query is correct and fast; no date-splitting needed.
 */
const fetchSearchCount = async (query: string): Promise<number> => {
  const response = await fetch(
    `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}`,
    { headers: githubHeaders() }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub search failed for query "${query}" with status ${response.status}`
    );
  }

  const data = await response.json();
  return data.total_count ?? 0;
};

/**
 * Fetches every item (not just a count) matching a query, paginated up to
 * GitHub's 1000-result ceiling for a single query.
 */
const fetchSearchItemsPage = async (
  query: string
): Promise<GithubSearchIssueItem[]> => {
  const items: GithubSearchIssueItem[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(
        query
      )}&per_page=100&page=${page}`,
      { headers: githubHeaders() }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub search failed for query "${query}" with status ${response.status}`
      );
    }

    const data = await response.json();
    const pageItems: GithubSearchIssueItem[] = data.items ?? [];

    if (pageItems.length === 0) {
      break;
    }

    items.push(...pageItems);
    page++;

    if (pageItems.length < 100 || items.length >= SEARCH_ITEM_CAP) {
      break;
    }
  }

  return items;
};

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

const daysBetween = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

/**
 * Recursively fetches ALL items matching `baseQuery` within [start, end],
 * splitting the date range in half whenever a chunk's count would exceed
 * the 1000-item search cap. This is what lets us retrieve a user's full
 * historical activity (5, 10+ years) instead of silently losing anything
 * beyond the first 1000 matches of one giant query.
 */
async function fetchSearchItemsForDateRange(
  baseQuery: string,
  start: Date,
  end: Date
): Promise<GithubSearchIssueItem[]> {
  const rangedQuery = `${baseQuery} created:${toDateOnly(start)}..${toDateOnly(
    end
  )}`;

  const count = await fetchSearchCount(rangedQuery);

  if (count === 0) {
    return [];
  }

  const rangeIsAtFloor = daysBetween(start, end) <= MIN_DATE_RANGE_DAYS;

  if (count < SEARCH_ITEM_CAP || rangeIsAtFloor) {
    // Safe to fetch directly. (A single day with 1000+ matching review
    // events is not realistic — the floor just guarantees termination.)
    return fetchSearchItemsPage(rangedQuery);
  }

  // Split the range in half and recurse on each half independently
  const midpoint = new Date(
    start.getTime() + Math.floor((end.getTime() - start.getTime()) / 2)
  );
  const dayMs = 1000 * 60 * 60 * 24;

  const [firstHalf, secondHalf] = await Promise.all([
    fetchSearchItemsForDateRange(baseQuery, start, midpoint),
    fetchSearchItemsForDateRange(
      baseQuery,
      new Date(midpoint.getTime() + dayMs),
      end
    ),
  ]);

  return [...firstHalf, ...secondHalf];
}

/**
 * Entry point: fetches all items for `baseQuery` across the user's entire
 * GitHub history, starting from their account creation date — never a
 * hardcoded "recent years only" assumption.
 */
async function fetchAllHistoricalSearchItems(
  baseQuery: string,
  accountCreatedAt: string
): Promise<GithubSearchIssueItem[]> {
  const start = new Date(accountCreatedAt);
  const end = new Date();
  return fetchSearchItemsForDateRange(baseQuery, start, end);
}

/**
 * Fetches ALL reviews on a single PR (paginated) and counts only the ones
 * actually performed by `username` — not reviews received, not general
 * comments, not reviews by other people.
 */
const countUserReviewsOnPR = async (
  repositoryUrl: string,
  pullNumber: number,
  username: string
): Promise<number> => {
  const repoPath = repositoryUrl.replace(`${GITHUB_API_BASE}/repos/`, "");

  let reviewCount = 0;
  let page = 1;

  while (true) {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repoPath}/pulls/${pullNumber}/reviews?per_page=100&page=${page}`,
      { headers: githubHeaders() }
    );

    // If a PR's reviews can't be fetched (repo renamed/deleted since the
    // search index was built, etc.), skip it — don't crash the request
    if (!response.ok) {
      break;
    }

    const reviews: GithubReview[] = await response.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      break;
    }

    for (const review of reviews) {
      if (review.user?.login === username) {
        reviewCount++;
      }
    }

    page++;

    if (reviews.length < 100) {
      break;
    }
  }

  return reviewCount;
};

export const getGithubActivity = async (
  req: Request<{ username: string }>,
  res: Response
): Promise<Response> => {
  try {
    const rawUsername = req.params.username;

    if (!rawUsername) {
      return res.status(400).json({
        message: "GitHub username is required",
      });
    }

    const username: string = rawUsername;

    if (!process.env.GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN is not set in environment variables");
      return res.status(500).json({
        message: "Server misconfiguration: missing GitHub token",
      });
    }

    // 0. Get account creation date — this is what lets us search the
    // user's ENTIRE history instead of guessing a hardcoded start year.
    const userResponse = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
      headers: githubHeaders(),
    });

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({
        message: "GitHub user not found or GitHub API error",
      });
    }

    const githubUser: GithubUser = await userResponse.json();
    const accountCreatedAt = githubUser.created_at;

    // 1. Fetch ALL public repositories (paginated) — unchanged
    const repos: GithubRepo[] = [];
    let repoPage = 1;

    while (true) {
      const reposResponse = await fetch(
        `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&page=${repoPage}`,
        { headers: githubHeaders() }
      );

      if (!reposResponse.ok) {
        return res.status(reposResponse.status).json({
          message: "GitHub user not found or GitHub API error",
        });
      }

      const reposPage: GithubRepo[] = await reposResponse.json();

      if (reposPage.length === 0) {
        break;
      }

      repos.push(...reposPage);
      repoPage++;

      if (reposPage.length < 100) {
        break;
      }
    }

    // 2. Fetch ALL commits by this user across ALL public repos — unchanged.
    // Uses the repo commits endpoint directly, not Search API, so it isn't
    // subject to the 1000-result search cap — pagination alone covers a
    // repo's full history, however many years it spans.
    let totalCommits = 0;

    for (const repo of repos) {
      let commitPage = 1;

      while (true) {
        const commitsResponse = await fetch(
          `${GITHUB_API_BASE}/repos/${username}/${repo.name}/commits?author=${username}&per_page=100&page=${commitPage}`,
          { headers: githubHeaders() }
        );

        // Repos with no commits (empty repo) return 409 — skip, don't crash
        if (!commitsResponse.ok) {
          break;
        }

        const commits = await commitsResponse.json();

        if (!Array.isArray(commits) || commits.length === 0) {
          break;
        }

        totalCommits += commits.length;
        commitPage++;

        if (commits.length < 100) {
          break;
        }
      }
    }

    // 3, 4, 5. Pull Requests / Merged Pull Requests / Issues.
    // Only need total_count, which Search API reports accurately even
    // beyond 1000 — a single query each is correct. Run concurrently since
    // they're independent (3 requests total, no rate-limit concern).
    const [pullRequests, mergedPullRequests, issues] = await Promise.all([
      fetchSearchCount(`author:${username} type:pr`),
      fetchSearchCount(`author:${username} type:pr is:merged`),
      fetchSearchCount(`author:${username} type:issue`),
    ]);

    // 6. Pull Request Reviews — ACTUAL review event count.
    //
    // Step A: find every PR this user reviewed (excluding their own PRs)
    // across their entire account history. We need real PR items here
    // (not just a count) so we can query each PR's reviews — that's why
    // this goes through the date-splitting historical search.
    const reviewedPRs = await fetchAllHistoricalSearchItems(
      `reviewed-by:${username} type:pr -author:${username}`,
      accountCreatedAt
    );

    // Step B: for each PR, fetch its reviews and count only this user's —
    // via controlled concurrency instead of one-by-one sequential calls or
    // an unlimited Promise.all() over potentially thousands of PRs.
    const reviewCountsPerPR = await runWithConcurrencyLimit(
      reviewedPRs,
      REVIEW_FETCH_CONCURRENCY,
      (pr) => countUserReviewsOnPR(pr.repository_url, pr.number, username)
    );

    const pullRequestReviews = reviewCountsPerPR.reduce(
      (sum, count) => sum + count,
      0
    );

    // XP calculation — values fixed per your rules
    const commitXP = totalCommits * XP_RULES.COMMIT;
    const pullRequestXP = pullRequests * XP_RULES.PULL_REQUEST;
    const mergedPullRequestXP =
      mergedPullRequests * XP_RULES.MERGED_PULL_REQUEST;
    const issueXP = issues * XP_RULES.ISSUE;
    const pullRequestReviewXP =
      pullRequestReviews * XP_RULES.PULL_REQUEST_REVIEW;

    const totalGithubXP =
      commitXP + pullRequestXP + mergedPullRequestXP + issueXP + pullRequestReviewXP;

    const responseBody: GithubActivityResponse = {
      username,

      publicRepositories: repos.length,

      totalCommits,
      commitXP,

      pullRequests,
      pullRequestXP,

      mergedPullRequests,
      mergedPullRequestXP,

      issues,
      issueXP,

      pullRequestReviews,
      pullRequestReviewXP,

      totalGithubXP,
    };

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error("GitHub activity error:", error);

    return res.status(500).json({
      message: "Failed to fetch GitHub activity",
    });
  }
};