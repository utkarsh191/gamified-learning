import axios from "axios";
import { Message } from "../types/message";

const API_URL = "http://localhost:5000/api/messages";

export const getMessages = async (): Promise<Message[]> => {
  const token = localStorage.getItem("token");

  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.messages;
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