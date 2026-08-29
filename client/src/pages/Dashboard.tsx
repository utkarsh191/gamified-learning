function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900">

      {/* Navbar */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            🎮 Gamified Learning
          </div>

          {/* College Rank */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Your College Rank
            </p>

            <p className="text-white font-bold text-lg">
              #12
            </p>
          </div>

        </div>
      </nav>

    </div>
  );
}

export default Dashboard;