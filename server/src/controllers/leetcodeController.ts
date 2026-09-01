import { Request, Response } from "express";

interface LeetCodeResponse {
  data: {
    matchedUser: {
      username: string;
      submitStatsGlobal: {
        acSubmissionNum: {
          difficulty: string;
          count: number;
        }[];
      };
    } | null;
  };
}

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const XP_RULES = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 40,
} as const;

export const getLeetcodeActivity = async (
  req: Request<{ username: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        message: "LeetCode username is required",
      });
    }

    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `;

    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com/",
      },
      body: JSON.stringify({
        query,
        variables: {
          username,
        },
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Failed to fetch LeetCode data",
      });
    }

    const result: LeetCodeResponse = await response.json();

    const user = result.data?.matchedUser;

    if (!user) {
      return res.status(404).json({
        message: "LeetCode user not found",
      });
    }

    const stats = user.submitStatsGlobal.acSubmissionNum;

    const easySolved =
      stats.find((item) => item.difficulty === "Easy")?.count ?? 0;

    const mediumSolved =
      stats.find((item) => item.difficulty === "Medium")?.count ?? 0;

    const hardSolved =
      stats.find((item) => item.difficulty === "Hard")?.count ?? 0;

    const totalSolved = easySolved + mediumSolved + hardSolved;

    // XP calculation
    const easyXP = easySolved * XP_RULES.EASY;
    const mediumXP = mediumSolved * XP_RULES.MEDIUM;
    const hardXP = hardSolved * XP_RULES.HARD;

    const totalLeetcodeXP = easyXP + mediumXP + hardXP;

    return res.status(200).json({
      username,

      totalSolved,

      easySolved,
      easyXP,

      mediumSolved,
      mediumXP,

      hardSolved,
      hardXP,

      totalLeetcodeXP,
    });
  } catch (error) {
    console.error("LeetCode activity error:", error);

    return res.status(500).json({
      message: "Failed to fetch LeetCode activity",
    });
  }
};