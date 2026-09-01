import { Response } from "express";
import User from "../models/User.js";
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
      // Already marked active today — no-op, just return current stats.
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
// stats (never GitHub/LeetCode data). currentStreak is corrected for
// display in case a day was missed since the last ping.
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