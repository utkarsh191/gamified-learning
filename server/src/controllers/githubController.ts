import { Request, Response } from "express";

export const getGithubActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        message: "GitHub username is required",
      });
    }

    const response = await fetch(
      `https://api.github.com/users/${username}/events/public`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2026-03-10",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: "GitHub user not found or GitHub API error",
      });
    }

    const events = await response.json();

    const pushEvents = events.filter(
      (event: any) => event.type === "PushEvent"
    );

    return res.status(200).json({
      username,
      publicPushes: pushEvents.length,
    });
  } catch (error) {
    console.error("GitHub activity error:", error);

    return res.status(500).json({
      message: "Failed to fetch GitHub activity",
    });
  }
};