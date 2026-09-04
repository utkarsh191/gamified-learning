import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  initiateSignup,
  verifySignupOtp,
  resendSignupOtp,
} from "../services/authService";

const RESEND_COOLDOWN_SECONDS = 60;

function Signup() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"form" | "otp">("form");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(null);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const validateUsername = (value: string) => {
    const usernameRegex =
      /^[a-zA-Z0-9](?:[a-zA-Z0-9_]{1,18}[a-zA-Z0-9])?$/;

    if (value.length < 7 || value.length > 20) {
      return "Username must be between 7 and 20 characters";
    }

    if (!usernameRegex.test(value)) {
      return "Username can only contain letters, numbers and underscore";
    }

    return "";
  };

  // Countdown for the resend cooldown — ticks down once per second while
  // resendCooldown > 0. Mirrors the backend's own 60-second window; if the
  // backend returns a different retryAfterSeconds (e.g. after a 429),
  // that value overrides this default.
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateUsername(username);

    if (error) {
      setUsernameError(error);
      return;
    }

    try {
      setSignupLoading(true);
      setSignupError(null);

      await initiateSignup(name, username, email, password);

      // No account exists yet — only a PendingSignup on the backend.
      // Move to the OTP step; JWT/localStorage only happens after verify.
      setOtp("");
      setOtpError(null);
      setOtpInfoMessage("Verification code sent to your email.");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("otp");
    } catch (error: any) {
      console.error("Signup initiate failed:", error);

      const backendMessage = error?.response?.data?.message;
      setSignupError(backendMessage || "Signup failed. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);
      setOtpInfoMessage(null);

      const data = await verifySignupOtp(email, otp);

      // Same as the existing Login flow — save the JWT and go straight
      // to the authenticated area via the existing routing/auth logic.
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("OTP verification failed:", error);

      const backendMessage = error?.response?.data?.message;
      setOtpError(backendMessage || "Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) {
      return;
    }

    try {
      setResendLoading(true);
      setOtpError(null);
      setOtpInfoMessage(null);

      const data = await resendSignupOtp(email);

      setOtpInfoMessage(
        data.message || "A new verification code has been sent to your email."
      );
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: any) {
      console.error("Resend OTP failed:", error);

      const backendMessage = error?.response?.data?.message;
      const retryAfterSeconds = error?.response?.data?.retryAfterSeconds;

      // Backend is the source of truth for the remaining cooldown when
      // it sends one (429 case) — use it instead of the local default.
      if (typeof retryAfterSeconds === "number") {
        setResendCooldown(retryAfterSeconds);
      }

      setOtpError(backendMessage || "Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Verify Your Email
          </h1>

          <p className="text-gray-400 text-center mb-8">
            Enter the 6-digit code sent to{" "}
            <span className="text-white font-semibold">{email}</span>
          </p>

          {otpInfoMessage && (
            <div className="mb-5 rounded-lg border border-green-600 bg-green-900/30 px-4 py-3 text-sm text-green-300">
              {otpInfoMessage}
            </div>
          )}

          {otpError && (
            <div className="mb-5 rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {otpError}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-gray-300 mb-2">
                Verification Code
              </label>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resendLoading}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {resendLoading
                ? "Resending..."
                : resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Create Account
        </h1>

        <p className="text-gray-400 text-center mb-8">
          Start your gamified learning journey 🚀
        </p>

        {signupError && (
          <div className="mb-5 rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {signupError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-2">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

        <div>
          <label className="block text-gray-300 mb-2">
            Username
          </label>
          <input 
          type="text" 
          value={username}
          onChange={(e) => {

            const value = e.target.value;

            setUsername(value);

            const error = validateUsername(value);

            setUsernameError(error);            
          }}
           placeholder="Choose a username"
           className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
           required
          />
          {usernameError && (
            <p className="mt-2 text-sm text-red-400">
              {usernameError}
            </p>
          )}
        </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={signupLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
          >
            {signupLoading ? "Sending code..." : "Create Account"}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <Link 
          to="/login"
          className="text-blue-400 cursor-pointer hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;