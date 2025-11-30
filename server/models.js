// server/models.js
const mongoose = require("mongoose");

// Schema for Game Sessions (Reconnection logic)
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  roomId: { type: String }, // Which room is this user currently in?
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // Auto-delete after 24h
});

// Schema for Game Rooms
const gameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: { type: Object, default: {} }, // Stores { userId: { name, color, score, online } }
  gameMap: { type: Object, default: {} }, // Stores territories ownership
  activeBattles: { type: Object, default: {} }, // Current trivia battles
  state: {
    status: { type: String, default: "LOBBY" },
    phase: { type: String, default: "EXPANSION" },
    playerIds: [String], // Array of userIds
    turnIndex: { type: Number, default: 0 },
    battleRound: { type: Number, default: 0 },
    maxBattleRounds: { type: Number, default: 10 },
    winner: { type: String, default: null },
  },
  updatedAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);
const Game = mongoose.model("Game", gameSchema);

module.exports = { Session, Game };
