import { Request, Response } from "express";

interface GithubRepo {
  name: string;
  [key: string]: any;
}

interface GithubActivityResponse {
  username: string;
  publicRepositories: number;
  totalCommits: number;
  pullRequests: number;
}

const GITHUB_API_BASE = "https://api.github.com";

const githubHeaders = () => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  "X-GitHub-Api-Version": "2026-03-10",
});

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

    // 1. Fetch ALL public repositories (paginated)
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

      // Safety: GitHub returns fewer than per_page items on the last page
      if (reposPage.length < 100) {
        break;
      }
    }

    // 2. Fetch ALL commits by this user across ALL public repos (paginated)
    let totalCommits = 0;

    for (const repo of repos) {
      let commitPage = 1;

      while (true) {
        const commitsResponse = await fetch(
          `${GITHUB_API_BASE}/repos/${username}/${repo.name}/commits?author=${username}&per_page=100&page=${commitPage}`,
          { headers: githubHeaders() }
        );

        // Repos with no commits (empty repo) return 409/409 — just skip them
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

    // 3. Fetch Pull Requests via Search API
    const pullRequestsResponse = await fetch(
      `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(
        `author:${username} type:pr`
      )}`,
      { headers: githubHeaders() }
    );

    if (!pullRequestsResponse.ok) {
      return res.status(pullRequestsResponse.status).json({
        message: "Failed to fetch pull requests",
      });
    }

    const pullRequestsData = await pullRequestsResponse.json();
    const pullRequests: number = pullRequestsData.total_count ?? 0;

    const responseBody: GithubActivityResponse = {
      username,
      publicRepositories: repos.length,
      totalCommits,
      pullRequests,
    };

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error("GitHub activity error:", error);

    return res.status(500).json({
      message: "Failed to fetch GitHub activity",
    });
  }
};