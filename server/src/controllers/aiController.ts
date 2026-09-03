import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { getOllamaChatResponse } from "../services/ollamaService.js";
import { buildUserContext } from "../services/userContextService.js";

interface IncomingChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY_MESSAGES = 20; // keeps the request small and Ollama fast

// POST /api/ai/chat -> takes the full conversation so far (from the
// authenticated user only) and returns the AI's next reply. Ollama is
// only ever called from here, never directly from the frontend.
// The logged-in user's own existing progress data is fetched and passed
// as context so the AI can personalize its answer WHEN relevant, while
// still answering generic questions ("what is recursion") normally.
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

    const trimmedHistory = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userContext = await buildUserContext(userId);

    const reply = await getOllamaChatResponse(trimmedHistory, userContext);

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

// POST /api/ai/analyze -> "Analyze My Progress" feature. Builds the
// logged-in user's own data context (never trusts any userId from the
// frontend), asks Ollama for a structured progress analysis, and returns
// it as a single assistant reply the frontend can drop straight into the
// chat.
export const analyzeProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userContext = await buildUserContext(userId);

    const analysisPrompt = `Based on my current progress data above, please analyze my learning progress on the platform. Structure your response with these sections:
1. Overall progress summary
2. Strengths
3. Weak areas / areas needing improvement
4. Consistency (based on my activity/streak data)
5. Recommended next topics to learn
6. Practical next steps

Only use the data actually provided above. If some data (like GitHub or LeetCode) isn't connected, mention that instead of guessing.`;

    const reply = await getOllamaChatResponse(
      [{ role: "user", content: analysisPrompt }],
      userContext
    );

    return res.status(200).json({
      reply: {
        role: "assistant",
        content: reply,
      },
    });
  } catch (error) {
    console.error("AI progress analysis error:", error);
    return res.status(500).json({
      message:
        "Failed to analyze progress. Make sure Ollama is running locally.",
    });
  }
};