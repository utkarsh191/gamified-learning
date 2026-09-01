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

  const totalXP = githubXP + leetcodeXP;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getProfile();
        if (cancelled) return;

        const fetchedUser = data.user;
        setUser(fetchedUser);

        const cachedGithubXP = fetchedUser.githubXP ?? 0;
        const cachedLeetcodeXP = fetchedUser.leetcodeXP ?? 0;
        const cachedTotalSolved = fetchedUser.leetcodeTotalSolved ?? 0;

        setGithubXP(cachedGithubXP);
        setLeetcodeXP(cachedLeetcodeXP);
        setTotalSolved(cachedTotalSolved);

        let freshGithubXP = cachedGithubXP;
        let freshLeetcodeXP = cachedLeetcodeXP;
        let freshTotalSolved = cachedTotalSolved;
        let changed = false;

        const tasks: Promise<void>[] = [];

        if (fetchedUser.githubUsername) {
          setRefreshingGithub(true);
          tasks.push(
            getGithubActivity(fetchedUser.githubUsername)
              .then((githubData) => {
                freshGithubXP = githubData.totalGithubXP;
                if (freshGithubXP !== cachedGithubXP) changed = true;
                if (!cancelled) setGithubXP(freshGithubXP);
              })
              .catch((error) => {
                console.error("GitHub refresh failed, keeping cached XP:", error);
              })
              .finally(() => {
                if (!cancelled) setRefreshingGithub(false);
              })
          );
        }

        if (fetchedUser.leetcodeUsername) {
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
                console.error("LeetCode refresh failed, keeping cached XP:", error);
              })
              .finally(() => {
                if (!cancelled) setRefreshingLeetcode(false);
              })
          );
        }

        tasks.push(
          getActivity()
            .then((activityData) => {
              if (!cancelled) setCurrentStreak(activityData.currentStreak ?? 0);
            })
            .catch((error) => {
              console.error("Failed to fetch app activity streak:", error);
            })
        );

        await Promise.allSettled(tasks);

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
    return <div className="text-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        <section className="rounded-2xl bg-gray-800 p-8 shadow-xl">
          <div className="flex flex-col items-start gap-6 md:flex-row">

            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gray-700 text-4xl font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">

              <h1 className="text-3xl font-bold">
                {user.name}
              </h1>

              <p className="mt-1 text-blue-400">
                @{user.username}
              </p>

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

              <p className="mt-2 text-gray-300">
                🏆 Global Rank{" "}
                <span className="font-bold text-white">
                  #12
                </span>
              </p>
            </div>

            <Link
              to="/edit-profile"
              className="rounded-lg bg-green-600 px-6 py-3 font-semibold transition hover:bg-green-700"
            >
              Edit Profile
            </Link>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🏆</p>
            <p className="mt-2 text-2xl font-bold">#12</p>
            <p className="text-gray-400">Global Rank</p>
          </div>

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
            <p className="text-gray-400">Points</p>
          </div>

          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🔥</p>
            <p className="mt-2 text-2xl font-bold">{currentStreak}</p>
            <p className="text-gray-400">Day Streak</p>
          </div>

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
            <p className="text-gray-400">Problems Solved</p>
          </div>

        </section>

        <section className="mt-6">
          <ActivityHeatmap
            githubUsername={user.githubUsername}
            leetcodeUsername={user.leetcodeUsername}
          />
        </section>

      </div>
    </div>
  );
}

export default Profile;