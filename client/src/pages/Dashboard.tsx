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
    <div className="min-h-screen bg-gray-900 flex flex-col">

      {/* Navbar */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            🎮 Gamified Learning
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">

            {/* College Rank */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Your College Rank
              </p>

              <p className="text-white font-bold text-lg">
                #12
              </p>
            </div>

            {/* AI Assistant */}
            <Link
              to="/ai-assistant"
              className="text-gray-300 hover:text-white transition text-sm font-semibold flex items-center gap-1"
            >
              🤖 AI Assistant
            </Link>

            {/* Profile Circle */}
            <Link
            to="/profile"
              className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center"
            >
               U
            </Link>

            {/* Premium */}
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-5 py-2 rounded-lg transition"
            >
              Premium
            </button>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">

        {noCollegeNotice && (
          <div className="mb-4 rounded-lg border border-yellow-600 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-300">
            {noCollegeNotice}{" "}
            <Link to="/edit-profile" className="underline hover:text-yellow-200">
              Set it now
            </Link>
          </div>
        )}

        {/* Messages List — newest first, scrolls independently */}
        <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-2">

          {messagesLoading && (
            <p className="text-gray-400 text-sm">Loading messages...</p>
          )}

          {!messagesLoading && messagesError && (
            <p className="text-red-400 text-sm">{messagesError}</p>
          )}

          {!messagesLoading && !messagesError && messages.length === 0 && !noCollegeNotice && (
            <p className="text-gray-500 text-sm">No messages yet. Say something!</p>
          )}

          {!messagesLoading &&
            !messagesError &&
            messages.map((msg) => (
              <div
                key={msg._id}
                className="bg-gray-800 border border-gray-700 rounded-2xl px-5 py-3 text-white"
              >
                <p>{msg.text}</p>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-500 text-xs">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>

                  <p className="text-gray-400 text-xs font-medium">
                    {msg.user?.name || msg.user?.username || "Unknown"}
                  </p>
                </div>
              </div>
            ))}

        </div>

      </main>

      {/* Message Bar */}
      <div className="w-full border-t border-gray-700 bg-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">

          {sendError && (
            <p className="text-red-400 text-sm mb-2">{sendError}</p>
          )}

          <div className="flex items-center gap-3">

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              className="flex-1 bg-gray-700 text-white rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-full transition"
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