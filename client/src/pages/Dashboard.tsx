import { useEffect } from "react";
import { Link } from "react-router-dom";
import { pingActivity } from "../services/activityService"; // NEW

function Dashboard() {
  // NEW — marks today as an active day for the app's own streak.
  // Fire-and-forget: doesn't block rendering, and the backend is
  // idempotent, so this being called on every Dashboard mount is safe.
  useEffect(() => {
    pingActivity().catch((error) => {
      console.error("Failed to ping activity:", error);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">

      {/* Navbar */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            🎮 Gamified Learning
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">

            {/* College Rank */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Your College Rank
              </p>

              <p className="text-white font-bold text-lg">
                #12
              </p>
            </div>

            {/* Profile Circle */}
            <Link
            to="/profile"
              className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center"
            >
               U
            </Link>

            {/* Premium */}
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-5 py-2 rounded-lg transition"
            >
              👑 Premium
            </button>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
      </main>

      {/* Message Bar */}
      <div className="w-full border-t border-gray-700 bg-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">

          {/* Message Input */}
          <input
            type="text"
            placeholder="Write a message..."
            className="flex-1 bg-gray-700 text-white rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Send Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition"
          >
            Send ➤
          </button>

        </div>
      </div>

    </div>
  );
}

export default Dashboard;