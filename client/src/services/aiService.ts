import axios from "axios";
import type { ChatMessage } from "../types/ai";

const API_URL = "http://localhost:5000/api/ai";

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