import { Response } from "express";
import Message from "../models/Message.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

// GET /api/messages -> returns the logged-in user's messages, latest first
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const messages = await Message.find({ user: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/messages -> creates a new message for the logged-in user
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

    const newMessage = await Message.create({
      user: userId,
      text: text.trim(),
    });

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error("Create message error:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
};