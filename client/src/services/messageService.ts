import axios from "axios";
import type { Message } from "../types/message";

const API_URL = "import.meta.env.VITE_API_URL/messages";

export const getMessages = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data; // { messages, college, message? }
};

export const sendMessage = async (text: string): Promise<Message> => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    API_URL,
    { text },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.message;
};