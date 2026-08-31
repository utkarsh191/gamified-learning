import { Request, Response } from "express";

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

const GITHUB_API_BASE = "https://api.github.com";

// Fixed XP rules — do not change
const XP_RULES = {
  COMMIT: 1,
  PULL_REQUEST: 10,
  MERGED_PULL_REQUEST: 15,
  ISSUE: 3,
  PULL_REQUEST_REVIEW: 5,
} as const;

const githubHeaders = () => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  "X-GitHub-Api-Version": "2026-03-10",
});

/**
 * Runs a GitHub Search API query and returns total_count.
 * Used for pullRequests, mergedPullRequests, issues — where we only need
 * the count, not the individual items, so total_count is accurate and cheap.
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
 * Runs a GitHub Search API query and returns ALL matching items (paginated).
 * Search API caps at 1000 results total (10 pages x 100 per_page) — this is
 * a hard GitHub limit, not something we can bypass.
 * Used here to get the actual list of PRs the user reviewed, so we can then
 * fetch real review events for each one.
 */
const fetchSearchItems = async (
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

    if (pageItems.length < 100 || items.length >= 1000) {
      break;
    }
  }

  return items;
};

/**
 * Given a PR's repository_url + number, fetches ALL reviews on that PR
 * (paginated) and counts only reviews actually performed by `username`.
 */
const countUserReviewsOnPR = async (
  repositoryUrl: string,
  pullNumber: number,
  username: string
): Promise<number> => {
  // repository_url looks like "https://api.github.com/repos/owner/repo"
  const repoPath = repositoryUrl.replace(`${GITHUB_API_BASE}/repos/`, "");

  let reviewCount = 0;
  let page = 1;

  while (true) {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repoPath}/pulls/${pullNumber}/reviews?per_page=100&page=${page}`,
      { headers: githubHeaders() }
    );

    // If a PR's reviews can't be fetched (e.g. repo went private/deleted
    // since search indexed it), skip it rather than crashing the request
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

    // 2. Fetch ALL commits by this user across ALL public repos — unchanged
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

    // 3. Pull Requests created by this user — unchanged
    const pullRequests = await fetchSearchCount(
      `author:${username} type:pr`
    );

    // 4. Merged Pull Requests only — unchanged
    const mergedPullRequests = await fetchSearchCount(
      `author:${username} type:pr is:merged`
    );

    // 5. Issues created by this user (PRs excluded) — unchanged
    const issues = await fetchSearchCount(
      `author:${username} type:issue`
    );

    // 6. Pull Request Reviews — ACTUAL review event count
    // Step A: get every PR this user reviewed (excluding their own PRs)
    const reviewedPRs = await fetchSearchItems(
      `reviewed-by:${username} type:pr -author:${username}`
    );

    // Step B: for each PR, fetch its reviews and count only this user's
    let pullRequestReviews = 0;

    for (const pr of reviewedPRs) {
      pullRequestReviews += await countUserReviewsOnPR(
        pr.repository_url,
        pr.number,
        username
      );
    }

    // XP calculation — values fixed per your rules, not configurable here
    const commitXP = totalCommits * XP_RULES.COMMIT;
    const pullRequestXP = pullRequests * XP_RULES.PULL_REQUEST;
    const mergedPullRequestXP =
      mergedPullRequests * XP_RULES.MERGED_PULL_REQUEST;
    const issueXP = issues * XP_RULES.ISSUE;
    const pullRequestReviewXP =
      pullRequestReviews * XP_RULES.PULL_REQUEST_REVIEW;

    const totalGithubXP =
      commitXP +
      pullRequestXP +
      mergedPullRequestXP +
      issueXP +
      pullRequestReviewXP;

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