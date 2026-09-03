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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Forgot Password
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Enter your registered email and we'll send you a reset link.
        </p>

        {message && (
          <div className="mb-5 rounded-lg border border-green-600 bg-green-900/30 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Remembered your password?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;