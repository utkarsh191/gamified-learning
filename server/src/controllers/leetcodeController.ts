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
      // NEW — daily submission counts, keyed by unix timestamp (seconds)
      // as a JSON string. LeetCode's own public field for this.
      userCalendar: {
        submissionCalendar: string;
      };
    } | null;
  };
}

interface DailyCount {
  date: string;
  count: number;
}

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const XP_RULES = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 40,
} as const;

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

// NEW — parses LeetCode's submissionCalendar ("timestamp": count JSON
// string, seconds since epoch) into a sorted array of {date, count}.
// Used only by the heatmap; has no effect on XP calculation below.
const parseSubmissionCalendar = (raw: string | undefined): DailyCount[] => {
  if (!raw) return [];

  try {
    const parsed: Record<string, number> = JSON.parse(raw);

    return Object.entries(parsed)
      .map(([timestampSeconds, count]) => ({
        date: toDateOnly(new Date(Number(timestampSeconds) * 1000)),
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Failed to parse LeetCode submissionCalendar:", error);
    return [];
  }
};

// Lightweight existence check for profile validation — only requests
// `username`, skips submitStatsGlobal/userCalendar entirely. Does not
// touch getLeetcodeActivity below.
export const checkLeetcodeUserExists = async (
  username: string
): Promise<boolean> => {
  const query = `
    query userExists($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com/",
    },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new Error(
      `LeetCode API error while validating username (status ${response.status})`
    );
  }

  const result: { data: { matchedUser: { username: string } | null } } =
    await response.json();

  return !!result.data?.matchedUser;
};

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
          userCalendar {
            submissionCalendar
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

    // XP calculation — unchanged
    const easyXP = easySolved * XP_RULES.EASY;
    const mediumXP = mediumSolved * XP_RULES.MEDIUM;
    const hardXP = hardSolved * XP_RULES.HARD;

    const totalLeetcodeXP = easyXP + mediumXP + hardXP;

    // NEW — daily submissions for the heatmap only
    const dailySubmissions = parseSubmissionCalendar(
      user.userCalendar?.submissionCalendar
    );

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

      dailySubmissions,
    });
  } catch (error) {
    console.error("LeetCode activity error:", error);

    return res.status(500).json({
      message: "Failed to fetch LeetCode activity",
    });
  }
};