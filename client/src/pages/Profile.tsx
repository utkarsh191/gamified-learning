function Profile() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Profile Header */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">

          <div className="flex flex-col md:flex-row gap-6 items-start">

            {/* Profile Photo */}
            <div className="w-28 h-28 rounded-xl bg-gray-700 flex items-center justify-center text-4xl font-bold">
              U
            </div>

            {/* Profile Info */}
            <div className="flex-1">

              <h1 className="text-3xl font-bold">
                Utkarsh Kesharwani
              </h1>

              <p className="text-blue-400 mt-1">
                @utkarsh
              </p>

              <p className="text-gray-300 mt-4">
                B.Tech IT Student with strong interest in Data Structures
                and Algorithms.
              </p>

              <p className="text-gray-400 mt-4">
                🎓 Rajkiya Engineering College, Azamgarh
              </p>

              <p className="text-gray-300 mt-2">
                🏆 Global Rank{" "}
                <span className="text-white font-bold">
                  #12
                </span>
              </p>

            </div>

            {/* Edit Profile */}
            <button
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Edit Profile
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;