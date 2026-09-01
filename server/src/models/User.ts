import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  college?: string;
  location?: string;
  githubUsername?: string;
  linkedinUsername?: string;
  leetcodeUsername?: string;
  xUsername?: string;
  readMe?: string;
  workExperience?: string;
  education?: string;
  skills?: string;
  currentLearning?: string;
  interests?: string;
  learningGoals?: string;

  // Cached activity XP — populated after a GitHub/LeetCode fetch,
  // read instantly on Profile load instead of waiting on external APIs.
  githubXP?: number;
  leetcodeXP?: number;
  totalXP?: number;
  leetcodeTotalSolved?: number;

  email: string;
  password: string;
  role: "student" | "admin";
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    college: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    githubUsername: {
      type: String,
      trim: true,
    },

    linkedinUsername: {
      type: String,
      trim: true,
    },

    leetcodeUsername: {
      type: String,
      trim: true,
    },

    xUsername: {
      type: String,
      trim: true,
    },

    readMe: {
      type: String,
      trim: true,
    },

    workExperience: {
      type: String,
      trim: true,
    },

    education: {
      type: String,
      trim: true,
    },

    skills: {
      type: String,
      trim: true,
    },

    currentLearning: {
      type: String,
      trim: true,
    },

    interests: {
      type: String,
      trim: true,
    },

    learningGoals: {
      type: String,
      trim: true,
    },

    // Cached XP fields — default 0 so a brand-new user renders "0" instead
    // of undefined/NaN before their first GitHub/LeetCode fetch completes.
    githubXP: {
      type: Number,
      default: 0,
    },

    leetcodeXP: {
      type: Number,
      default: 0,
    },

    totalXP: {
      type: Number,
      default: 0,
    },

    leetcodeTotalSolved: {
      type: Number,
      default: 0,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;