import React from "react";
import { User, Hash, ChevronLeft } from "lucide-react";

const PLAYER_COLORS = [
  { hex: "#ef4444", name: "Red" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#a855f7", name: "Purple" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#eab308", name: "Yellow" },
];

const GameSetup = ({
  uiStep,
  onBack,
  onJoin,
  playerName,
  setPlayerName,
  roomCode,
  setRoomCode,
  difficulty,
  setDifficulty,
  selectedColor,
  setSelectedColor,
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-3xl shadow-2xl relative animate-in slide-in-from-right-10 fade-in duration-300">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-bold"
        >
          <ChevronLeft size={16} /> Înapoi
        </button>

        <h2 className="text-3xl font-black text-center text-white mb-8 mt-4">
          Configurare{" "}
          <span className="text-yellow-400">
            {uiStep === "SINGLE_SETUP" ? "Solo" : "Online"}
          </span>
        </h2>

        <form onSubmit={onJoin} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Numele Tău
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-3.5 text-slate-500"
                size={20}
              />
              <input
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-yellow-400 focus:outline-none transition-all font-bold"
                placeholder="Ex: Vlad Țepeș"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
                autoFocus
              />
            </div>
          </div>

          {uiStep === "MULTI_SETUP" && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Cod Cameră
              </label>
              <div className="relative">
                <Hash
                  className="absolute left-3 top-3.5 text-slate-500"
                  size={20}
                />
                <input
                  className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-yellow-400 focus:outline-none transition-all font-bold uppercase"
                  placeholder="Ex: BRASOV1"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  maxLength={10}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Trimite acest cod prietenului tău.
              </p>
            </div>
          )}

          {uiStep === "SINGLE_SETUP" && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Dificultate Robot
              </label>
              <div className="flex gap-2">
                {["EASY", "MEDIUM", "HARD"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                      difficulty === level
                        ? "bg-slate-200 text-slate-900 border-white shadow-lg scale-105"
                        : "bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
              Alege Culoarea
            </label>
            <div className="flex gap-3 flex-wrap justify-center">
              {PLAYER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${
                    selectedColor === c.hex
                      ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-110"
                      : "border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!playerName || (uiStep === "MULTI_SETUP" && !roomCode)}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 mt-4"
          >
            {uiStep === "SINGLE_SETUP" ? "START JOC" : "INTRĂ ÎN LUPTĂ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameSetup;
