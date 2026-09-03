import { Response } from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

// GET /api/messages -> returns messages for the logged-in user's college
// ONLY. The college is read from the authenticated user's DB record —
// never from any request param/query — so a user can never see another
// college's chat by tampering with the request.
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUser = await User.findById(userId).select("college");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.college) {
      // No community chat to show until the user sets a college.
      return res.status(200).json({
        messages: [],
        college: null,
        message: "Set your college in your profile to join a community chat.",
      });
    }

    const messages = await Message.find({ college: currentUser.college })
      .sort({ createdAt: -1 })
      .populate("user", "name username");

    return res.status(200).json({
      messages,
      college: currentUser.college,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/messages -> creates a message tagged with the logged-in user's
// ACTUAL college (from DB), so it lands in the correct community chat
// regardless of anything the client might send.
export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const currentUser = await User.findById(userId).select("college");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.college) {
      return res.status(400).json({
        message: "Please set your college in your profile before sending messages.",
      });
    }

    const newMessage = await Message.create({
      user: userId,
      college: currentUser.college,
      text: text.trim(),
    });

    await newMessage.populate("user", "name username");

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error("Create message error:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
};