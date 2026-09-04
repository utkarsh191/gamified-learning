import axios from "axios";
import type { ChatMessage } from "../types/ai";

const API_URL = "import.meta.env.VITE_API_URL/ai";

export const sendChatMessage = async (
  messages: ChatMessage[]
): Promise<ChatMessage> => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/chat`,
    { messages },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.reply;
};

// "Analyze My Progress" — backend gathers the logged-in user's own data
// from the DB (XP, streak, solved count, etc.) and asks Ollama for a
// structured analysis. No user data is sent from the frontend.
export const analyzeProgress = async (): Promise<ChatMessage> => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/analyze`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.reply;
};