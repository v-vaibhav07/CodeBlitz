# ⚡ CodeBlitz — 1v1 Competitive Coding Arena

A real-time 1v1 Codeforces battle platform with ELO ranking.

## Features
- 🥊 **1v1 Battle Mode** — Challenge opponents in live coding sessions
- ⚡ **Live Submission Tracking** — Codeforces submissions polled every 8 seconds
- 🏆 **ELO Rating System** — Dynamic skill-based ranking (starts at 1000)
- 🎯 **Custom Battles** — Choose problem count, difficulty range, time limit, scoring mode
- 📊 **Global Leaderboard** — Real-time rankings
- 🔗 **Codeforces Integration** — Problems sourced directly from CF API

## Tech Stack
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT + bcrypt
- **Real-time**: Socket.io WebSockets
- **CF Integration**: Codeforces Public API (no OAuth needed — uses public submission data)

## Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone / enter directory
cd codeblitz

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Edit .env with your values:
# MONGO_URI=mongodb://localhost:27017/codeblitz
# JWT_SECRET=your_secret_here
# PORT=3000

# Start server
npm start

# Or for development (auto-reload)
npm run dev
```

Open `http://localhost:3000`

## How It Works

### Registration
1. Sign up with: Name, Email, Password, **Codeforces Handle**
2. Your CF handle is verified against the Codeforces API
3. You start with **1000 ELO**

### Battle Flow
1. **Create** a battle room → configure problems, time, scoring mode
2. Share the **6-character room code** with your opponent
3. Opponent **joins** with the room code
4. Battle starts automatically when both players join
5. Both players are redirected to Codeforces to solve problems
6. Submissions are **auto-detected** via CF API polling (~8s intervals)
7. **First to solve** earns a point; both move to next problem (in `first_solve` mode)
8. Battle ends when time runs out or all problems are solved
9. **ELO** is updated based on match result

### Scoring Modes
- **First Solve**: First player to solve a problem earns a point, both advance to next
- **Both Solve**: Both must solve each problem, points awarded on solve

### ELO Calculation
Uses standard Elo formula with K-factor of 32.
- Win against a higher-rated player = more ELO gained
- Loss against a lower-rated player = more ELO lost

## Important Notes
- Players **must be logged into codeforces.com** during battles
- Problem submissions are checked via the **public CF API** — no OAuth needed
- The polling checks the last 20 submissions on a player's profile
- For best results, don't solve CF problems outside of battles during an active match

## Project Structure
```
codeblitz/
├── server.js          # Express + Socket.io + MongoDB
├── package.json
├── .env.example
└── public/
    ├── index.html     # Login / Register
    ├── dashboard.html # User hub + Leaderboard
    ├── battle.html    # Live battle arena
    └── style.css      # Global styles
```

