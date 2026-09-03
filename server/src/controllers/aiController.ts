import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { getOllamaChatResponse } from "../services/ollamaService.js";

interface IncomingChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_MESSAGES = 20; // keeps the request small and Ollama fast

// POST /api/ai/chat -> takes the full conversation so far (from the
// authenticated user only) and returns the AI's next reply. Ollama is
// only ever called from here, never directly from the frontend.
export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { messages } = req.body as { messages: IncomingChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages array is required" });
    }

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage.role !== "user" ||
      !lastMessage.content ||
      !lastMessage.content.trim()
    ) {
      return res
        .status(400)
        .json({ message: "The last message must be a non-empty user message" });
    }

    // Only send the most recent N messages to keep latency reasonable.
    const trimmedHistory = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await getOllamaChatResponse(trimmedHistory);

    return res.status(200).json({
      reply: {
        role: "assistant",
        content: reply,
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      message:
        "Failed to get a response from the AI Assistant. Make sure Ollama is running locally.",
    });
  }
};