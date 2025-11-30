import React from "react";
import { Trophy, WifiOff, Swords } from "lucide-react";

const GameSidebar = ({ players, gameState, currentUserId }) => {
  return (
    <div className="w-full lg:w-80 flex flex-col gap-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={18} />
          <h3 className="font-bold text-slate-200 uppercase text-sm tracking-wider">
            Clasament
          </h3>
        </div>
        <div className="p-2">
          {Object.values(players)
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl mb-1 ${
                  gameState.playerIds[gameState.turnIndex] === p.id
                    ? "bg-white/5 border border-white/10"
                    : ""
                } ${
                  !p.online
                    ? "opacity-50 grayscale border-red-500/30 border"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold w-4 text-sm">
                    {i + 1}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full border border-slate-500 shadow-sm"
                    style={{ backgroundColor: p.color }}
                  ></div>
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        p.id === currentUserId ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {p.name} {p.id === currentUserId && "(Tu)"}
                    </div>
                    {!p.online && (
                      <div className="text-[10px] text-red-400 font-bold animate-pulse flex items-center gap-1">
                        <WifiOff size={10} /> DECONECTAT
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-mono font-bold text-yellow-400 text-lg">
                  {p.score}
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="bg-blue-900/20 rounded-2xl border border-blue-500/20 p-5 text-sm text-blue-200/80">
        <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
          <Swords size={16} /> Misiune:
        </h4>
        <p>
          {gameState.phase === "EXPANSION"
            ? "Cucerește teritorii neutre (Gri)."
            : "Atacă vecinii. Nu îți pierde pământul!"}
        </p>
      </div>
    </div>
  );
};

export default GameSidebar;
