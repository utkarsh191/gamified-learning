import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../services/profileService";
import { getGithubActivity } from "../services/githubService.ts";
import { getLeetcodeActivity } from "../services/leetcodeService.ts";

function Profile() {
  const [user, setUser] = useState<any>(null);
  const [githubXP, setGithubXP] = useState(0);
  const [leetcodeXP, setLeetcodeXP] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);

  const totalXP = githubXP + leetcodeXP;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get user profile
        const data = await getProfile();
        setUser(data.user);

        // Get GitHub activity
        if (data.user.githubUsername) {
          const githubData = await getGithubActivity(
            data.user.githubUsername
          );

          setGithubXP(githubData.totalGithubXP);
        }

        // Get LeetCode activity
        if (data.user.leetcodeUsername) {
          const leetcodeData = await getLeetcodeActivity(
            data.user.leetcodeUsername
          );

          setLeetcodeXP(leetcodeData.totalLeetcodeXP);
          setTotalSolved(leetcodeData.totalSolved);
        }
      } catch (error) {
        console.error("Failed to fetch profile/activity:", error);
      }
    };

    fetchProfile();
  }, []);

  if (!user) {
    return <div className="text-white p-8">Loading...</div>;
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

            {/* Profile Information */}
            <div className="flex-1">

              <h1 className="text-3xl font-bold">
                {user.name}
              </h1>

              <p className="mt-1 text-blue-400">
                @{user.username}
              </p>

              <p className="mt-4 text-gray-300">
                B.Tech IT Student with strong interest in Data Structures
                and Algorithms.
              </p>

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
            </p>

            <p className="text-gray-400">
              Points
            </p>
          </div>

          {/* Day Streak */}
          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🔥</p>

            <p className="mt-2 text-2xl font-bold">
              18
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
            </p>

            <p className="text-gray-400">
              Problems Solved
            </p>
          </div>

        </section>

      </div>
    </div>
  );
}

export default Profile;