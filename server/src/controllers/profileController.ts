import User from "../models/User.js";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const updateProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {
      name,
      college,
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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        college,
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
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

export const getProfileByUsername = async (
  req: Request,
  res: Response
) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};