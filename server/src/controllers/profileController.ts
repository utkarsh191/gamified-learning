import User from "../models/User.js";

import { Response } from "express";

import { AuthRequest } from "../middleware/authMiddleware.js";

export const updateProfile = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user?.userId;

  const {
    name,
    location,
    githubUsername,
    linkedinUsername,
    leetcodeUsername,
    xUsername,
    readMe,
    workExperience,
    education,
    skills,
    currentLearning,
    interests,
    learningGoals,
  } = req.body;

  console.log("User ID:", userId);

  console.log("Profile Data:", req.body);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      name,
      location,
      githubUsername,
      linkedinUsername,
      leetcodeUsername,
      xUsername,
      readMe,
      workExperience,
      education,
      skills,
      currentLearning,
      interests,
      learningGoals,
    },
    { new: true }
  );
  if (!updatedUser) {
  return res.status(404).json({
    message: "User not found",
  });
}

return res.status(200).json({
  message: "Profile updated successfully",
  user: updatedUser,
});
};