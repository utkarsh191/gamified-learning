import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateCachedXP } from "../services/profileService";
import { getGithubActivity } from "../services/githubService.ts";
import { getLeetcodeActivity } from "../services/leetcodeService.ts";
import { getActivity } from "../services/activityService";
import ActivityHeatmap from "../components/ActivityHeatmap";

function Profile() {
  const [user, setUser] = useState<any>(null);
  const [githubXP, setGithubXP] = useState(0);
  const [leetcodeXP, setLeetcodeXP] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);

  const [refreshingGithub, setRefreshingGithub] = useState(false);
  const [refreshingLeetcode, setRefreshingLeetcode] = useState(false);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalActiveDays, setTotalActiveDays] = useState(0);

  const totalXP = githubXP + leetcodeXP;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getProfile();

        if (cancelled) return;

        const fetchedUser = data.user;
        setUser(fetchedUser);

        const hasGithub = !!fetchedUser.githubUsername;
        const hasLeetcode = !!fetchedUser.leetcodeUsername;

        // Defensive mask — same rule as ActivityHeatmap: a source whose
        // username is CURRENTLY empty must never display non-zero cached
        // numbers, no matter what the backend returns. This guarantees
        // "8239 points after removing username" can never happen again,
        // even if the DB write timing ever slips.
        const cachedGithubXP = hasGithub ? fetchedUser.githubXP ?? 0 : 0;
        const cachedLeetcodeXP = hasLeetcode ? fetchedUser.leetcodeXP ?? 0 : 0;
        const cachedTotalSolved = hasLeetcode
          ? fetchedUser.leetcodeTotalSolved ?? 0
          : 0;

        setGithubXP(cachedGithubXP);
        setLeetcodeXP(cachedLeetcodeXP);
        setTotalSolved(cachedTotalSolved);

        // If the raw backend value didn't actually match the masked
        // (correct) value, the DB is out of sync — persist the correction
        // now so refresh / logout-login never show the stale number again.
        // This never touches XP CALCULATION rules, only the reset path.
        const rawGithubXP = fetchedUser.githubXP ?? 0;
        const rawLeetcodeXP = fetchedUser.leetcodeXP ?? 0;
        const rawTotalSolved = fetchedUser.leetcodeTotalSolved ?? 0;

        const needsDbCorrection =
          rawGithubXP !== cachedGithubXP ||
          rawLeetcodeXP !== cachedLeetcodeXP ||
          rawTotalSolved !== cachedTotalSolved;

        if (needsDbCorrection) {
          updateCachedXP({
            githubXP: cachedGithubXP,
            leetcodeXP: cachedLeetcodeXP,
            totalXP: cachedGithubXP + cachedLeetcodeXP,
            leetcodeTotalSolved: cachedTotalSolved,
          }).catch((error) => {
            console.error("Failed to persist XP reset correction:", error);
          });
        }

        let freshGithubXP = cachedGithubXP;
        let freshLeetcodeXP = cachedLeetcodeXP;
        let freshTotalSolved = cachedTotalSolved;
        let changed = false;

        const tasks: Promise<void>[] = [];

        // GitHub XP — only refetch if a GitHub username is actually set
        if (hasGithub) {
          setRefreshingGithub(true);

          tasks.push(
            getGithubActivity(fetchedUser.githubUsername)
              .then((githubData) => {
                freshGithubXP = githubData.totalGithubXP;

                if (freshGithubXP !== cachedGithubXP) {
                  changed = true;
                }

                if (!cancelled) {
                  setGithubXP(freshGithubXP);
                }
              })
              .catch((error) => {
                console.error(
                  "GitHub refresh failed, keeping cached XP:",
                  error
                );
              })
              .finally(() => {
                if (!cancelled) {
                  setRefreshingGithub(false);
                }
              })
          );
        }

        // LeetCode XP — only refetch if a LeetCode username is actually set
        if (hasLeetcode) {
          setRefreshingLeetcode(true);

          tasks.push(
            getLeetcodeActivity(fetchedUser.leetcodeUsername)
              .then((leetcodeData) => {
                freshLeetcodeXP = leetcodeData.totalLeetcodeXP;
                freshTotalSolved = leetcodeData.totalSolved;

                if (
                  freshLeetcodeXP !== cachedLeetcodeXP ||
                  freshTotalSolved !== cachedTotalSolved
                ) {
                  changed = true;
                }

                if (!cancelled) {
                  setLeetcodeXP(freshLeetcodeXP);
                  setTotalSolved(freshTotalSolved);
                }
              })
              .catch((error) => {
                console.error(
                  "LeetCode refresh failed, keeping cached XP:",
                  error
                );
              })
              .finally(() => {
                if (!cancelled) {
                  setRefreshingLeetcode(false);
                }
              })
          );
        }

        // App activity / streak — completely separate system, always
        // fetched regardless of GitHub/LeetCode usernames, never reset
        // by them. This is the single source of truth for the app's own
        // streak — both the Day Streak card below AND the Coding Activity
        // section's "Current Streak" (via props passed to ActivityHeatmap)
        // are driven from these same three values.
        tasks.push(
          getActivity()
            .then((activityData) => {
              if (!cancelled) {
                setCurrentStreak(activityData.currentStreak ?? 0);
                setMaxStreak(activityData.maxStreak ?? 0);
                setTotalActiveDays(activityData.totalActiveDays ?? 0);
              }
            })
            .catch((error) => {
              console.error(
                "Failed to fetch app activity streak:",
                error
              );
            })
        );

        await Promise.allSettled(tasks);

        // Save updated XP cache if a live GitHub/LeetCode refetch changed
        // anything (unrelated to the reset-correction write above).
        if (!cancelled && changed) {
          updateCachedXP({
            githubXP: freshGithubXP,
            leetcodeXP: freshLeetcodeXP,
            totalXP: freshGithubXP + freshLeetcodeXP,
            leetcodeTotalSolved: freshTotalSolved,
          }).catch((error) => {
            console.error("Failed to persist XP cache:", error);
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <div className="text-white p-8">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Profile Header */}
        <section className="rounded-2xl bg-gray-800 p-8 shadow-xl">
          <div className="flex flex-col items-start gap-6 md:flex-row">

            {/* Profile Avatar */}
            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gray-700 text-4xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">

              {/* Name */}
              <h1 className="text-3xl font-bold">
                {user.name}
              </h1>

              {/* Username */}
              <p className="mt-1 text-blue-400">
                @{user.username}
              </p>

              {/* About */}
              {user.readMe ? (
                <p className="mt-4 text-gray-300">
                  {user.readMe}
                </p>
              ) : (
                <Link
                  to="/edit-profile"
                  className="mt-4 block text-blue-400 hover:text-blue-300"
                >
                  ✏️ Add something about yourself
                </Link>
              )}

              {/* College */}
              {user.college ? (
                <p className="mt-4 text-gray-400">
                  🎓 {user.college}
                </p>
              ) : (
                <Link
                  to="/edit-profile"
                  className="mt-4 block text-blue-400 hover:text-blue-300"
                >
                  🎓 Add your college
                </Link>
              )}

              {/* Global Rank */}
              <p className="mt-2 text-gray-300">
                🏆 Global Rank{" "}
                <span className="font-bold text-white">
                  #12
                </span>
              </p>

              {/* Social / Coding Profile Links */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">

                {/* GitHub */}
                {user.githubUsername && (
                  <a
                    href={`https://github.com/${user.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    GitHub: {user.githubUsername}
                  </a>
                )}

                {/* LinkedIn */}
                {user.linkedinUsername && (
                  <a
                    href={`https://www.linkedin.com/in/${user.linkedinUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    LinkedIn: {user.linkedinUsername}
                  </a>
                )}

                {/* LeetCode */}
                {user.leetcodeUsername && (
                  <a
                    href={`https://leetcode.com/u/${user.leetcodeUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    LeetCode: {user.leetcodeUsername}
                  </a>
                )}

                {/* X / Twitter */}
                {user.xUsername && (
                  <a
                    href={`https://x.com/${user.xUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    X: {user.xUsername}
                  </a>
                )}

              </div>
            </div>

            {/* Edit Profile */}
            <Link
              to="/edit-profile"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-700"
            >
              Edit Profile
            </Link>
          </div>
        </section>

        {/* Gamification Stats */}
        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          {/* Global Rank */}
          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🏆</p>

            <p className="mt-2 text-2xl font-bold">
              #12
            </p>

            <p className="text-gray-400">
              Global Rank
            </p>
          </div>

          {/* Total XP */}
          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">⭐</p>

            <p className="mt-2 text-2xl font-bold">
              {totalXP}

              {(refreshingGithub || refreshingLeetcode) && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  updating…
                </span>
              )}
            </p>

            <p className="text-gray-400">
              Points
            </p>
          </div>

          {/* Current Streak — app's own activity system, intentionally
              separate from GitHub/LeetCode reset */}
          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🔥</p>

            <p className="mt-2 text-2xl font-bold">
              {currentStreak}
            </p>

            <p className="text-gray-400">
              Day Streak
            </p>
          </div>

          {/* Problems Solved */}
          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🎯</p>

            <p className="mt-2 text-2xl font-bold">
              {totalSolved}

              {refreshingLeetcode && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  updating…
                </span>
              )}
            </p>

            <p className="text-gray-400">
              Problems Solved
            </p>
          </div>

        </section>

        {/* Activity Heatmap — streak numbers passed down from the same
            app-streak source of truth used by the Day Streak card above,
            so both never diverge. */}
        <section className="mt-6">
          <ActivityHeatmap
            githubUsername={user.githubUsername}
            leetcodeUsername={user.leetcodeUsername}
            currentStreak={currentStreak}
            maxStreak={maxStreak}
            totalActiveDays={totalActiveDays}
          />
        </section>

      </div>
    </div>
  );
}

export default Profile;