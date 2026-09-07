import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);
      console.log("Login successful:", data);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 font-sans antialiased">
      <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/60">
        <h1 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
          Welcome Back
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Continue your gamified learning journey 🚀
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-[#181818] border border-white/10 text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-[#181818] border border-white/10 text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-600"
              required
            />

            <div className="text-right mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-red-500 hover:text-red-400"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Don't have an account?{" "}
          <Link
           to="/signup"
           className="text-red-500 cursor-pointer font-medium hover:text-red-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;