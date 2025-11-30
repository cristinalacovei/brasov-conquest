import React from "react";
import { Map as MapIcon, LogOut } from "lucide-react";

const GameHeader = ({
  gameMode,
  roomCode,
  gameState,
  isMyTurn,
  currentPlayerName,
  playerName,
  selectedColor,
  onLeave,
}) => {
  return (
    <div className="w-full bg-slate-800 border-b border-slate-700 p-4 shadow-lg z-40 sticky top-0">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">
            <MapIcon size={20} className="text-yellow-500" />
          </div>
          <div>
            {gameMode === "MULTI" ? (
              <h1 className="font-bold text-lg leading-none">
                Room: {roomCode}
              </h1>
            ) : (
              <h1 className="font-bold text-lg leading-none text-blue-400">
                Singleplayer
              </h1>
            )}
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>
                FAZA:{" "}
                <span className="text-yellow-400 font-bold">
                  {gameState.phase}
                </span>
              </span>

              {/* --- MODIFICAREA ESTE AICI --- */}
              {gameState.phase === "BATTLE" && (
                <span className="bg-slate-700 px-2 py-0.5 rounded text-white font-bold ml-2">
                  RUNDA: {gameState.battleRound} /{" "}
                  {gameState.maxBattleRounds || 10}
                </span>
              )}
              {/* ----------------------------- */}
            </p>
          </div>
        </div>

        <div
          className={`px-6 py-2 rounded-full border font-bold flex items-center gap-3 transition-all ${
            isMyTurn
              ? "bg-green-600/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              : "bg-slate-900 border-slate-600 text-slate-500"
          }`}
        >
          {isMyTurn && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
          {isMyTurn ? "RÂNDUL TĂU" : `Așteaptă: ${currentPlayerName}`}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onLeave}
            className="mr-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            title="Părăsește Jocul"
          >
            <LogOut size={20} />
          </button>
          <div className="text-right">
            <p className="text-sm font-bold">{playerName}</p>
            <p className="text-xs text-slate-400">Comandant</p>
          </div>
          <div
            className="w-10 h-10 rounded-full border-2 border-white"
            style={{ backgroundColor: selectedColor }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
