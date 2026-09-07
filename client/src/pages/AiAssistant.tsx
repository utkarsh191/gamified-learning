import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { sendChatMessage, analyzeProgress } from "../services/aiService";
import type { ChatMessage } from "../types/ai";

function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, analyzing]);

  const handleSend = async () => {
    const trimmed = input.trim();

    if (!trimmed || sending || analyzing) {
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const reply = await sendChatMessage(updatedMessages);
      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      console.error("AI chat failed:", err);
      const backendMessage = err?.response?.data?.message;
      setError(
        backendMessage ||
          "Failed to reach the AI Assistant. Try again in a moment."
      );
    } finally {
      setSending(false);
    }
  };

  const handleAnalyzeProgress = async () => {
    if (sending || analyzing) {
      return;
    }

    setError(null);
    setAnalyzing(true);

    // Show what the user "asked for" in the chat, for context/continuity
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "📊 Analyze My Progress" },
    ]);

    try {
      const reply = await analyzeProgress();
      setMessages((prev) => [...prev, reply]);
    } catch (err: any) {
      console.error("Progress analysis failed:", err);
      const backendMessage = err?.response?.data?.message;
      setError(
        backendMessage || "Failed to analyze progress. Try again in a moment."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const busy = sending || analyzing;

  return (
    <div className="min-h-screen bg-[#0f0f17] flex flex-col font-sans antialiased">

      {/* Navbar */}
      <nav className="w-full bg-[#161622] border-b border-white/10 px-6 py-4 shadow-md shadow-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-slate-400 hover:text-white transition"
            >
              ←
            </Link>

            <div className="text-2xl font-semibold tracking-tight text-white">
              🤖 AI Assistant
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAnalyzeProgress}
              disabled={busy}
              className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm shadow-emerald-900/40"
            >
              {analyzing ? "Analyzing..." : "📊 Analyze My Progress"}
            </button>

            <Link
              to="/dashboard"
              className="text-slate-400 hover:text-white transition text-sm"
            >
              Back to Dashboard
            </Link>
          </div>

        </div>
      </nav>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col">

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">

          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
              <p className="text-4xl mb-3">🤖</p>
              <p className="font-medium text-slate-300">
                Ask me anything about coding
              </p>
              <p className="text-sm mt-1 text-slate-500">
                DSA, JavaScript, React, Node.js, MongoDB, and more.
              </p>
              <p className="text-sm mt-3 text-slate-600">
                Or click "Analyze My Progress" above for a personalized review.
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-linear-to-br from-indigo-600 to-violet-600 text-white"
                    : "bg-[#1c1c2b] border border-white/10 text-slate-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="bg-[#1c1c2b] border border-white/10 rounded-2xl px-5 py-3 text-slate-400">
                {analyzing ? "Analyzing your progress..." : "Thinking..."}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

      </main>

      {/* Message Bar */}
      <div className="w-full border-t border-white/10 bg-[#161622] px-6 py-4">
        <div className="max-w-4xl mx-auto">

          {error && (
            <p className="text-rose-400 text-sm mb-2">{error}</p>
          )}

          <div className="flex items-center gap-3">

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 bg-[#1f1f2e] text-white placeholder-slate-500 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />

            <button
              onClick={handleSend}
              disabled={busy || !input.trim()}
              className="bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-full transition shadow-sm shadow-indigo-900/40"
            >
              {sending ? "Sending..." : "Send ➤"}
            </button>

          </div>
        </div>
      </div>

    </div>
  );
}

export default AiAssistant;