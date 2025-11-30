const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const he = require("he");
const neighbors = require("./neighbors");

// --- SERVER CONFIG ---
const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow any connection (for easier deployment)
    methods: ["GET", "POST"],
  },
});

// --- GLOBAL VARIABLES ---
let players = {}; // { socketId: { name, color, score } }
let gameMap = resetMap(); // Empty map
let activeBattles = {}; // Current active battle

// GAME STATE
let gameState = {
  status: "LOBBY", // LOBBY, PLAYING, FINISHED
  phase: "EXPANSION", // EXPANSION (neutral zones), BATTLE (PvP)
  playerIds: [], // Player order ['id1', 'id2']
  turnIndex: 0, // Current player index
  battleRound: 0, // Round counter for BATTLE phase
  maxBattleRounds: 10, // Round limit
  winner: null,
};

function resetMap() {
  // Zone IDs matching BrasovMap.jsx
  const zones = [
    "stupini",
    "bartolomeu_nord",
    "bartolomeu",
    "tractorul",
    "triaj",
    "centrul_nou",
    "florilor",
    "est_zizin",
    "centrul_vechi",
    "schei",
    "astra",
    "valea_cetatii",
    "noua",
    "poiana",
  ];
  let map = {};
  zones.forEach((z) => (map[z] = { owner: null }));
  return map;
}

// --- TRIVIA API LOGIC ---
async function getGameQuestion() {
  try {
    const res = await axios.get(
      "https://opentdb.com/api.php?amount=1&type=multiple"
    );
    const data = res.data.results[0];
    const correctAns = he.decode(data.correct_answer);
    const allOptions = [
      ...data.incorrect_answers.map((a) => he.decode(a)),
      correctAns,
    ].sort(() => Math.random() - 0.5);
    return {
      category: data.category,
      question: he.decode(data.question),
      options: allOptions,
      correctIndex: allOptions.indexOf(correctAns),
    };
  } catch (e) {
    return {
      category: "Backup",
      question: "Server busy. What is 2+2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1,
    };
  }
}

// --- TURN & PHASE LOGIC ---
function nextTurn() {
  // 1. Switch player
  gameState.turnIndex = (gameState.turnIndex + 1) % gameState.playerIds.length;

  // 2. Check phase change: EXPANSION -> BATTLE
  if (gameState.phase === "EXPANSION") {
    const isMapFull = Object.values(gameMap).every((t) => t.owner !== null);
    if (isMapFull) {
      gameState.phase = "BATTLE";
      gameState.battleRound = 1;
      console.log("🚀 PHASE CHANGE: BATTLE MODE STARTED!");
    }
  }
  // 3. If BATTLE, increment round counter
  else if (gameState.phase === "BATTLE") {
    // Increment only when turn loops back to first player
    if (gameState.turnIndex === 0) {
      gameState.battleRound++;
    }

    // 4. CHECK GAME OVER (Round limit)
    if (gameState.battleRound > gameState.maxBattleRounds) {
      endGame();
      return;
    }
  }

  // Broadcast new state
  io.emit("update_gamestate", gameState);
}

function endGame() {
  gameState.status = "FINISHED";

  // Determine winner
  const p1Id = gameState.playerIds[0];
  const p2Id = gameState.playerIds[1];

  // Higher score wins
  if (players[p1Id].score > players[p2Id].score)
    gameState.winner = players[p1Id].name;
  else if (players[p2Id].score > players[p1Id].score)
    gameState.winner = players[p2Id].name;
  else gameState.winner = "Draw";

  io.emit("update_gamestate", gameState);
}

io.on("connection", (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  socket.on("join_game", ({ name, color }) => {
    // Add player
    players[socket.id] = { id: socket.id, name, color, score: 0 };
    if (!gameState.playerIds.includes(socket.id)) {
      gameState.playerIds.push(socket.id);
    }

    // If 2 players, START GAME
    if (gameState.playerIds.length === 2 && gameState.status === "LOBBY") {
      gameState.status = "PLAYING";
      gameState.phase = "EXPANSION";
      gameState.turnIndex = 0; // First to join starts
      console.log("🎮 GAME START!");
    }

    // Update everyone
    io.emit("update_players", players);
    io.emit("update_map", gameMap);
    io.emit("update_gamestate", gameState);
  });

  socket.on("initiate_attack", async (territoryId) => {
    // A. BASIC VALIDATION (Is it your turn?)
    if (gameState.status !== "PLAYING") return;

    const currentPlayerId = gameState.playerIds[gameState.turnIndex];
    if (socket.id !== currentPlayerId) {
      socket.emit("battle_result", {
        success: false,
        message: "Wait for your turn!",
      });
      return;
    }

    // --- STRATEGY LOGIC ---

    // 1. Check existing territories
    const playerTerritories = Object.keys(gameMap).filter(
      (k) => gameMap[k].owner === socket.id
    );
    const hasTerritories = playerTerritories.length > 0;

    // 2. GOLDEN RULE: EXPAND ONLY TO NEIGHBORS
    // Only applies if you already own land.
    if (hasTerritories) {
      let validNeighbors = new Set();

      // Collect all neighbors of owned territories
      playerTerritories.forEach((t) => {
        (neighbors[t] || []).forEach((n) => validNeighbors.add(n));
      });

      // If target is not a neighbor -> ERROR
      if (!validNeighbors.has(territoryId)) {
        socket.emit("battle_result", {
          success: false,
          message: "Too far! You must expand from your borders.",
        });
        return;
      }
    }
    // NOTE: If hasTerritories is false (first turn), allow landing anywhere.

    // 3. PHASE SPECIFIC VALIDATION
    const targetOwner = gameMap[territoryId].owner;

    if (gameState.phase === "EXPANSION") {
      // Expansion: Attack empty zones only
      if (targetOwner !== null) {
        socket.emit("battle_result", {
          success: false,
          message: "Expansion Phase: Attack empty zones only!",
        });
        return;
      }
    } else if (gameState.phase === "BATTLE") {
      // Battle: Don't attack yourself
      if (targetOwner === socket.id) {
        socket.emit("battle_result", {
          success: false,
          message: "Don't attack yourself!",
        });
        return;
      }
    }

    // D. START TRIVIA (If all rules passed)
    const q = await getGameQuestion();

    // Safety check if API fails
    if (!q) {
      socket.emit("battle_result", {
        success: false,
        message: "System Error. Try again.",
      });
      return;
    }

    activeBattles[socket.id] = { territoryId, correctIndex: q.correctIndex };
    socket.emit("trivia_question", {
      question: q.question,
      options: q.options,
      category: q.category,
    });
  });

  socket.on("submit_answer", (answerIndex) => {
    const battle = activeBattles[socket.id];
    if (!battle) return;

    const isCorrect = answerIndex === battle.correctIndex;
    const territoryId = battle.territoryId;

    if (isCorrect) {
      // 1. Update Map
      gameMap[territoryId].owner = socket.id;

      // 2. Award Points
      players[socket.id].score += gameState.phase === "EXPANSION" ? 100 : 300; // More points in battle

      socket.emit("battle_result", { success: true, message: "Victory!" });
      io.emit("update_map", gameMap);
      io.emit("update_players", players);
    } else {
      socket.emit("battle_result", {
        success: false,
        message: "Wrong Answer! Turn lost.",
      });
    }

    delete activeBattles[socket.id];

    // NEXT TURN REGARDLESS OF RESULT
    nextTurn();
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    delete players[socket.id];
    gameState.playerIds = gameState.playerIds.filter((id) => id !== socket.id);

    // Reset if a player leaves during game
    if (gameState.status === "PLAYING") {
      gameState.status = "LOBBY";
      gameMap = resetMap();
      io.emit("update_gamestate", gameState);
      io.emit("update_map", gameMap);
    }
    io.emit("update_players", players);
  });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Strategy Server running on ${PORT}`));
