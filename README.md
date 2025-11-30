# ⚔️ Brașov Conquest

**Brașov Conquest**  is a real-time strategy game where players compete to conquer the neighborhoods of Brașov city. Combine general knowledge trivia with tactical positioning to dominate the map!

🔗 **Play Live:** [https://brasov-conquest.vercel.app/](https://brasov-conquest.vercel.app/)

---

## 🗺️ About the Game

This project is a monorepo application that combines classic strategy mechanics (Risk-style) with trivia questions. The map is an interactive SVG representation of Brașov, divided into real neighborhoods (Stupini, Astra, Tractorul, Schei, etc.), rendered with custom filters for a realistic, organic look.

### Game Modes:
1.  **Multiplayer:** Challenge a friend in real-time using a shared room code.
2.  **Singleplayer:** Play against an AI Bot and choose between Easy, Medium, or Hard. The bot's accuracy improves with difficulty.

### Core Mechanics:
1.  **Lobby & Setup:** Players choose a nickname, color, and game mode. In Singleplayer, you also select the AI difficulty.
2.  **Expansion Phase:** The map starts neutral (grey). Players take turns selecting empty territories. Answering a trivia question correctly claims the land.
3.  **Battle Phase:** Once all territories are occupied, the war begins! You can only attack enemy territories that share a border with yours.
4.  **Victory:** The game ends after the rounds complete or if an opponent disconnects. The player with the highest score wins.

### Key Features:
* **In-Game Chat:** Communicate with your opponent using text and emojis during multiplayer matches.
* **Visual Timer:** Questions have a 15-second countdown; failure to answer results in a random selection.
* **Stylized Map:** SVG turbulence filters give the map borders a "hand-drawn" or geographical appearance.
* **Game Over Modal:** A dedicated screen announcing the winner and allowing a quick restart.
---

## 🛠️ Tech Stack

### Frontend (Client)
* **Framework:** React 19 (via Vite)
* **Styling:** Tailwind CSS
* **Real-time Communication:** Socket.io-client
* **Icons:** Lucide React

### Backend (Server)
* **Runtime:** Node.js
* **Framework:** Express
* **WebSockets:** Socket.io
* **Data:** OpenTDB API (for trivia questions)

---
