import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import PendingSignup from "../models/PendingSignup.js";
import { sendPasswordResetEmail, sendOtpEmail } from "../services/emailService.js";

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// crypto.randomInt is cryptographically secure (unlike Math.random). The
// range [100000, 1000000) guarantees a fixed 6-digit string every time —
// never a shorter number missing a leading digit.
const generateOtp = (): string => crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp: string): string =>
  crypto.createHash("sha256").update(otp).digest("hex");

export const register = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Name, username, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
    return res.status(409).json({
     message: "Username already exists",
    });
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    )

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);

     if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];

     return res.status(409).json({
      message: `${field} already exists`,
    });
  }

    return res.status(500).json({
      message: "Server error",
    });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// POST /api/auth/forgot-password -> generates a time-limited reset token
// and emails the reset link. Always returns the same generic message
// whether or not the email is registered, so this endpoint can never be
// used to enumerate valid accounts.
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const genericMessage =
      "If that email is registered, a password reset link has been sent.";

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    // Raw token is emailed to the user and never stored anywhere. Only
    // its SHA-256 hash is persisted, so a database read alone can never
    // produce a usable reset link.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);

      // Don't leave a valid, un-deliverable token sitting on the account.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: "Failed to send reset email. Please try again later.",
      });
    }

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/reset-password/:token -> verifies the raw token from the
// URL against the stored hash + expiry, then sets a new password using
// the SAME bcrypt hashing register()/login() already rely on.
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/signup/initiate -> validates signup details, checks for
// existing accounts, generates + emails a 6-digit OTP, and only THEN
// persists a PendingSignup record (password already bcrypt-hashed, ready
// to copy into a real User once the OTP is verified). No User account is
// created at this step — sending happens BEFORE persisting, so a failed
// email send never leaves a stale/unreachable pending record behind.
export const initiateSignup = async (req: Request, res: Response) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Name, username, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const existingUsernameUser = await User.findOne({ username });

    if (existingUsernameUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("Failed to send signup OTP email:", emailError);
      return res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
      });
    }

    // One pending signup per email — a repeat attempt for the same email
    // overwrites the previous pending record and its OTP entirely, so the
    // old OTP becomes invalid immediately.
    await PendingSignup.findOneAndUpdate(
      { email },
      {
        name,
        username,
        email,
        password: hashedPassword,
        otpHash,
        otpExpires: new Date(Date.now() + OTP_EXPIRY_MS),
        otpAttempts: 0,
        lastOtpSentAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Verification code sent to your email.",
      email,
    });
  } catch (error: any) {
    console.error("Initiate signup error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ message: `${field} already exists` });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/signup/verify-otp -> verifies the OTP and, only on
// success, creates the real User account (using the already-hashed
// password stored on the pending record) and returns a JWT — same
// response shape as register(), so the frontend can treat it identically.
export const verifySignupOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const pending = await PendingSignup.findOne({ email });

    if (!pending) {
      return res.status(400).json({
        message: "No pending signup found for this email. Please sign up again.",
      });
    }

    if (pending.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        message: "Verification code has expired. Please request a new one.",
      });
    }

    if (pending.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(400).json({
        message: "Too many incorrect attempts. Please request a new verification code.",
      });
    }

    const providedHash = hashOtp(otp);

    if (providedHash !== pending.otpHash) {
      pending.otpAttempts += 1;
      await pending.save();

      const remaining = MAX_OTP_ATTEMPTS - pending.otpAttempts;

      return res.status(400).json({
        message:
          remaining > 0
            ? `Incorrect verification code. ${remaining} attempt${
                remaining === 1 ? "" : "s"
              } remaining.`
            : "Incorrect verification code. Please request a new one.",
      });
    }

    let user;

    try {
      user = await User.create({
        name: pending.name,
        username: pending.username,
        email: pending.email,
        password: pending.password, // already bcrypt-hashed at initiate step
      });
    } catch (createError: any) {
      // Someone else claimed this email/username between initiate and
      // verify — clean up the now-unusable pending record.
      await PendingSignup.deleteOne({ _id: pending._id });

      if (createError.code === 11000) {
        const field = Object.keys(createError.keyPattern)[0];
        return res.status(409).json({ message: `${field} already exists` });
      }

      throw createError;
    }

    await PendingSignup.deleteOne({ _id: pending._id });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Email verified. Account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify signup OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/signup/resend-otp -> issues a fresh OTP for an existing
// pending signup, enforcing a cooldown based on when the last OTP was
// actually sent. The old OTP stays valid unless/until the new one is
// both successfully emailed AND persisted.
export const resendSignupOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const pending = await PendingSignup.findOne({ email });

    if (!pending) {
      return res.status(400).json({
        message: "No pending signup found for this email. Please sign up again.",
      });
    }

    const elapsed = Date.now() - pending.lastOtpSentAt.getTime();

    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds} second${
          waitSeconds === 1 ? "" : "s"
        } before requesting another code.`,
        retryAfterSeconds: waitSeconds,
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("Failed to resend signup OTP email:", emailError);
      return res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
      });
    }

    pending.otpHash = otpHash;
    pending.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    pending.otpAttempts = 0;
    pending.lastOtpSentAt = new Date();
    await pending.save();

    return res.status(200).json({
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend signup OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};