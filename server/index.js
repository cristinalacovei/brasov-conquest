// server/index.js
require("dotenv").config(); // Load environment variables
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const he = require("he");
const crypto = require("crypto");
const mongoose = require("mongoose");
const neighbors = require("./neighbors");
const { Session, Game } = require("./models"); // Import DB models

// --- SERVER CONFIG ---
const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from Vercel
    methods: ["GET", "POST"],
  },
});

// --- DATABASE CONNECTION ---
// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/brasov_conquest")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- HELPERS ---
const randomId = () => crypto.randomBytes(8).toString("hex");

// Helper to create initial game state
function getInitialGameState() {
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
  const map = {};
  zones.forEach((z) => (map[z] = { owner: null }));

  return {
    players: {},
    gameMap: map,
    activeBattles: {},
    state: {
      status: "LOBBY",
      phase: "EXPANSION",
      playerIds: [],
      turnIndex: 0,
      battleRound: 0,
      maxBattleRounds: 10,
      winner: null,
    },
  };
}

// Trivia API
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

// --- MIDDLEWARE: SESSION MANAGEMENT ---
// This runs before connection to identify the user
io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;

  if (sessionID) {
    // Look up session in MongoDB
    const session = await Session.findOne({ sessionId: sessionID });
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userId;
      socket.roomId = session.roomId;
      return next();
    }
  }

  // Create new identifiers (saved to DB only when joining a game)
  socket.sessionID = randomId();
  socket.userID = randomId();
  next();
});

// --- SOCKET HANDLERS ---
io.on("connection", async (socket) => {
  // 1. Send session details to client so they can save to localStorage
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // 2. Handle Automatic Reconnection
  // If user was in a room, find that room in DB and send state
  if (socket.roomId) {
    const game = await Game.findOne({ roomId: socket.roomId });

    if (game) {
      socket.join(socket.roomId);

      // Mark player as online in DB
      if (game.players && game.players[socket.userID]) {
        game.players[socket.userID].online = true;
        // Optimization: We use markModified because 'players' is a Mixed Object
        game.markModified("players");
        await game.save();
      }

      // Sync Client
      socket.emit("update_players", game.players);
      socket.emit("update_map", game.gameMap);
      socket.emit("update_gamestate", game.state);

      console.log(
        `🔄 User ${socket.userID} reconnected to DB room ${socket.roomId}`
      );
    }
  }

  // --- EVENTS ---

  socket.on("join_game", async ({ name, color, roomId }) => {
    if (!name || !roomId) return;
    const cleanRoomId = roomId.toUpperCase(); // Normalize room codes

    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;

    // Save/Update Session in MongoDB
    await Session.findOneAndUpdate(
      { sessionId: socket.sessionID },
      {
        sessionId: socket.sessionID,
        userId: socket.userID,
        roomId: cleanRoomId,
      },
      { upsert: true, new: true }
    );

    // Find or Create Game in MongoDB
    let game = await Game.findOne({ roomId: cleanRoomId });
    if (!game) {
      const initialData = getInitialGameState();
      game = new Game({
        roomId: cleanRoomId,
        ...initialData,
      });
      console.log(`✨ Created new room in DB: ${cleanRoomId}`);
    }

    // Add Player logic
    if (!game.players[socket.userID]) {
      // New Player
      game.players[socket.userID] = {
        id: socket.userID,
        name,
        color,
        score: 0,
        online: true,
      };
      game.state.playerIds.push(socket.userID);
    } else {
      // Update existing player
      game.players[socket.userID].online = true;
      game.players[socket.userID].name = name;
      game.players[socket.userID].color = color;
    }

    // Check Start Condition
    if (game.state.playerIds.length === 2 && game.state.status === "LOBBY") {
      game.state.status = "PLAYING";
      game.state.phase = "EXPANSION";
      game.state.turnIndex = 0;
      console.log(`🎮 Game Started in room ${cleanRoomId}`);
    }

    // Save Game & Broadcast
    game.markModified("players");
    game.markModified("state");
    await game.save();

    io.to(cleanRoomId).emit("update_players", game.players);
    io.to(cleanRoomId).emit("update_map", game.gameMap);
    io.to(cleanRoomId).emit("update_gamestate", game.state);
  });

  socket.on("initiate_attack", async (territoryId) => {
    if (!socket.roomId) return;

    // Fetch latest state from DB to ensure sync
    const game = await Game.findOne({ roomId: socket.roomId });
    if (!game) return;

    const userId = socket.userID;

    // Validation
    if (game.state.status !== "PLAYING") return;
    const currentPlayerId = game.state.playerIds[game.state.turnIndex];
    if (userId !== currentPlayerId) {
      socket.emit("battle_result", {
        success: false,
        message: "Wait for your turn!",
      });
      return;
    }

    // Strategy Validation
    const playerTerritories = Object.keys(game.gameMap).filter(
      (k) => game.gameMap[k].owner === userId
    );
    const hasTerritories = playerTerritories.length > 0;

    if (hasTerritories) {
      let validNeighbors = new Set();
      playerTerritories.forEach((t) => {
        (neighbors[t] || []).forEach((n) => validNeighbors.add(n));
      });
      if (!validNeighbors.has(territoryId)) {
        socket.emit("battle_result", {
          success: false,
          message: "Too far! Must border your lands.",
        });
        return;
      }
    }

    const targetOwner = game.gameMap[territoryId].owner;
    if (game.state.phase === "EXPANSION" && targetOwner !== null) {
      socket.emit("battle_result", {
        success: false,
        message: "Expansion Phase: Empty zones only!",
      });
      return;
    } else if (game.state.phase === "BATTLE" && targetOwner === userId) {
      socket.emit("battle_result", {
        success: false,
        message: "Don't attack yourself!",
      });
      return;
    }

    // Get Question
    const q = await getGameQuestion();
    if (!q) {
      socket.emit("battle_result", { success: false, message: "API Error." });
      return;
    }

    // Save Battle in DB
    game.activeBattles[userId] = { territoryId, correctIndex: q.correctIndex };
    game.markModified("activeBattles");
    await game.save();

    socket.emit("trivia_question", q);
  });

  socket.on("submit_answer", async (answerIndex) => {
    if (!socket.roomId) return;
    const game = await Game.findOne({ roomId: socket.roomId });
    if (!game) return;

    const userId = socket.userID;
    const battle = game.activeBattles[userId];
    if (!battle) return;

    const isCorrect = answerIndex === battle.correctIndex;
    const territoryId = battle.territoryId;

    if (isCorrect) {
      // Logic for capture
      game.gameMap[territoryId].owner = userId;
      game.players[userId].score +=
        game.state.phase === "EXPANSION" ? 100 : 300;

      socket.emit("battle_result", { success: true, message: "Victory!" });

      game.markModified("gameMap");
      game.markModified("players");
    } else {
      socket.emit("battle_result", {
        success: false,
        message: "Wrong Answer!",
      });
    }

    // Clear battle
    delete game.activeBattles[userId];
    game.markModified("activeBattles");

    // Next Turn
    game.state.turnIndex =
      (game.state.turnIndex + 1) % game.state.playerIds.length;

    // Check Phase Change
    if (game.state.phase === "EXPANSION") {
      const isMapFull = Object.values(game.gameMap).every(
        (t) => t.owner !== null
      );
      if (isMapFull) {
        game.state.phase = "BATTLE";
        game.state.battleRound = 1;
      }
    } else if (game.state.phase === "BATTLE") {
      if (game.state.turnIndex === 0) game.state.battleRound++;

      // Game Over Condition
      if (game.state.battleRound > game.state.maxBattleRounds) {
        game.state.status = "FINISHED";
        const pIds = game.state.playerIds;
        const p1 = game.players[pIds[0]];
        const p2 = game.players[pIds[1]];

        let w = "Draw";
        if (p1.score > p2.score) w = p1.name;
        if (p2.score > p1.score) w = p2.name;
        game.state.winner = w;
      }
    }

    game.markModified("state");
    await game.save(); // Persist changes

    // Broadcast updates
    io.to(socket.roomId).emit("update_map", game.gameMap);
    io.to(socket.roomId).emit("update_players", game.players);
    io.to(socket.roomId).emit("update_gamestate", game.state);
  });

  socket.on("disconnect", async () => {
    // On disconnect, we just mark them offline in DB, we DO NOT delete the game
    if (socket.roomId && socket.userID) {
      console.log(`❌ User ${socket.userID} disconnected`);

      const game = await Game.findOne({ roomId: socket.roomId });
      if (game && game.players[socket.userID]) {
        game.players[socket.userID].online = false;
        game.markModified("players");
        await game.save();

        io.to(socket.roomId).emit("update_players", game.players);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Strategy Server running on ${PORT}`));
