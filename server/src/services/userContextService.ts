import User from "../models/User.js";

// Builds a short, human-readable summary of the logged-in user's EXISTING
// data (all cached fields already on the User model — nothing fetched
// live from GitHub/LeetCode here, to keep AI requests fast). This string
// is the ONLY thing sent to Ollama as context — never the raw DB
// document, never unrelated fields (email, password hash, etc. are never
// touched since we select() explicitly).
export const buildUserContext = async (userId: string): Promise<string> => {
  const user = await User.findById(userId).select(
    "name college githubUsername leetcodeUsername githubXP leetcodeXP totalXP leetcodeTotalSolved currentStreak maxStreak totalActiveDays"
  );

  if (!user) {
    return "No profile data is available for this user.";
  }

  const lines: string[] = [];

  lines.push(`User name: ${user.name}`);

  if (user.college) {
    lines.push(`College: ${user.college}`);
  }

  lines.push(`Total XP: ${user.totalXP ?? 0}`);

  if (user.githubUsername) {
    lines.push(`GitHub XP: ${user.githubXP ?? 0} (GitHub connected: ${user.githubUsername})`);
  } else {
    lines.push(`GitHub: not connected`);
  }

  if (user.leetcodeUsername) {
    lines.push(
      `LeetCode XP: ${user.leetcodeXP ?? 0}, Problems Solved: ${user.leetcodeTotalSolved ?? 0} (LeetCode connected: ${user.leetcodeUsername})`
    );
  } else {
    lines.push(`LeetCode: not connected`);
  }

  lines.push(
    `App activity — Current Streak: ${user.currentStreak ?? 0} day(s), Max Streak: ${user.maxStreak ?? 0} day(s), Total Active Days: ${user.totalActiveDays ?? 0}`
  );

  return lines.join("\n");
};