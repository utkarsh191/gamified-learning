import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage(null);
      setErrorMessage(null);

      const data = await forgotPassword(email);
      setMessage(
        data.message ||
          "If that email is registered, a password reset link has been sent."
      );
    } catch (error: any) {
      console.error("Forgot password failed:", error);

      const backendMessage = error?.response?.data?.message;
      setErrorMessage(
        backendMessage || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 font-sans antialiased">
      <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/60">
        <h1 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
          Forgot Password
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Enter your registered email and we'll send you a reset link.
        </p>

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-600/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-600 bg-red-600/10 px-4 py-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full bg-[#181818] border border-white/10 text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none transition focus:border-red-600 focus:ring-1 focus:ring-red-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="text-red-500 hover:text-red-400 font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;