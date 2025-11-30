import React from "react";
import { Crown, LogOut } from "lucide-react";

const GameOverModal = ({ winner, onRestart }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-slate-800 border-4 border-yellow-500 rounded-3xl max-w-lg w-full p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none"></div>
        <Crown
          size={80}
          className="text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce"
        />
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-wider">
          Joc Terminat!
        </h2>
        <div className="my-8">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">
            Câștigătorul este
          </p>
          <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 drop-shadow-sm">
            {winner}
          </p>
        </div>
        <button
          onClick={onRestart}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
        >
          <LogOut size={24} /> ÎNAPOI ÎN MENIU
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
