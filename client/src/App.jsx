import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  Trophy,
  Swords,
  Map as MapIcon,
  Crown,
  User,
  Hash,
} from "lucide-react";

// --- CONFIGURATION ---
// Handle environment variables safely for the preview environment
const SOCKET_URL = "http://localhost:3001";
const socket = io(SOCKET_URL, { autoConnect: false });

const PLAYER_COLORS = [
  { hex: "#ef4444", name: "Red" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#a855f7", name: "Purple" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#eab308", name: "Yellow" },
];

// --- COMPONENTS ---

const TriviaModal = ({ data, onAnswer }) => {
  if (!data) return null;

  const { category, question, options } = data;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border-2 border-yellow-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col items-center">
        {/* Dynamic Category Header */}
        <div className="absolute -top-5 bg-yellow-500 text-slate-900 px-6 py-1 rounded-full font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.6)] text-sm md:text-base">
          {category || "General Knowledge"}
        </div>

        {/* Question Display */}
        <h3 className="text-xl md:text-2xl text-white font-bold text-center mt-6 mb-8 leading-relaxed">
          {question}
        </h3>

        {/* Answer Options Grid */}
        <div className="grid grid-cols-1 gap-3 w-full">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              className="w-full p-4 bg-slate-700 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left border border-slate-600 hover:border-blue-400 shadow-md group"
            >
              <span className="opacity-50 mr-3 font-mono text-yellow-400 group-hover:text-white transition-colors">
                {index + 1}.
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Visual Timer Bar */}
        <div className="mt-8 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-red-500 w-full animate-[width_15s_linear_forwards]"></div>
        </div>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          Time is ticking...
        </p>
      </div>
    </div>
  );
};

const BrasovMap = ({
  territories,
  onTerritoryClick,
  players,
  currentPlayerId,
}) => {
  // Coloring logic: Retrieve owner color from players list
  const getFillColor = (territoryId) => {
    const ownerId = territories[territoryId]?.owner;

    if (ownerId && players[ownerId]) {
      return players[ownerId].color; // Player's specific color
    }

    return "#e2e8f0"; // Grey (Neutral)
  };

  // Styling logic: Highlight territories owned by the current player
  const getPathClass = (territoryId) => {
    const ownerId = territories[territoryId]?.owner;
    const isMine = ownerId === currentPlayerId;

    let base =
      "cursor-pointer transition-all duration-300 hover:brightness-110 ";

    if (isMine) {
      // Add thicker white stroke for my territories
      return base + "stroke-white stroke-[3px] z-10 relative";
    } else {
      return base + "stroke-slate-400 stroke-1 hover:stroke-2";
    }
  };

  const textClass =
    "fill-slate-900 font-extrabold text-[11px] pointer-events-none select-none uppercase drop-shadow-md";

  // Zone Definitions (Brașov Neighborhoods)
  const zones = [
    {
      id: "stupini",
      name: "Stupini",
      d: "M 150 20 L 450 20 L 460 150 L 320 180 L 150 140 Z",
      textX: 300,
      textY: 90,
    },
    {
      id: "bartolomeu_nord",
      name: "Bartolomeu N.",
      d: "M 150 140 L 320 180 L 280 240 L 100 200 Z",
      textX: 210,
      textY: 190,
    },
    {
      id: "bartolomeu",
      name: "Bartolomeu",
      d: "M 60 200 L 100 200 L 280 240 L 260 320 L 200 350 L 50 280 Z",
      textX: 160,
      textY: 270,
    },
    {
      id: "tractorul",
      name: "Tractorul",
      d: "M 320 180 L 460 150 L 500 220 L 400 280 L 300 240 Z",
      textX: 400,
      textY: 210,
    },
    {
      id: "triaj",
      name: "Triaj",
      d: "M 460 150 L 580 140 L 600 250 L 500 220 Z",
      textX: 535,
      textY: 190,
    },
    {
      id: "centrul_nou",
      name: "Centrul Civic",
      d: "M 280 240 L 300 240 L 400 280 L 380 330 L 260 320 Z",
      textX: 325,
      textY: 290,
    },
    {
      id: "florilor",
      name: "Florilor",
      d: "M 400 280 L 500 220 L 510 290 L 420 310 Z",
      textX: 460,
      textY: 275,
    },
    {
      id: "est_zizin",
      name: "Zizin",
      d: "M 500 220 L 600 250 L 580 380 L 510 290 Z",
      textX: 550,
      textY: 300,
    },
    {
      id: "centrul_vechi",
      name: "Centrul Vechi",
      d: "M 260 320 L 380 330 L 360 380 L 250 380 Z",
      textX: 315,
      textY: 355,
    },
    {
      id: "schei",
      name: "Schei",
      d: "M 200 350 L 260 320 L 250 380 L 240 450 L 150 420 Z",
      textX: 210,
      textY: 400,
    },
    {
      id: "astra",
      name: "Astra",
      d: "M 380 330 L 420 310 L 510 290 L 580 380 L 450 450 L 360 380 Z",
      textX: 460,
      textY: 370,
    },
    {
      id: "valea_cetatii",
      name: "Racadau",
      d: "M 360 380 L 450 450 L 400 520 L 300 480 Z",
      textX: 380,
      textY: 460,
    },
    {
      id: "noua",
      name: "Noua",
      d: "M 450 450 L 580 380 L 620 550 L 480 580 Z",
      textX: 540,
      textY: 480,
    },
    {
      id: "poiana",
      name: "Poiana Brasov",
      d: "M 150 420 L 240 450 L 220 580 L 80 550 Z",
      textX: 170,
      textY: 510,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
      <div className="relative w-full aspect-[4/3] bg-blue-100/50 rounded-3xl shadow-2xl overflow-hidden border-4 border-slate-600/50 backdrop-blur-sm">
        <svg
          viewBox="0 0 650 600"
          className="w-full h-full drop-shadow-lg absolute top-0 left-0"
        >
          <defs>
            <filter id="inner-shadow">
              <feOffset dx="0" dy="1" />
              <feGaussianBlur stdDeviation="1" result="offset-blur" />
              <feComposite
                operator="out"
                in="SourceGraphic"
                in2="offset-blur"
                result="inverse"
              />
              <feFlood floodColor="black" floodOpacity="0.2" result="color" />
              <feComposite
                operator="in"
                in="color"
                in2="inverse"
                result="shadow"
              />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>

          {zones.map((zone) => (
            <g
              key={zone.id}
              onClick={() => onTerritoryClick(zone.id)}
              className="group"
            >
              <path
                d={zone.d}
                fill={getFillColor(zone.id)}
                className={getPathClass(zone.id)}
                filter="url(#inner-shadow)"
              />
              {/* Text Shadow Layer */}
              <text
                x={zone.textX}
                y={zone.textY}
                textAnchor="middle"
                className={textClass}
                stroke="white"
                strokeWidth="3"
                opacity="0.8"
              >
                {zone.name}
              </text>
              {/* Main Text Layer */}
              <text
                x={zone.textX}
                y={zone.textY}
                textAnchor="middle"
                className={textClass}
              >
                {zone.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null); // Replaces socketId for logic

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
  const [roomCode, setRoomCode] = useState("brasov1"); // Default room
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0].hex);

  useEffect(() => {
    // 1. Check for existing session on mount
    const sessionID = localStorage.getItem("sessionID");

    if (sessionID) {
      socket.auth = { sessionID };
      socket.connect();
    } else {
      // Just connect to get a new session
      socket.connect();
    }

    socket.on("session", ({ sessionID, userID }) => {
      // 2. Attach session ID to next reconnection attempts
      socket.auth = { sessionID };
      // 3. Store in localStorage
      localStorage.setItem("sessionID", sessionID);
      // 4. Save the persistent user ID
      socket.userID = userID;
      setUserId(userID);
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => setIsConnected(false));

    // Game Updates
    socket.on("update_map", setTerritories);
    socket.on("update_players", (newPlayers) => {
      setPlayers(newPlayers);
      // If we receive player data containing our ID, it means we rejoined successfully
      if (socket.userID && newPlayers[socket.userID]) {
        setHasJoined(true);
        setPlayerName(newPlayers[socket.userID].name);
        setSelectedColor(newPlayers[socket.userID].color);
      }
    });
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
      socket.off("session");
    };
  }, []);

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!playerName || !roomCode) return;

    socket.emit("join_game", {
      name: playerName,
      color: selectedColor,
      roomId: roomCode,
    });
    setHasJoined(true);
  };

  const handleAnswerSubmit = (index) => socket.emit("submit_answer", index);
  const handleTerritoryClick = (id) => socket.emit("initiate_attack", id);

  // Helpers
  // Use 'userId' instead of 'socket.id' because socket.id changes on reconnect
  const isMyTurn =
    gameState.status === "PLAYING" &&
    gameState.playerIds[gameState.turnIndex] === userId;

  const currentPlayerName =
    players[gameState.playerIds[gameState.turnIndex]]?.name || "Unknown";

  // LOGIN SCREEN
  if (!hasJoined) {
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900">
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 z-10 bg-slate-900 shadow-2xl">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                BRAȘOV <span className="text-yellow-400">CONQUEST</span>
              </h1>
              <p className="text-slate-400 text-lg">Multiplayer Strategy</p>
            </div>

            <form onSubmit={handleJoinGame} className="space-y-6 mt-8">
              {/* Name Input */}
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
                    placeholder="Ex: Vlad Țepeș"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Room Code Input (NEW) */}
              <div>
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                  Room Code
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-3.5 text-slate-500"
                    size={20}
                  />
                  <input
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-yellow-400 focus:outline-none transition-all font-bold text-lg uppercase"
                    placeholder="Ex: BRASOV1"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Share this code with a friend to play together.
                </p>
              </div>

              {/* Color Selection */}
              <div>
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 block">
                  Choose your faction
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
                disabled={!playerName || !roomCode}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95 mt-4"
              >
                ENTER BATTLE
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              Status: {isConnected ? "Server Online" : "Connecting..."}
            </div>
          </div>
        </div>

        {/* Right side background (Map visual) */}
        <div className="hidden md:flex w-1/2 bg-slate-800 relative overflow-hidden items-center justify-center p-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="w-full max-w-2xl transform rotate-3 scale-110 opacity-40 grayscale pointer-events-none">
            <BrasovMap
              territories={territories}
              onTerritoryClick={() => {}}
              players={players}
              currentPlayerId={null}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- LOBBY (WAITING) ---
  if (gameState.status === "LOBBY") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-slate-800/50 p-10 rounded-3xl border border-slate-700 text-center max-w-2xl w-full backdrop-blur-sm">
          <div className="mb-6 inline-block p-4 bg-slate-900 rounded-full border border-slate-600">
            <Swords size={48} className="text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Room: <span className="text-yellow-400">{roomCode}</span>
          </h2>
          <p className="text-slate-400 mb-8">Waiting for opponent...</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.values(players).map((p) => (
              <div
                key={p.id}
                className="bg-slate-700 p-4 rounded-xl flex items-center gap-4 border-2 border-slate-600 relative overflow-hidden"
              >
                {!p.online && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-400 font-bold text-xs uppercase tracking-widest">
                    Disconnected
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
                    {p.online ? "READY" : "OFFLINE"}
                  </div>
                </div>
              </div>
            ))}
            {/* Placeholder for empty slot */}
            {Object.keys(players).length < 2 && (
              <div className="bg-slate-800/50 p-4 rounded-xl flex items-center gap-4 border-2 border-dashed border-slate-700 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse"></div>
                <div>Waiting...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GAMEPLAY UI
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

      {/* HEADER */}
      <div className="w-full bg-slate-800 border-b border-slate-700 p-4 shadow-lg z-40 sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">
              <MapIcon size={20} className="text-yellow-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">
                Room: {roomCode}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                PHASE:{" "}
                <span className="text-yellow-400 font-bold">
                  {gameState.phase}
                </span>
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
            {isMyTurn ? "YOUR TURN" : `Waiting: ${currentPlayerName}`}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold">{playerName}</p>
              <p className="text-xs text-slate-400">Commander</p>
            </div>
            <div
              className="w-10 h-10 rounded-full border-2 border-white"
              style={{ backgroundColor: selectedColor }}
            ></div>
          </div>
        </div>
      </div>

      {/* GAME CONTENT */}
      <div className="flex flex-col lg:flex-row w-full max-w-[1600px] gap-6 p-4 flex-grow">
        {/* MAP */}
        <div
          className={`flex-1 bg-slate-800/30 rounded-3xl border border-slate-700/50 p-2 md:p-6 transition-opacity duration-500 relative ${
            !isMyTurn ? "opacity-90" : ""
          }`}
        >
          <BrasovMap
            territories={territories}
            onTerritoryClick={handleTerritoryClick}
            players={players}
            currentPlayerId={userId}
          />
        </div>

        {/* SIDEBAR */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Leaderboard */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={18} />
              <h3 className="font-bold text-slate-200 uppercase text-sm tracking-wider">
                Leaderboard
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
                    } ${!p.online ? "opacity-50 grayscale" : ""}`}
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
                            p.id === userId ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {p.name} {p.id === userId && "(You)"}
                        </div>
                        {!p.online && (
                          <div className="text-[10px] text-red-500 font-bold">
                            DISCONNECTED
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

          {/* Instructions */}
          <div className="bg-blue-900/20 rounded-2xl border border-blue-500/20 p-5 text-sm text-blue-200/80">
            <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
              <Swords size={16} /> Mission:
            </h4>
            <p>
              {gameState.phase === "EXPANSION"
                ? "Conquer neutral (grey) territories."
                : "Attack bordering enemies. Don't lose your land!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
