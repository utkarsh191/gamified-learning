import mongoose, { Document, Schema } from "mongoose";

export interface IPendingSignup extends Document {
  name: string;
  username: string;
  email: string;
  password: string; // already bcrypt-hashed — copied straight into User on success
  otpHash: string;
  otpExpires: Date;
  otpAttempts: number;
  lastOtpSentAt: Date;
  createdAt: Date;
}

const pendingSignupSchema = new Schema<IPendingSignup>({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  otpHash: {
    type: String,
    required: true,
  },

  otpExpires: {
    type: Date,
    required: true,
  },

  otpAttempts: {
    type: Number,
    default: 0,
  },

  lastOtpSentAt: {
    type: Date,
    required: true,
  },

  // TTL — abandoned pending signups (never verified) auto-delete after
  // 24 hours, so a stale record can never permanently block someone from
  // signing up again with the same email.
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24,
  },
});

// One pending signup per email — a repeat signup attempt for the same
// email overwrites the previous pending record (and invalidates its OTP)
// instead of creating duplicates.
pendingSignupSchema.index({ email: 1 }, { unique: true });

const PendingSignup = mongoose.model<IPendingSignup>(
  "PendingSignup",
  pendingSignupSchema
);

export default PendingSignup;