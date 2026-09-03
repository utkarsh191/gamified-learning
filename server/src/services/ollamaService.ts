interface OllamaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
}

const BASE_SYSTEM_PROMPT = `You are a helpful learning assistant for a platform called "Gamified Learning". You help students with programming, DSA, web development, JavaScript, TypeScript, React, Node.js, MongoDB, and other coding/learning topics. Keep answers clear, correct, and reasonably concise unless the user asks for more detail.`;

// Calls the local Ollama server's /api/chat endpoint with the full
// conversation history so far, plus a fixed system prompt. Ollama itself
// is never exposed to the browser — this is the only place that talks to
// it, and it's only ever invoked from the backend controller.
//
// userContext (optional) — a short summary of the logged-in user's own
// existing data (XP, streak, etc.), appended to the system prompt so the
// AI can give personalized answers when relevant, while still answering
// generic questions normally when the context isn't needed.
export const getOllamaChatResponse = async (
  conversation: OllamaChatMessage[],
  userContext?: string
): Promise<string> => {
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaModel = process.env.OLLAMA_MODEL;

  if (!ollamaUrl || !ollamaModel) {
    throw new Error("OLLAMA_URL or OLLAMA_MODEL is not configured in .env");
  }

  const systemPrompt = userContext
    ? `${BASE_SYSTEM_PROMPT}\n\nHere is the current logged-in user's own progress data on this platform. Use it ONLY if the user's question is about their own progress, learning plan, or performance — otherwise ignore it and answer normally:\n${userContext}`
    : BASE_SYSTEM_PROMPT;

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [{ role: "system", content: systemPrompt }, ...conversation],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data: OllamaChatResponse = await response.json();

  if (!data.message?.content) {
    throw new Error("Ollama returned an empty response");
  }

  return data.message.content;
};