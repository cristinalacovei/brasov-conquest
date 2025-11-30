import React from "react";
import { Bot, Users } from "lucide-react";

const GameMenu = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 text-center max-w-lg w-full space-y-12 animate-in fade-in zoom-in duration-500">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tight drop-shadow-2xl">
            BRAȘOV <span className="text-yellow-400">CONQUEST</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium tracking-wide">
            Cucerește orașul cartier cu cartier!
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectMode("SINGLE_SETUP", "SINGLEPLAYER")}
            className="w-full group relative overflow-hidden bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-yellow-400 p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl text-left flex items-center gap-6"
          >
            <div className="bg-slate-900 p-4 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
              <Bot
                size={40}
                className="text-white group-hover:text-yellow-400 transition-colors"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Singleplayer
              </h3>
              <p className="text-slate-400 text-sm">
                Joacă împotriva unui robot. Nu necesită internet rapid.
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelectMode("MULTI_SETUP", "MULTI")}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-900/50 to-slate-800 hover:from-blue-800/50 hover:to-slate-700 border-2 border-blue-500/30 hover:border-blue-400 p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl text-left flex items-center gap-6"
          >
            <div className="bg-blue-900/50 p-4 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              <Users
                size={40}
                className="text-blue-200 group-hover:text-blue-400 transition-colors"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Multiplayer
              </h3>
              <p className="text-blue-200/70 text-sm">
                Provoacă un prieten folosind un cod de cameră.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
