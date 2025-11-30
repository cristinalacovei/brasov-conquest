import { useEffect, useState } from "react";
import io from "socket.io-client";
import BrasovMap from "./components/BrasovMap";
import TriviaModal from "./components/TriviaModal";
import { Trophy, Swords, Map as MapIcon, Crown, User } from "lucide-react";

const socket = io.connect("http://localhost:3001");
const PLAYER_COLORS = [
  { hex: "#ef4444", name: "Red" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#a855f7", name: "Purple" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#eab308", name: "Yellow" },
];

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  // Game Data
  const [territories, setTerritories] = useState({});
  const [players, setPlayers] = useState({});
  const [gameState, setGameState] = useState({
    status: "LOBBY",
    phase: "",
    turnIndex: 0,
    playerIds: [],
    battleRound: 0,
  });
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [notification, setNotification] = useState(null);

  // Login Data
  const [hasJoined, setHasJoined] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0].hex);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      setSocketId(socket.id);
    });
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("update_map", setTerritories);
    socket.on("update_players", setPlayers);
    socket.on("update_gamestate", setGameState);
    socket.on("trivia_question", (q) => {
      setCurrentQuestion(q);
      setNotification(null);
    });
    socket.on("battle_result", (res) => {
      setCurrentQuestion(null);
      setNotification(res);
      setTimeout(() => setNotification(null), 3000);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!playerName) return;
    socket.emit("join_game", { name: playerName, color: selectedColor });
    setHasJoined(true);
  };

  const handleAnswerSubmit = (index) => socket.emit("submit_answer", index);
  const handleTerritoryClick = (id) => socket.emit("initiate_attack", id);

  // Helpers
  const isMyTurn =
    gameState.status === "PLAYING" &&
    gameState.playerIds[gameState.turnIndex] === socketId;
  const currentPlayerName =
    players[gameState.playerIds[gameState.turnIndex]]?.name || "Unknown";

  // LOGIN  ---
  if (!hasJoined) {
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900">
        {/* left part */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 z-10 bg-slate-900 shadow-2xl">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                BRAȘOV <span className="text-yellow-400">CONQUEST</span>
              </h1>
              <p className="text-slate-400 text-lg">Trivia game </p>
            </div>

            <form onSubmit={handleJoinGame} className="space-y-6 mt-8">
              <div>
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                  Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-3.5 text-slate-500"
                    size={20}
                  />
                  <input
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-yellow-400 focus:outline-none transition-all font-bold text-lg"
                    placeholder="Ex: player"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 block">
                  Choose your color
                </label>
                <div className="flex gap-4 flex-wrap">
                  {PLAYER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
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
                disabled={!playerName}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 mt-4"
              >
                ENTER BATTLE {/* Translated from INTRĂ ÎN LUPTĂ */}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              Server Status: {isConnected ? "Online" : "Connecting..."}
            </div>
          </div>
        </div>

        {/* Right part */}
        <div className="hidden md:flex w-1/2 bg-slate-800 relative overflow-hidden items-center justify-center p-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          {}
          <div className="w-full max-w-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700 scale-110 opacity-90 pointer-events-none grayscale-[0.2]">
            <BrasovMap
              territories={territories}
              onTerritoryClick={() => {}}
              players={players}
              currentPlayerId={null}
            />
          </div>
          <div className="absolute bottom-10 text-slate-500 font-mono text-xs">
            © 2025 Brașov Conquest • Multiplayer Strategy
          </div>
        </div>
      </div>
    );
  }

  // ---  LOBBY (WAITING) ---
  if (gameState.status === "LOBBY") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-slate-800/50 p-10 rounded-3xl border border-slate-700 text-center max-w-2xl w-full backdrop-blur-sm">
          <div className="mb-6 inline-block p-4 bg-slate-900 rounded-full border border-slate-600">
            <Swords size={48} className="text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Waiting Lobby</h2>{" "}
          {/* Translated from Lobby de Așteptare */}
          <p className="text-slate-400 mb-8">
            Waiting for the second player to join...
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.values(players).map((p) => (
              <div
                key={p.id}
                className="bg-slate-700 p-4 rounded-xl flex items-center gap-4 border-2 border-slate-600"
              >
                <div
                  className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: p.color }}
                ></div>
                <div className="text-left">
                  <div className="font-bold text-lg">{p.name}</div>
                  <div className="text-xs text-slate-400 font-mono">READY</div>
                </div>
              </div>
            ))}
            {Object.keys(players).length < 2 && (
              <div className="bg-slate-800/50 p-4 rounded-xl flex items-center gap-4 border-2 border-dashed border-slate-700 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse"></div>
                <div>Waiting...</div>
              </div>
            )}
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 w-1/2 animate-[pulse_2s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  //  GAMEPLAY (FULL WIDTH) ---
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center font-sans relative overflow-x-hidden">
      {currentQuestion && (
        <TriviaModal data={currentQuestion} onAnswer={handleAnswerSubmit} />
      )}

      {notification && (
        <div
          className={`fixed top-24 z-[100] px-8 py-3 rounded-xl shadow-2xl font-black text-xl border-2 animate-bounce ${
            notification.success
              ? "bg-green-600 border-green-400"
              : "bg-red-600 border-red-400"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* --- HEADER BAR */}
      <div className="w-full bg-slate-800 border-b border-slate-700 p-4 shadow-lg z-40 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">
              <MapIcon size={20} className="text-yellow-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">
                Brașov Conquest
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                PHASE:{" "}
                <span className="text-yellow-400 font-bold">
                  {gameState.phase}
                </span>
              </p>
            </div>
          </div>

          {/* TURN INDICATOR */}
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
            {isMyTurn ? "YOUR TURN" : `Waiting: ${currentPlayerName}`}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold">{playerName}</p>
              <p className="text-xs text-slate-400">Commander</p>{" "}
              {/* Translated from Comandant */}
            </div>
            <div
              className="w-10 h-10 rounded-full border-2 border-white"
              style={{ backgroundColor: selectedColor }}
            ></div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="flex flex-col lg:flex-row w-full max-w-[1600px] gap-6 p-4 flex-grow">
        {/* LEFT: MAP (Flex Grow) */}
        <div
          className={`flex-1 bg-slate-800/30 rounded-3xl border border-slate-700/50 p-2 md:p-6 transition-opacity duration-500 relative ${
            !isMyTurn ? "opacity-70" : ""
          }`}
        >
          {!isMyTurn && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full text-white font-bold border border-white/20">
                Waiting for your turn...
              </div>
            </div>
          )}
          <BrasovMap
            territories={territories}
            onTerritoryClick={handleTerritoryClick}
            players={players}
            currentPlayerId={socketId}
          />
        </div>

        {/* RIGHT: LEADERBOARD & INFO (Fixed width on large screens) */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Leaderboard Panel */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={18} />
              <h3 className="font-bold text-slate-200 uppercase text-sm tracking-wider">
                Leaderboard {/* Translated from Clasament */}
              </h3>
            </div>
            <div className="p-2">
              {Object.values(players)
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl mb-1 transition-colors ${
                      gameState.playerIds[gameState.turnIndex] === p.id
                        ? "bg-white/5 border border-white/10"
                        : "hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold w-4 ${
                          i === 0 ? "text-yellow-400" : "text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full border border-slate-500 shadow-sm"
                        style={{ backgroundColor: p.color }}
                      ></div>
                      <div>
                        <div
                          className={`text-sm font-bold ${
                            p.id === socketId ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {p.name}
                        </div>
                        {gameState.playerIds[gameState.turnIndex] === p.id && (
                          <div className="text-[10px] text-green-400 font-mono leading-none">
                            ACTIVE TURN
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

          {/* Instructions Panel */}
          <div className="bg-blue-900/20 rounded-2xl border border-blue-500/20 p-5 text-sm text-blue-200/80">
            <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
              <Swords size={16} /> Current Mission:
            </h4>
            {gameState.phase === "EXPANSION" ? (
              <p>
                Conquer neutral territories (Grey). Answer questions correctly
                to accumulate points and land.
              </p>
            ) : (
              <p>
                Attack enemy neighbors! You can only attack territories that
                border your own.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
