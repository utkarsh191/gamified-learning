import mongoose, { Document, Schema } from "mongoose";

export interface IDailyActivityEntry {
  date: string;
  githubCount: number;
  leetcodeCount: number;
}

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

  // App's OWN activity streak — completely separate from GitHub/LeetCode.
  activityDates: string[];
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;

  // NEW — cached heatmap data (per-day GitHub commit count + LeetCode
  // submission count). Kept completely separate from githubXP/leetcodeXP/
  // totalXP above — this cache is ONLY read to render the heatmap fast on
  // reload, it is never summed into the XP fields.
  codingActivityCache: IDailyActivityEntry[];
  codingActivityCacheUpdatedAt?: Date;

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

    // Cached XP fields — untouched, still the single source of truth for
    // Profile page's Total XP display.
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

    // App's own activity streak fields — untouched
    activityDates: {
      type: [String],
      default: [],
    },

    currentStreak: {
      type: Number,
      default: 0,
    },

    maxStreak: {
      type: Number,
      default: 0,
    },

    totalActiveDays: {
      type: Number,
      default: 0,
    },

    // NEW — heatmap cache. Plain subdocument array, no separate model
    // needed since it's always read/written as a whole per user.
    codingActivityCache: {
      type: [
        {
          date: { type: String, required: true },
          githubCount: { type: Number, default: 0 },
          leetcodeCount: { type: Number, default: 0 },
        },
      ],
      default: [],
    },

    codingActivityCacheUpdatedAt: {
      type: Date,
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