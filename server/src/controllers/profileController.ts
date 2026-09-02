import User from "../models/User.js";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";

const PROFILE_FIELDS = [
  "name",
  "college",
  "location",
  "githubUsername",
  "linkedinUsername",
  "leetcodeUsername",
  "xUsername",
  "readMe",
  "workExperience",
  "education",
  "skills",
  "currentLearning",
  "interests",
  "learningGoals",
] as const;

// Separate field list for the XP cache endpoint — kept apart from
// PROFILE_FIELDS so a user-editable profile save can never accidentally
// touch cached XP numbers, and vice versa.
const XP_CACHE_FIELDS = [
  "githubXP",
  "leetcodeXP",
  "totalXP",
  "leetcodeTotalSolved",
] as const;

// GET /api/profile -> returns the logged-in user's full profile (includes cached XP)
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/profile -> safely updates only the profile fields that were sent.
// ALSO — if this update removes a previously-set GitHub or LeetCode
// username, resets that source's cached XP and zeroes out its side of the
// coding-activity heatmap cache in the SAME write. This is what makes
// "remove username -> Save Changes" immediately zero the right numbers
// and persist that reset in MongoDB, without a second API call.
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const update: Record<string, unknown> = {};

    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    const newGithubUsername = update.githubUsername as string | undefined;
    const newLeetcodeUsername = update.leetcodeUsername as string | undefined;

    // "Removed" = this update explicitly sends a blank value AND the user
    // previously had a real value set. A field simply not being sent at
    // all is never treated as a removal.
    const githubRemoved =
      newGithubUsername !== undefined &&
      !newGithubUsername.trim() &&
      !!existingUser.githubUsername;

    const leetcodeRemoved =
      newLeetcodeUsername !== undefined &&
      !newLeetcodeUsername.trim() &&
      !!existingUser.leetcodeUsername;

    if (githubRemoved) {
      update.githubXP = 0;
    }

    if (leetcodeRemoved) {
      update.leetcodeXP = 0;
      update.leetcodeTotalSolved = 0;
    }

    if (githubRemoved || leetcodeRemoved) {
      const resultingGithubXP = githubRemoved ? 0 : existingUser.githubXP ?? 0;
      const resultingLeetcodeXP = leetcodeRemoved
        ? 0
        : existingUser.leetcodeXP ?? 0;

      update.totalXP = resultingGithubXP + resultingLeetcodeXP;

      // Zero out only the removed source's per-day counts — keep the
      // other source's dots intact if it's still connected. Grid
      // structure (dates) stays exactly as it was; only counts change.
      update.codingActivityCache = existingUser.codingActivityCache.map(
        (entry) => ({
          date: entry.date,
          githubCount: githubRemoved ? 0 : entry.githubCount,
          leetcodeCount: leetcodeRemoved ? 0 : entry.leetcodeCount,
        })
      );
      update.codingActivityCacheUpdatedAt = new Date();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

// PATCH /api/profile/xp -> persists the latest calculated GitHub/LeetCode
// XP so Profile can render instantly from MongoDB on the next load,
// instead of waiting on external APIs every time.
export const updateCachedXP = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const update: Record<string, unknown> = {};

    for (const field of XP_CACHE_FIELDS) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No XP fields provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "XP cache updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update XP cache error:", error);
    return res.status(500).json({ message: "Failed to update XP cache" });
  }
};

export const getProfileByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};