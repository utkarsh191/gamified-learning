import { Link } from "react-router-dom";

function Profile() {
  return (
    <div className="min-h-screen bg-gray-900 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Profile Header */}
        <section className="rounded-2xl bg-gray-800 p-8 shadow-xl">
          <div className="flex flex-col items-start gap-6 md:flex-row">

            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gray-700 text-4xl font-bold">
              U
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                Utkarsh Kesharwani
              </h1>

              <p className="mt-1 text-blue-400">
                @utkarsh
              </p>

              <p className="mt-4 text-gray-300">
                B.Tech IT Student with strong interest in Data Structures
                and Algorithms.
              </p>

              <p className="mt-4 text-gray-400">
                🎓 Rajkiya Engineering College, Azamgarh
              </p>

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

        {/* Gamification Stats */}
        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🏆</p>
            <p className="mt-2 text-2xl font-bold">#12</p>
            <p className="text-gray-400">Global Rank</p>
          </div>

          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">⭐</p>
            <p className="mt-2 text-2xl font-bold">2450</p>
            <p className="text-gray-400">Points</p>
          </div>

          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🔥</p>
            <p className="mt-2 text-2xl font-bold">18</p>
            <p className="text-gray-400">Day Streak</p>
          </div>

          <div className="rounded-xl bg-gray-800 p-5 text-center">
            <p className="text-2xl">🎯</p>
            <p className="mt-2 text-2xl font-bold">127</p>
            <p className="text-gray-400">Problems Solved</p>
          </div>

        </section>

      </div>
    </div>
  );
}

export default Profile;