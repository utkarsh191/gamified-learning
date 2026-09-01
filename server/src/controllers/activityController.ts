import { Response } from "express";
import User, { IDailyActivityEntry } from "../models/User.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

const getYesterday = (from: Date): string => {
  const yesterday = new Date(from);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return toDateOnly(yesterday);
};

// Lazily computes the streak as it stands "right now" for display purposes,
// without mutating the DB. The stored currentStreak only gets corrected to
// 0 the next time the user is actually active again (via ping) — this
// function just makes sure the Profile page doesn't show a stale streak
// if the user missed a day and hasn't opened the app since.
const computeDisplayStreak = (
  activityDates: string[],
  storedStreak: number
): number => {
  if (activityDates.length === 0) return 0;

  const lastActive = [...activityDates].sort().slice(-1)[0];
  const today = toDateOnly(new Date());
  const yesterday = getYesterday(new Date());

  if (lastActive === today || lastActive === yesterday) {
    return storedStreak;
  }

  return 0;
};

// POST /api/activity/ping -> marks the current logged-in user active for
// today. Idempotent — calling this any number of times in the same day
// only ever counts as ONE active day. Completely separate from
// GitHub/LeetCode XP and activity — this is the app's OWN streak.
export const pingActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const todayStr = toDateOnly(new Date());

    if (user.activityDates.includes(todayStr)) {
      return res.status(200).json({
        message: "Already active today",
        activityDates: user.activityDates,
        currentStreak: user.currentStreak,
        maxStreak: user.maxStreak,
        totalActiveDays: user.totalActiveDays,
      });
    }

    const yesterdayStr = getYesterday(new Date());
    const wasActiveYesterday = user.activityDates.includes(yesterdayStr);

    user.activityDates.push(todayStr);
    user.totalActiveDays = user.activityDates.length;
    user.currentStreak = wasActiveYesterday ? user.currentStreak + 1 : 1;
    user.maxStreak = Math.max(user.maxStreak, user.currentStreak);

    await user.save();

    return res.status(200).json({
      message: "Activity recorded",
      activityDates: user.activityDates,
      currentStreak: user.currentStreak,
      maxStreak: user.maxStreak,
      totalActiveDays: user.totalActiveDays,
    });
  } catch (error) {
    console.error("Ping activity error:", error);
    return res.status(500).json({ message: "Failed to record activity" });
  }
};

// GET /api/activity -> returns the logged-in user's app-own activity
// stats (never GitHub/LeetCode data).
export const getActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select(
      "activityDates currentStreak maxStreak totalActiveDays"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const displayStreak = computeDisplayStreak(
      user.activityDates,
      user.currentStreak
    );

    return res.status(200).json({
      activityDates: user.activityDates,
      currentStreak: displayStreak,
      maxStreak: user.maxStreak,
      totalActiveDays: user.totalActiveDays,
    });
  } catch (error) {
    console.error("Get activity error:", error);
    return res.status(500).json({ message: "Failed to fetch activity" });
  }
};

// ---------------------------------------------------------------------
// NEW — Heatmap cache endpoints. Completely separate from githubXP /
// leetcodeXP / totalXP: this cache only ever feeds the heatmap grid and
// its tooltip, never the Profile XP numbers.
// ---------------------------------------------------------------------

// GET /api/activity/heatmap -> returns the last saved per-day
// GitHub+LeetCode activity cache, so the Profile page can render the
// heatmap instantly on load instead of waiting on live GitHub/LeetCode
// fetches every time.
export const getHeatmapCache = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select(
      "codingActivityCache codingActivityCacheUpdatedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      data: user.codingActivityCache ?? [],
      updatedAt: user.codingActivityCacheUpdatedAt ?? null,
    });
  } catch (error) {
    console.error("Get heatmap cache error:", error);
    return res.status(500).json({ message: "Failed to fetch heatmap cache" });
  }
};

// PUT /api/activity/heatmap -> overwrites the cached per-day activity with
// freshly fetched GitHub+LeetCode data. Called by the frontend after it
// fetches live data, so the NEXT page load can read from cache instead of
// hitting GitHub/LeetCode again.
export const saveHeatmapCache = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const incoming = req.body.data;

    if (!Array.isArray(incoming)) {
      return res.status(400).json({ message: "data must be an array" });
    }

    // Basic shape validation — reject anything that isn't a proper
    // {date, githubCount, leetcodeCount} entry rather than trusting the
    // client blindly.
    const sanitized: IDailyActivityEntry[] = incoming
      .filter(
        (entry) =>
          entry &&
          typeof entry.date === "string" &&
          typeof entry.githubCount === "number" &&
          typeof entry.leetcodeCount === "number"
      )
      .map((entry) => ({
        date: entry.date,
        githubCount: entry.githubCount,
        leetcodeCount: entry.leetcodeCount,
      }));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          codingActivityCache: sanitized,
          codingActivityCacheUpdatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).select("codingActivityCache codingActivityCacheUpdatedAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Heatmap cache updated",
      data: updatedUser.codingActivityCache,
      updatedAt: updatedUser.codingActivityCacheUpdatedAt,
    });
  } catch (error) {
    console.error("Save heatmap cache error:", error);
    return res.status(500).json({ message: "Failed to save heatmap cache" });
  }
};