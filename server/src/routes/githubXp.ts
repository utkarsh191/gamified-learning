export const GITHUB_XP = {
  commit: 1,
  pullRequest: 10,
  mergedPullRequest: 15,
  issue: 3,
  pullRequestReview: 5,
};

export const calculateGithubXp = ({
  commits,
  pullRequests,
  mergedPullRequests,
  issues,
  pullRequestReviews,
}: {
  commits: number;
  pullRequests: number;
  mergedPullRequests: number;
  issues: number;
  pullRequestReviews: number;
}) => {
  return (
    commits * GITHUB_XP.commit +
    pullRequests * GITHUB_XP.pullRequest +
    mergedPullRequests * GITHUB_XP.mergedPullRequest +
    issues * GITHUB_XP.issue +
    pullRequestReviews * GITHUB_XP.pullRequestReview
  );
};