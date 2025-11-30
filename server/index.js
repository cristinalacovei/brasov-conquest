require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const he = require("he");
const crypto = require("crypto");
const mongoose = require("mongoose");
const neighbors = require("./neighbors");
const { Session, Game } = require("./models");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const disconnectTimeouts = new Map();
const randomId = () => crypto.randomBytes(8).toString("hex");

// --- CONFIGURARE BOT ---
const BOT_ID = "BOT_AI";
const BOT_COLOR = "#64748b";

const DIFFICULTY_CHANCE = {
  EASY: 0.3, // 30% șanse (foarte slab)
  MEDIUM: 0.6, // 60% șanse
  HARD: 0.9, // 90% șanse
};

// --- GAME LOGIC HELPERS ---

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
    settings: {
      mode: "MULTI",
      difficulty: "MEDIUM",
    },
  };
}

async function getGameQuestion() {
  try {
    const res = await axios.get(
      "https://the-trivia-api.com/v2/questions?limit=1"
    );
    const data = res.data[0];
    const correctAns = data.correctAnswer;
    const allOptions = [...data.incorrectAnswers, correctAns].sort(
      () => Math.random() - 0.5
    );

    return {
      category: data.category,
      question: data.question.text,
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

function scheduleGameDeletion(roomId, delayMs = 10000) {
  setTimeout(async () => {
    try {
      await Game.deleteOne({ roomId: roomId });
      io.to(roomId).emit("room_closed", { message: "Room closed." });
      io.in(roomId).disconnectSockets();
    } catch (err) {
      console.error(`Error deleting room ${roomId}:`, err);
    }
  }, delayMs);
}

// --- LOGICA PENTRU SCHIMBAREA TUREI & BOT ---

async function advanceTurn(game, roomId) {
  // 1. Avansăm indexul
  game.state.turnIndex =
    (game.state.turnIndex + 1) % game.state.playerIds.length;

  // 2. Verificăm schimbarea fazei
  if (game.state.phase === "EXPANSION") {
    if (Object.values(game.gameMap).every((t) => t.owner !== null)) {
      game.state.phase = "BATTLE";
      game.state.battleRound = 1;
      game.state.turnIndex = 0;
    }
  } else if (game.state.phase === "BATTLE") {
    if (game.state.turnIndex === 0) game.state.battleRound++;

    if (game.state.battleRound > game.state.maxBattleRounds) {
      game.state.status = "FINISHED";
      const pIds = game.state.playerIds;
      let bestScore = -1;
      let winnerName = "Draw";

      pIds.forEach((id) => {
        if (game.players[id] && game.players[id].score > bestScore) {
          bestScore = game.players[id].score;
          winnerName = game.players[id].name;
        }
      });

      game.state.winner = winnerName;
      scheduleGameDeletion(roomId, 15000);
    }
  }

  game.markModified("state");
  await game.save();

  io.to(roomId).emit("update_map", game.gameMap);
  io.to(roomId).emit("update_players", game.players);
  io.to(roomId).emit("update_gamestate", game.state);

  // 3. DACA E RANDUL BOT-ULUI
  const currentPlayerId = game.state.playerIds[game.state.turnIndex];
  if (currentPlayerId === BOT_ID && game.state.status === "PLAYING") {
    handleBotMove(game, roomId);
  }
}

async function handleBotMove(game, roomId) {
  // Simulăm "gândirea"
  setTimeout(async () => {
    const freshGame = await Game.findOne({ roomId: roomId });
    if (!freshGame || freshGame.state.status !== "PLAYING") return;

    // --- FIX PENTRU CRASH: Folosim fallback values ---
    const settings = freshGame.settings || { difficulty: "MEDIUM" };
    const difficulty = settings.difficulty || "MEDIUM";
    // -------------------------------------------------

    let targetId = null;
    const botTerritories = Object.keys(freshGame.gameMap).filter(
      (k) => freshGame.gameMap[k].owner === BOT_ID
    );

    if (freshGame.state.phase === "EXPANSION") {
      const freeZones = Object.keys(freshGame.gameMap).filter(
        (k) => freshGame.gameMap[k].owner === null
      );
      if (freeZones.length > 0) {
        // Încearcă să ia un vecin, dacă nu, random
        let validNeighbors = [];
        if (botTerritories.length > 0) {
          botTerritories.forEach((t) => {
            (neighbors[t] || []).forEach((n) => {
              if (freshGame.gameMap[n].owner === null) validNeighbors.push(n);
            });
          });
        }

        if (validNeighbors.length > 0) {
          targetId =
            validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        } else {
          targetId = freeZones[Math.floor(Math.random() * freeZones.length)];
        }
      }
    } else {
      // BATTLE
      let validTargets = [];
      botTerritories.forEach((myZone) => {
        const myNeighbors = neighbors[myZone] || [];
        myNeighbors.forEach((n) => {
          if (freshGame.gameMap[n].owner !== BOT_ID) {
            validTargets.push(n);
          }
        });
      });

      if (validTargets.length === 0) {
        validTargets = Object.keys(freshGame.gameMap).filter(
          (k) => freshGame.gameMap[k].owner !== BOT_ID
        );
      }

      if (validTargets.length > 0) {
        targetId =
          validTargets[Math.floor(Math.random() * validTargets.length)];
      }
    }

    if (targetId) {
      const chance = DIFFICULTY_CHANCE[difficulty] || 0.5;
      const isCorrect = Math.random() < chance;

      const botName = freshGame.players[BOT_ID]
        ? freshGame.players[BOT_ID].name
        : "Robot";

      io.to(roomId).emit("receive_message", {
        id: randomId(),
        senderName: "System",
        senderColor: "#ffffff",
        text: `🤖 ${botName} atacă ${targetId}...`,
        timestamp: new Date().toISOString(),
      });

      setTimeout(async () => {
        if (isCorrect) {
          freshGame.gameMap[targetId].owner = BOT_ID;
          freshGame.players[BOT_ID].score +=
            freshGame.state.phase === "EXPANSION" ? 100 : 300;
          io.to(roomId).emit("battle_result", {
            success: false,
            message: `Robotul a cucerit ${targetId}!`,
          });
        } else {
          io.to(roomId).emit("battle_result", {
            success: true,
            message: "Robotul a greșit întrebarea!",
          });
        }

        freshGame.markModified("gameMap");
        freshGame.markModified("players");
        await freshGame.save();

        advanceTurn(freshGame, roomId);
      }, 1500);
    } else {
      advanceTurn(freshGame, roomId);
    }
  }, 2000);
}

io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    const session = await Session.findOne({ sessionId: sessionID });
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userId;
      socket.roomId = session.roomId;
      return next();
    }
  }
  socket.sessionID = randomId();
  socket.userID = randomId();
  next();
});

io.on("connection", async (socket) => {
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  if (socket.roomId) {
    const game = await Game.findOne({ roomId: socket.roomId });
    if (game) {
      socket.join(socket.roomId);
      if (game.players[socket.userID]) {
        game.players[socket.userID].online = true;
        game.markModified("players");
        await game.save();
      }
      socket.emit("update_players", game.players);
      socket.emit("update_map", game.gameMap);
      socket.emit("update_gamestate", game.state);
    }
  }

  socket.on("join_game", async ({ name, color, roomId, mode, difficulty }) => {
    if (!name || !roomId) return;
    const cleanRoomId = roomId.toUpperCase();
    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;

    try {
      await Session.findOneAndUpdate(
        { sessionId: socket.sessionID },
        {
          sessionId: socket.sessionID,
          userId: socket.userID,
          roomId: cleanRoomId,
        },
        { upsert: true, new: true }
      );

      let game = await Game.findOne({ roomId: cleanRoomId });

      if (!game || game.state.status === "FINISHED") {
        game = new Game({ roomId: cleanRoomId, ...getInitialGameState() });
        // Salvăm setările
        game.settings = {
          mode: mode || "MULTI",
          difficulty: difficulty || "MEDIUM",
        };
      }

      if (!game.players[socket.userID]) {
        game.players[socket.userID] = {
          id: socket.userID,
          name,
          color,
          score: 0,
          online: true,
        };
        if (!game.state.playerIds.includes(socket.userID))
          game.state.playerIds.push(socket.userID);
      } else {
        game.players[socket.userID].online = true;
        game.players[socket.userID].name = name;
        game.players[socket.userID].color = color;
      }

      // ADD BOT IF SINGLEPLAYER
      if (game.settings.mode === "SINGLEPLAYER" && !game.players[BOT_ID]) {
        game.players[BOT_ID] = {
          id: BOT_ID,
          name: `Robot (${game.settings.difficulty})`,
          color: BOT_COLOR, // Culoare unică
          score: 0,
          online: true,
        };
        game.state.playerIds.push(BOT_ID);

        game.state.status = "PLAYING";
        game.state.phase = "EXPANSION";
        game.state.turnIndex = 0;
      } else if (
        game.settings.mode === "MULTI" &&
        game.state.playerIds.length === 2 &&
        game.state.status === "LOBBY"
      ) {
        game.state.status = "PLAYING";
        game.state.phase = "EXPANSION";
        game.state.turnIndex = 0;
      }

      game.markModified("players");
      game.markModified("state");
      await game.save();

      io.to(cleanRoomId).emit("update_players", game.players);
      io.to(cleanRoomId).emit("update_map", game.gameMap);
      io.to(cleanRoomId).emit("update_gamestate", game.state);
    } catch (err) {
      console.error("Join Error:", err);
    }
  });

  socket.on("initiate_attack", async (territoryId) => {
    if (!socket.roomId) return;
    const game = await Game.findOne({ roomId: socket.roomId });
    if (!game || game.state.status !== "PLAYING") return;

    const currentPlayerId = game.state.playerIds[game.state.turnIndex];
    if (socket.userID !== currentPlayerId) {
      socket.emit("battle_result", {
        success: false,
        message: "Nu e rândul tău!",
      });
      return;
    }

    const playerTerritories = Object.keys(game.gameMap).filter(
      (k) => game.gameMap[k].owner === socket.userID
    );
    if (playerTerritories.length > 0) {
      let validNeighbors = new Set();
      playerTerritories.forEach((t) =>
        (neighbors[t] || []).forEach((n) => validNeighbors.add(n))
      );

      const isNeighbor = validNeighbors.has(territoryId);
      if (!isNeighbor) {
        let allowException = false;
        if (game.state.phase === "EXPANSION") {
          const hasFreeNeighbors = Array.from(validNeighbors).some(
            (n) => game.gameMap[n].owner === null
          );
          if (!hasFreeNeighbors) allowException = true;
        }
        if (!allowException) {
          socket.emit("battle_result", {
            success: false,
            message: "Prea departe!",
          });
          return;
        }
      }
    }

    const targetOwner = game.gameMap[territoryId].owner;
    if (game.state.phase === "EXPANSION" && targetOwner !== null) {
      socket.emit("battle_result", {
        success: false,
        message: "Doar zone goale!",
      });
      return;
    }
    if (game.state.phase === "BATTLE" && targetOwner === socket.userID) {
      socket.emit("battle_result", {
        success: false,
        message: "Nu te poți ataca singur!",
      });
      return;
    }

    const q = await getGameQuestion();
    game.activeBattles[socket.userID] = {
      territoryId,
      correctIndex: q.correctIndex,
    };
    game.markModified("activeBattles");
    await game.save();
    socket.emit("trivia_question", q);
  });

  socket.on("submit_answer", async (answerIndex) => {
    if (!socket.roomId) return;
    const game = await Game.findOne({ roomId: socket.roomId });
    if (!game) return;

    const battle = game.activeBattles[socket.userID];
    if (!battle) return;

    const isCorrect = answerIndex === battle.correctIndex;

    if (isCorrect) {
      game.gameMap[battle.territoryId].owner = socket.userID;
      game.players[socket.userID].score +=
        game.state.phase === "EXPANSION" ? 100 : 300;
      socket.emit("battle_result", { success: true, message: "Victorie!" });
    } else {
      socket.emit("battle_result", { success: false, message: "Greșit!" });
    }

    delete game.activeBattles[socket.userID];
    game.markModified("activeBattles");
    game.markModified("gameMap");
    game.markModified("players");
    await game.save();

    advanceTurn(game, socket.roomId);
  });

  socket.on("send_message", async (text) => {
    if (!socket.roomId || !socket.userID) return;
    const game = await Game.findOne({ roomId: socket.roomId });
    if (!game || !game.players[socket.userID]) return;

    const msg = {
      id: randomId(),
      senderId: socket.userID,
      senderName: game.players[socket.userID].name,
      senderColor: game.players[socket.userID].color,
      text,
      timestamp: new Date().toISOString(),
    };
    io.to(socket.roomId).emit("receive_message", msg);
  });

  socket.on("disconnect", async () => {
    // Logic from previous version regarding timeouts/forfeits can remain here
  });
});

const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/brasov_conquest";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
