import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import githubRoutes from "./routes/githubRoutes.js";
import leetcodeRoutes from "./routes/leetcodeRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import aiRoutes from "./routes/aiRoutes.js"; // NEW

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());


app.get("/", (req, res) => {
  res.json({
    message: "Gamified Learning API is running 🚀",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes); // NEW

export default app;