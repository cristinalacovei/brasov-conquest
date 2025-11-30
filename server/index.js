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
    origin: "*", // Allow connections from any client (Vercel/Localhost)
    methods: ["GET", "POST"],
  },
});

// --- TIMEOUT MANAGEMENT ---
// Stores active timeouts: userId -> timeoutObject
const disconnectTimeouts = new Map();

// --- HELPERS ---
const randomId = () => crypto.randomBytes(8).toString("hex");

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

async function getGameQuestion() {
  try {
    const res = await axios.get(
      "https://opentdb.com/api.php?amount=1&type=multiple&difficulty=easy"
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

// Function to delete game after a delay
function scheduleGameDeletion(roomId, delayMs = 10000) {
  console.log(
    `🗑️ Scheduling deletion for room ${roomId} in ${delayMs / 1000}s...`
  );
  setTimeout(async () => {
    try {
      const result = await Game.deleteOne({ roomId: roomId });
      if (result.deletedCount > 0) {
        console.log(`🗑️ Room ${roomId} deleted successfully.`);
        // Optional: Notify connected clients that room is closed if they are still there
        io.to(roomId).emit("room_closed", { message: "Room closed." });
        io.in(roomId).disconnectSockets(); // Force disconnect sockets in that room
      }
    } catch (err) {
      console.error(`❌ Error deleting room ${roomId}:`, err);
    }
  }, delayMs);
}

// --- MIDDLEWARE: SESSION MANAGEMENT ---
io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;

  if (sessionID) {
    try {
      const session = await Session.findOne({ sessionId: sessionID });
      if (session) {
        socket.sessionID = sessionID;
        socket.userID = session.userId;
        socket.roomId = session.roomId;
        return next();
      }
    } catch (err) {
      console.error("Session lookup failed:", err.message);
    }
  }

  socket.sessionID = randomId();
  socket.userID = randomId();
  next();
});

// --- SOCKET HANDLERS ---
io.on("connection", async (socket) => {
  // 1. Send session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // 2. Handle Reconnection logic
  if (socket.roomId) {
    try {
      // Clear any pending disconnect timeout since user is back
      if (disconnectTimeouts.has(socket.userID)) {
        console.log(
          `✅ User ${socket.userID} reconnected in time. Timeout cancelled.`
        );
        clearTimeout(disconnectTimeouts.get(socket.userID));
        disconnectTimeouts.delete(socket.userID);
      }

      const game = await Game.findOne({ roomId: socket.roomId });
      if (game) {
        socket.join(socket.roomId);
        if (game.players && game.players[socket.userID]) {
          game.players[socket.userID].online = true;
          game.markModified("players");
          await game.save();
        }
        socket.emit("update_players", game.players);
        socket.emit("update_map", game.gameMap);
        socket.emit("update_gamestate", game.state);
        console.log(`🔄 User ${socket.userID} reconnected to ${socket.roomId}`);
      } else {
        // If game not found (maybe deleted), clear roomId from socket to prevent loop
        socket.roomId = null;
      }
    } catch (err) {
      console.error("Reconnection error:", err);
    }
  }

  // --- GAME EVENTS ---
  socket.on("join_game", async ({ name, color, roomId }) => {
    if (!name || !roomId) return;
    const cleanRoomId = roomId.toUpperCase();

    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;

    // Also clear timeout here just in case
    if (disconnectTimeouts.has(socket.userID)) {
      clearTimeout(disconnectTimeouts.get(socket.userID));
      disconnectTimeouts.delete(socket.userID);
    }

    try {
      // Save Session
      await Session.findOneAndUpdate(
        { sessionId: socket.sessionID },
        {
          sessionId: socket.sessionID,
          userId: socket.userID,
          roomId: cleanRoomId,
        },
        { upsert: true, new: true }
      );

      // Find/Create Game
      let game = await Game.findOne({ roomId: cleanRoomId });

      // If a game existed but was finished/deleted, create new one
      if (!game) {
        game = new Game({ roomId: cleanRoomId, ...getInitialGameState() });
        console.log(`✨ Created new room: ${cleanRoomId}`);
      } else if (game.state.status === "FINISHED") {
        // If joining a finished room (rare case if deletion logic works, but safe fallback)
        // Reset it or create new? Let's reset for simplicity if they reuse code immediately
        const newData = getInitialGameState();
        game.players = {}; // Clear old players
        game.gameMap = newData.gameMap;
        game.state = newData.state;
        game.activeBattles = {};
        console.log(`♻️ Resetting finished room: ${cleanRoomId}`);
      }

      // Add Player
      if (!game.players[socket.userID]) {
        game.players[socket.userID] = {
          id: socket.userID,
          name,
          color,
          score: 0,
          online: true,
        };
        // Only push if not already in array (safety check)
        if (!game.state.playerIds.includes(socket.userID)) {
          game.state.playerIds.push(socket.userID);
        }
      } else {
        game.players[socket.userID].online = true;
        game.players[socket.userID].name = name;
        game.players[socket.userID].color = color;
      }

      // Start Game Check
      if (game.state.playerIds.length === 2 && game.state.status === "LOBBY") {
        game.state.status = "PLAYING";
        game.state.phase = "EXPANSION";
        game.state.turnIndex = 0;
        console.log(`🎮 Game Started: ${cleanRoomId}`);
      }

      game.markModified("players");
      game.markModified("state");
      await game.save();

      io.to(cleanRoomId).emit("update_players", game.players);
      io.to(cleanRoomId).emit("update_map", game.gameMap);
      io.to(cleanRoomId).emit("update_gamestate", game.state);
    } catch (err) {
      console.error("Join Game Error:", err);
    }
  });

  socket.on("initiate_attack", async (territoryId) => {
    if (!socket.roomId) return;
    try {
      const game = await Game.findOne({ roomId: socket.roomId });
      if (!game) return;

      const userId = socket.userID;
      if (game.state.status !== "PLAYING") return;

      const currentPlayerId = game.state.playerIds[game.state.turnIndex];
      if (userId !== currentPlayerId) {
        socket.emit("battle_result", {
          success: false,
          message: "Wait for your turn!",
        });
        return;
      }

      // Logic: Neighbors check
      const playerTerritories = Object.keys(game.gameMap).filter(
        (k) => game.gameMap[k].owner === userId
      );
      if (playerTerritories.length > 0) {
        let validNeighbors = new Set();
        playerTerritories.forEach((t) =>
          (neighbors[t] || []).forEach((n) => validNeighbors.add(n))
        );
        if (!validNeighbors.has(territoryId)) {
          socket.emit("battle_result", { success: false, message: "Too far!" });
          return;
        }
      }

      // Logic: Ownership check
      const targetOwner = game.gameMap[territoryId].owner;
      if (game.state.phase === "EXPANSION" && targetOwner !== null) {
        socket.emit("battle_result", {
          success: false,
          message: "Attack empty zones only!",
        });
        return;
      } else if (game.state.phase === "BATTLE" && targetOwner === userId) {
        socket.emit("battle_result", {
          success: false,
          message: "Self-attack invalid!",
        });
        return;
      }

      const q = await getGameQuestion();
      if (!q) {
        socket.emit("battle_result", { success: false, message: "API Error" });
        return;
      }

      game.activeBattles[userId] = {
        territoryId,
        correctIndex: q.correctIndex,
      };
      game.markModified("activeBattles");
      await game.save();

      socket.emit("trivia_question", q);
    } catch (err) {
      console.error("Attack Error:", err);
    }
  });

  socket.on("submit_answer", async (answerIndex) => {
    if (!socket.roomId) return;
    try {
      const game = await Game.findOne({ roomId: socket.roomId });
      if (!game) return;

      const userId = socket.userID;
      const battle = game.activeBattles[userId];
      if (!battle) return;

      const isCorrect = answerIndex === battle.correctIndex;
      const territoryId = battle.territoryId;

      if (isCorrect) {
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

      delete game.activeBattles[userId];
      game.markModified("activeBattles");

      // Turns & Phases
      game.state.turnIndex =
        (game.state.turnIndex + 1) % game.state.playerIds.length;

      if (game.state.phase === "EXPANSION") {
        if (Object.values(game.gameMap).every((t) => t.owner !== null)) {
          game.state.phase = "BATTLE";
          game.state.battleRound = 1;
        }
      } else if (game.state.phase === "BATTLE") {
        if (game.state.turnIndex === 0) game.state.battleRound++;
        if (game.state.battleRound > game.state.maxBattleRounds) {
          game.state.status = "FINISHED";
          const pIds = game.state.playerIds;
          const p1 = game.players[pIds[0]];
          const p2 = game.players[pIds[1]];
          let w = "Draw";
          if (p1 && p2) {
            if (p1.score > p2.score) w = p1.name;
            else if (p2.score > p1.score) w = p2.name;
          }
          game.state.winner = w;

          // SCHEDULE DELETION - Game Finished normally
          scheduleGameDeletion(socket.roomId, 15000); // 15 seconds to see results
        }
      }

      game.markModified("state");
      await game.save();

      io.to(socket.roomId).emit("update_map", game.gameMap);
      io.to(socket.roomId).emit("update_players", game.players);
      io.to(socket.roomId).emit("update_gamestate", game.state);
    } catch (err) {
      console.error("Submit Answer Error:", err);
    }
  });

  socket.on("disconnect", async () => {
    if (socket.roomId && socket.userID) {
      console.log(`❌ User ${socket.userID} disconnected`);

      try {
        const game = await Game.findOne({ roomId: socket.roomId });
        if (game && game.players[socket.userID]) {
          game.players[socket.userID].online = false;
          game.markModified("players");
          await game.save();
          io.to(socket.roomId).emit("update_players", game.players);

          // CHECK EMPTY ROOM: If all players are offline/disconnected
          const allOffline = Object.values(game.players).every(
            (p) => !p.online
          );
          if (allOffline) {
            console.log(`Empty room ${socket.roomId}. Deleting immediately.`);
            await Game.deleteOne({ roomId: socket.roomId });
            return; // Stop further timeout logic if room is gone
          }

          // FORFEIT TIMEOUT (Only if game is active and room still exists)
          if (game.state.status === "PLAYING") {
            console.log(`⏳ Starting 60s forfeit timer for ${socket.userID}`);

            const timeout = setTimeout(async () => {
              try {
                // Check if user is still offline after 60s
                const freshGame = await Game.findOne({ roomId: socket.roomId });
                // If game was already deleted or finished, stop
                if (!freshGame || freshGame.state.status === "FINISHED") return;

                const player = freshGame.players[socket.userID];
                if (player && !player.online) {
                  console.log(
                    `💀 User ${socket.userID} forfeited. Ending game.`
                  );

                  freshGame.state.status = "FINISHED";

                  const winnerId = freshGame.state.playerIds.find(
                    (id) => id !== socket.userID
                  );
                  const winnerName =
                    winnerId && freshGame.players[winnerId]
                      ? freshGame.players[winnerId].name
                      : "Unknown";

                  freshGame.state.winner = `${winnerName} (Opponent disconnected)`;

                  freshGame.markModified("state");
                  await freshGame.save();

                  io.to(socket.roomId).emit(
                    "update_gamestate",
                    freshGame.state
                  );

                  // SCHEDULE DELETION - Game Finished by forfeit
                  scheduleGameDeletion(socket.roomId, 10000); // 10 seconds
                }
              } catch (e) {
                console.error("Error in forfeit timeout:", e);
              } finally {
                disconnectTimeouts.delete(socket.userID);
              }
            }, 60000); // 1 minute

            disconnectTimeouts.set(socket.userID, timeout);
          }
        }
      } catch (err) {
        console.error("Disconnect Error:", err);
      }
    }
  });
});

// --- STARTUP LOGIC ---
const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/brasov_conquest";

console.log("⏳ Connecting to MongoDB...");

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    server.listen(PORT, () =>
      console.log(`🚀 Strategy Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    console.log(
      "➡️  SFAT: Verifica fisierul .env din folderul server si asigura-te ca ai pus linkul corect de la Atlas."
    );
  });
