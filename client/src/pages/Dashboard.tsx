import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pingActivity } from "../services/activityService"; // NEW
import { getMessages, sendMessage } from "../services/messageService";
import type { Message } from "../types/message";

function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [noCollegeNotice, setNoCollegeNotice] = useState<string | null>(null);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    pingActivity().catch((error) => {
      console.error("Failed to ping activity:", error);
    });
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setMessagesLoading(true);
        setMessagesError(null);
        setNoCollegeNotice(null);

        const data = await getMessages();
        setMessages(data.messages);

        if (!data.college) {
          setNoCollegeNotice(
            data.message ||
              "Set your college in your profile to join a community chat."
          );
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        setMessagesError("Failed to load messages.");
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, []);

  const handleSend = async () => {
    const trimmed = newMessage.trim();

    if (!trimmed || sending) {
      return;
    }

    try {
      setSending(true);
      setSendError(null);

      const savedMessage = await sendMessage(trimmed);

      setMessages((prev) => [savedMessage, ...prev]);
      setNewMessage("");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const backendMessage = error?.response?.data?.message;
      setSendError(backendMessage || "Failed to send message. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b13] flex flex-col font-sans antialiased">

      {/* Navbar */}
      <nav className="w-full bg-[#12121c]/95 backdrop-blur border-b border-white/10 px-6 py-4 sticky top-0 z-10 shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="text-2xl font-bold tracking-tight bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Gamified Learning
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">

            {/* College Rank */}
            <div className="text-center px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <p className="text-slate-400 text-xs uppercase tracking-wide">
                Your College Rank
              </p>

              <p className="text-white font-semibold text-lg">
                #12
              </p>
            </div>

            {/* AI Assistant */}
            <Link
              to="/ai-assistant"
              className="text-slate-300 hover:text-indigo-300 transition text-sm font-medium flex items-center gap-1"
            >
              🤖 AI Assistant
            </Link>

            {/* Profile Circle */}
            <Link
            to="/profile"
              className="w-11 h-11 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white font-semibold text-lg hover:from-indigo-400 hover:to-violet-500 transition flex items-center justify-center shadow-md shadow-indigo-900/40"
            >
               U
            </Link>

            {/* Premium */}
            <button
              className="bg-linear-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-[#0b0b13] font-semibold px-5 py-2 rounded-lg transition shadow-md shadow-amber-900/30"
            >
              Premium
            </button>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">

        {noCollegeNotice && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {noCollegeNotice}{" "}
            <Link to="/edit-profile" className="underline hover:text-amber-200">
              Set it now
            </Link>
          </div>
        )}

        {/* Messages List — newest first, scrolls independently */}
        <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-2">

          {messagesLoading && (
            <p className="text-slate-400 text-sm">Loading messages...</p>
          )}

          {!messagesLoading && messagesError && (
            <p className="text-rose-400 text-sm">{messagesError}</p>
          )}

          {!messagesLoading && !messagesError && messages.length === 0 && !noCollegeNotice && (
            <p className="text-slate-500 text-sm">No messages yet. Say something!</p>
          )}

          {!messagesLoading &&
            !messagesError &&
            messages.map((msg) => (
              <div
                key={msg._id}
                className="bg-[#161622] border border-white/10 hover:border-indigo-500/30 rounded-2xl px-5 py-3 text-slate-100 transition"
              >
                <p className="leading-relaxed">{msg.text}</p>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-slate-500 text-xs">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>

                  <p className="text-indigo-300 text-xs font-medium">
                    {msg.user?.name || msg.user?.username || "Unknown"}
                  </p>
                </div>
              </div>
            ))}

        </div>

      </main>

      {/* Message Bar */}
      <div className="w-full border-t border-white/10 bg-[#12121c]/95 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto">

          {sendError && (
            <p className="text-rose-400 text-sm mb-2">{sendError}</p>
          )}

          <div className="flex items-center gap-3">

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              className="flex-1 bg-[#1a1a28] text-white placeholder-slate-500 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />

            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
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

export default Dashboard;