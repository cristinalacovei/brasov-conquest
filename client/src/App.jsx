import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { MessageCircle, X, WifiOff } from "lucide-react";

import GameMenu from "./components/GameMenu";
import GameSetup from "./components/GameSetup";
import GameLobby from "./components/GameLobby";
import GameHeader from "./components/GameHeader";
import BrasovMap from "./components/BrasovMap";
import GameSidebar from "./components/GameSidebar";
import ChatWindow from "./components/ChatWindow";
import TriviaModal from "./components/TriviaModal";
import GameOverModal from "./components/GameOverModal";

// --- CONFIGURATION ---
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const socket = io.connect(SOCKET_URL);

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
  const [userId, setUserId] = useState(null);

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

  // Chat Data
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // Login & UI State
  const [hasJoined, setHasJoined] = useState(false);
  const [uiStep, setUiStep] = useState("MENU"); // MENU, SINGLE_SETUP, MULTI_SETUP

  // Form Data
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0].hex);
  const [gameMode, setGameMode] = useState("MULTI");
  const [difficulty, setDifficulty] = useState("MEDIUM");

  useEffect(() => {
    const sessionID = localStorage.getItem("sessionID");
    if (sessionID) {
      socket.auth = { sessionID };
      socket.connect();
    } else {
      socket.connect();
    }

    socket.on("session", ({ sessionID, userID }) => {
      socket.auth = { sessionID };
      localStorage.setItem("sessionID", sessionID);
      socket.userID = userID;
      setUserId(userID);
    });

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("update_players", (newPlayers) => {
      setPlayers(newPlayers);
      if (socket.userID && newPlayers[socket.userID]) {
        setHasJoined(true);
        setPlayerName(newPlayers[socket.userID].name);
        setSelectedColor(newPlayers[socket.userID].color);
      }
    });
    socket.on("update_map", setTerritories);
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
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("session");
      socket.off("update_map");
      socket.off("update_players");
      socket.off("update_gamestate");
      socket.off("trivia_question");
      socket.off("battle_result");
      socket.off("receive_message");
    };
  }, []);

  const handleJoinGame = (e) => {
    e.preventDefault();

    const finalRoomCode =
      gameMode === "SINGLEPLAYER"
        ? `SP-${Date.now().toString().slice(-6)}`
        : roomCode;

    if (!playerName || !finalRoomCode) return;

    socket.emit("join_game", {
      name: playerName,
      color: selectedColor,
      roomId: finalRoomCode,
      mode: gameMode,
      difficulty: difficulty,
    });

    setRoomCode(finalRoomCode);
    setHasJoined(true);
  };

  const handleLeaveGame = () => {
    localStorage.removeItem("sessionID");
    socket.auth = {};
    socket.disconnect();

    setHasJoined(false);
    setPlayerName("");
    setRoomCode("");
    setPlayers({});
    setTerritories({});
    setMessages([]);
    setUiStep("MENU");

    setGameState({
      status: "LOBBY",
      phase: "",
      turnIndex: 0,
      playerIds: [],
      battleRound: 0,
    });
    socket.connect();
  };

  const handleAnswerSubmit = (index) => socket.emit("submit_answer", index);
  const handleTerritoryClick = (id) => socket.emit("initiate_attack", id);
  const handleSendMessage = (text) => socket.emit("send_message", text);

  const isMyTurn =
    gameState.status === "PLAYING" &&
    gameState.playerIds[gameState.turnIndex] === userId;
  const currentPlayerName =
    players[gameState.playerIds[gameState.turnIndex]]?.name || "Unknown";
  const opponent = Object.values(players).find((p) => p.id !== userId);
  const isOpponentOffline =
    gameState.status === "PLAYING" && opponent && !opponent.online;

  // --- RENDERING ---

  // 1. MENU
  if (!hasJoined && uiStep === "MENU") {
    return (
      <GameMenu
        onSelectMode={(step, mode) => {
          setUiStep(step);
          setGameMode(mode);
        }}
      />
    );
  }

  // 2. SETUP
  if (!hasJoined && (uiStep === "SINGLE_SETUP" || uiStep === "MULTI_SETUP")) {
    return (
      <GameSetup
        uiStep={uiStep}
        onBack={() => setUiStep("MENU")}
        onJoin={handleJoinGame}
        playerName={playerName}
        setPlayerName={setPlayerName}
        roomCode={roomCode}
        setRoomCode={setRoomCode}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
      />
    );
  }

  // 3. LOBBY (Multiplayer only)
  if (gameState.status === "LOBBY" && gameMode === "MULTI") {
    return (
      <GameLobby
        roomCode={roomCode}
        players={players}
        onLeave={handleLeaveGame}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUserId={userId}
      />
    );
  }

  // 4. GAMEPLAY UI
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center font-sans relative overflow-x-hidden">
      {gameState.status === "FINISHED" && (
        <GameOverModal winner={gameState.winner} onRestart={handleLeaveGame} />
      )}
      {gameMode === "MULTI" && isOpponentOffline && (
        <div className="w-full bg-red-600/90 text-white font-bold text-center py-2 animate-pulse flex items-center justify-center gap-2 z-50 sticky top-0">
          <WifiOff size={20} />{" "}
          <span>
            Adversarul s-a deconectat! Dacă nu revine în 60s, câștigi prin
            forfeit.
          </span>
        </div>
      )}
      {currentQuestion && (
        <TriviaModal data={currentQuestion} onAnswer={handleAnswerSubmit} />
      )}
      {notification && (
        <div
          className={`fixed top-32 z-[100] px-8 py-3 rounded-xl shadow-2xl font-black text-xl border-2 animate-bounce ${
            notification.success
              ? "bg-green-600 border-green-400"
              : "bg-red-600 border-red-400"
          }`}
        >
          {notification.message}
        </div>
      )}

      <GameHeader
        gameMode={gameMode}
        roomCode={roomCode}
        gameState={gameState}
        isMyTurn={isMyTurn}
        currentPlayerName={currentPlayerName}
        playerName={playerName}
        selectedColor={selectedColor}
        onLeave={handleLeaveGame}
      />

      <div className="flex flex-col lg:flex-row w-full max-w-[1600px] gap-6 p-4 flex-grow">
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
        <GameSidebar
          players={players}
          gameState={gameState}
          currentUserId={userId}
        />
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
        onSend={handleSendMessage}
        currentUserId={userId}
      />
    </div>
  );
}

export default App;
