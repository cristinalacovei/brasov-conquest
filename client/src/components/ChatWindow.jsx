import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

const ChatWindow = ({ messages, isOpen, onClose, onSend, currentUserId }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-80 h-96 bg-slate-800 border-2 border-slate-600 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-900 p-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <MessageCircle size={18} className="text-yellow-500" /> Chat
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800/90 scrollbar-thin scrollbar-thumb-slate-600">
        {messages.length === 0 && (
          <p className="text-slate-500 text-center text-sm italic mt-10">
            Începe conversația...
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.senderId === currentUserId ? "items-end" : "items-start"
            }`}
          >
            <span
              className="text-[10px] text-slate-400 mb-0.5 px-1"
              style={{ color: msg.senderColor }}
            >
              {msg.senderName}
            </span>
            <div
              className={`px-3 py-2 rounded-xl max-w-[85%] text-sm break-words ${
                msg.senderId === currentUserId
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-700 text-slate-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrie un mesaj..."
          className="flex-1 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
