import React from "react";
import { LogOut, Swords, X, MessageCircle } from "lucide-react";
import ChatWindow from "./ChatWindow"; // Asigură-te că ChatWindow.jsx este în același folder

const GameLobby = ({
  roomCode,
  players,
  onLeave,
  chatOpen,
  setChatOpen,
  messages,
  onSendMessage,
  currentUserId,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4 relative">
      <button
        onClick={onLeave}
        className="absolute top-6 right-6 flex items-center gap-2 text-red-400 hover:text-red-300 font-bold bg-slate-800 px-4 py-2 rounded-lg border border-red-500/30 transition-all hover:border-red-500"
      >
        <LogOut size={18} /> Ieși
      </button>
      <div className="bg-slate-800/50 p-10 rounded-3xl border border-slate-700 text-center max-w-2xl w-full backdrop-blur-sm">
        <div className="mb-6 inline-block p-4 bg-slate-900 rounded-full border border-slate-600">
          <Swords size={48} className="text-yellow-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Camera: <span className="text-yellow-400">{roomCode}</span>
        </h2>
        <p className="text-slate-400 mb-8">Se așteaptă adversarul...</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.values(players).map((p) => (
            <div
              key={p.id}
              className="bg-slate-700 p-4 rounded-xl flex items-center gap-4 border-2 border-slate-600 relative overflow-hidden"
            >
              {!p.online && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-400 font-bold text-xs uppercase tracking-widest">
                  Deconectat
                </div>
              )}
              <div
                className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: p.color }}
              ></div>
              <div className="text-left">
                <div className="font-bold text-lg">{p.name}</div>
                <div
                  className={`text-xs font-mono ${
                    p.online ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {p.online ? "PREGĂTIT" : "OFFLINE"}
                </div>
              </div>
            </div>
          ))}
          {Object.keys(players).length < 2 && (
            <div className="bg-slate-800/50 p-4 rounded-xl flex items-center gap-4 border-2 border-dashed border-slate-700 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse"></div>
              <div>Așteptare...</div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg transition-all z-50 hover:scale-110"
      >
        {chatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      <ChatWindow
        messages={messages}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onSend={onSendMessage}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default GameLobby;
