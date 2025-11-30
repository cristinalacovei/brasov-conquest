# ⚔️ Brașov Conquest

**Brașov Conquest** is a real-time multiplayer strategy game where players compete to conquer the neighborhoods of Brașov city. Combine general knowledge trivia with tactical positioning to dominate the map!

🔗 **Play Live:** [https://brasov-conquest.vercel.app/](https://brasov-conquest.vercel.app/)

---

## 🗺️ About the Game

This project is a monorepo application that combines classic strategy mechanics (Risk-style) with trivia questions. The map is an interactive SVG representation of Brașov, divided into real neighborhoods (Stupini, Astra, Tractorul, Schei, etc.).

### Core Mechanics:
1.  **Lobby:** Players join, choose a nickname, and select a color.
2.  **Expansion Phase:** The map starts neutral (grey). Players take turns selecting empty territories. Answering a trivia question correctly claims the land.
3.  **Battle Phase:** Once all territories are occupied, the war begins! You can only attack enemy territories that share a border with yours.
4.  **Victory:** The game ends after a set number of rounds. The player with the highest score (based on territories held and correct answers) wins.

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
