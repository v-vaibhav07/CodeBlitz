// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// const axios = require('axios');
// const path = require('path');
// require('dotenv').config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });

// app.use(cors());
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// // ─── MongoDB Models ───────────────────────────────────────────────────────────
// console.log("URI:", process.env.MONGO_URI);
// mongoose.connect(process.env.MONGO_URI, {
//   serverSelectionTimeoutMS: 30000,
//   socketTimeoutMS: 45000,
//   maxPoolSize: 10,
//   retryWrites: true,
//   retryReads: true,
// }).then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB error:', err.message));

// mongoose.connection.on('error', err => {
//   console.error('Mongoose connection error:', err.message);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB disconnected — reconnecting...');
//   setTimeout(() => {
//     mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 30000,
//       socketTimeoutMS: 45000,
//     }).catch(err => console.error('Reconnect error:', err.message));
//   }, 5000); // wait 5 seconds before reconnecting
// });

// process.on('unhandledRejection', (err) => {
//   console.error('Unhandled rejection:', err.message);
// });

// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, unique: true },
//   password: String,
//   cfHandle: { type: String, unique: true },
//   elo: { type: Number, default: 1000 },
//   wins: { type: Number, default: 0 },
//   losses: { type: Number, default: 0 },
//   eloHistory: [{ elo: Number, date: { type: Date, default: Date.now } }],
//   createdAt: { type: Date, default: Date.now }
// });

// const battleSchema = new mongoose.Schema({
//   roomCode: { type: String, unique: true },
//   players: [{
//     userId: mongoose.Schema.Types.ObjectId,
//     cfHandle: String,
//     name: String,
//     elo: { type: Number, default: 1000 },
//     score: { type: Number, default: 0 },
//     solvedProblems: [String]
//   }],
//   problems: [{
//     contestId: Number,
//     index: String,
//     name: String,
//     rating: Number,
//     points: { type: Number, default: 1 },
//     url: String
//   }],
//   currentProblemIndex: { type: Number, default: 0 },
//   scoringMode: { type: String, enum: ['first_solve', 'time_based'], default: 'first_solve' },
//   timeLimit: { type: Number, default: 30 }, // minutes
//   numProblems: { type: Number, default: 5 },
//   status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
//   startTime: Date,
//   endTime: Date,
//   winner: String,
//   eloChange: Number,
//   createdAt: { type: Date, default: Date.now }
// });

// const User = mongoose.model('User', userSchema);
// const Battle = mongoose.model('Battle', battleSchema);

// // ─── Auth Middleware ──────────────────────────────────────────────────────────

// const JWT_SECRET = process.env.JWT_SECRET || 'codeblitz_secret_2024';

// function authMiddleware(req, res, next) {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'No token' });
//   try {
//     req.user = jwt.verify(token, JWT_SECRET);
//     next();
//   } catch {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// }

// // ─── Codeforces API Helpers ───────────────────────────────────────────────────

// async function verifyCodeforcesHandle(handle) {
//   try {
//     const res = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
//     return res.data.status === 'OK' ? res.data.result[0] : null;
//   } catch {
//     return null;
//   }
// }

// // Calculate point value for a problem based on its rating
// function getProblemPoints(rating) {
//   if (rating < 1000) return 1;
//   if (rating < 1200) return 2;
//   if (rating < 1400) return 3;
//   if (rating < 1600) return 4;
//   if (rating < 1800) return 5;
//   if (rating < 2000) return 6;
//   if (rating < 2200) return 7;
//   if (rating < 2400) return 8;
//   if (rating < 2600) return 9;
//   return 10;
// }

// async function getSolvedProblems(cfHandle) {
//   try {
//     const res = await axios.get(
//       `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=1000`
//     );
//     if (res.data.status !== 'OK') return new Set();
//     const solved = new Set();
//     for (const sub of res.data.result) {
//       if (sub.verdict === 'OK') {
//         solved.add(`${sub.problem.contestId}${sub.problem.index}`);
//       }
//     }
//     return solved;
//   } catch {
//     return new Set();
//   }
// }

// async function fetchProblems(numProblems, minRating = 800, maxRating = 2000, handles = []) {
//   try {
//     // Fetch solved sets for both players in parallel
//     const solvedSets = await Promise.all(handles.map(h => getSolvedProblems(h)));
//     // Union of all solved problems — exclude if ANY player solved it
//     const allSolved = new Set();
//     for (const s of solvedSets) s.forEach(k => allSolved.add(k));

//     const res = await axios.get('https://codeforces.com/api/problemset.problems');
//     if (res.data.status !== 'OK') return [];
    
//     let problems = res.data.result.problems.filter(p => {
//       const key = `${p.contestId}${p.index}`;
//       return (
//         p.rating >= minRating &&
//         p.rating <= maxRating &&
//         p.contestId < 2000 &&
//         !allSolved.has(key)
//       );
//     });
    
//     // Shuffle and pick
//     for (let i = problems.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [problems[i], problems[j]] = [problems[j], problems[i]];
//     }
    
//     return problems.slice(0, numProblems).map(p => ({
//       contestId: p.contestId,
//       index: p.index,
//       name: p.name,
//       rating: p.rating,
//       points: getProblemPoints(p.rating),
//       url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
//     }));
//   } catch {
//     return [];
//   }
// }

// async function checkSolved(cfHandle, contestId, problemIndex) {
//   try {
//     const res = await axios.get(
//       `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=20`
//     );
//     if (res.data.status !== 'OK') return false;
    
//     return res.data.result.some(sub =>
//       sub.verdict === 'OK' &&
//       sub.problem.contestId === contestId &&
//       sub.problem.index === problemIndex
//     );
//   } catch {
//     return false;
//   }
// }

// // ─── Auth Routes ──────────────────────────────────────────────────────────────

// app.post('/api/register', async (req, res) => {
//   const { name, email, password, cfHandle } = req.body;
//   if (!name || !email || !password || !cfHandle)
//     return res.status(400).json({ error: 'All fields required' });

//   // Verify CF handle exists
//   const cfUser = await verifyCodeforcesHandle(cfHandle);
//   if (!cfUser) return res.status(400).json({ error: 'Codeforces handle not found' });

//   const existing = await User.findOne({ $or: [{ email }, { cfHandle }] });
//   if (existing) return res.status(400).json({ error: 'Email or CF handle already registered' });

//   const hashed = await bcrypt.hash(password, 10);
//   const user = await User.create({
//     name, email, password: hashed, cfHandle,
//     eloHistory: [{ elo: 1000, date: new Date() }]
//   });
//   const token = jwt.sign({ id: user._id, cfHandle: user.cfHandle, name: user.name }, JWT_SECRET);
//   res.json({ token, user: { name: user.name, email, cfHandle, elo: user.elo } });
// });

// app.post('/api/login', async (req, res) => {
//   const { identifier, password } = req.body;
//   if (!identifier || !password)
//     return res.status(400).json({ error: 'All fields required' });

//   // Allow login by email OR Codeforces handle
//   const user = await User.findOne({
//     $or: [
//       { email: identifier.toLowerCase() },
//       { cfHandle: identifier }
//     ]
//   });
//   if (!user) return res.status(400).json({ error: 'Invalid credentials' });

//   const valid = await bcrypt.compare(password, user.password);
//   if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

//   const token = jwt.sign({ id: user._id, cfHandle: user.cfHandle, name: user.name }, JWT_SECRET);
//   res.json({ token, user: { name: user.name, email: user.email, cfHandle: user.cfHandle, elo: user.elo, wins: user.wins, losses: user.losses } });
// });

// app.get('/api/me', authMiddleware, async (req, res) => {
//   const user = await User.findById(req.user.id).select('-password');
//   res.json(user);
// });

// // Public profile endpoint
// app.get('/api/profile/:cfHandle', async (req, res) => {
//   const user = await User.findOne({ cfHandle: req.params.cfHandle }).select('-password -email');
//   if (!user) return res.status(404).json({ error: 'User not found' });

//   // Count unique problems solved across all battles
//   const battles = await Battle.find({
//     'players.cfHandle': user.cfHandle,
//     status: 'finished'
//   });
//   const solvedSet = new Set();
//   for (const b of battles) {
//     const player = b.players.find(p => p.cfHandle === user.cfHandle);
//     if (player) player.solvedProblems.forEach(k => solvedSet.add(k));
//   }

//   res.json({
//     name: user.name,
//     cfHandle: user.cfHandle,
//     elo: user.elo,
//     wins: user.wins,
//     losses: user.losses,
//     eloHistory: user.eloHistory || [],
//     problemsSolved: solvedSet.size,
//     createdAt: user.createdAt
//   });
// });

// app.get('/api/leaderboard', async (req, res) => {
//   const users = await User.find().sort({ elo: -1 }).limit(20).select('name cfHandle elo wins losses');
//   res.json(users);
// });

// // ─── Battle Routes ────────────────────────────────────────────────────────────

// function generateRoomCode() {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }

// function calculateElo(winnerElo, loserElo, kFactor = 32) {
//   const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
//   const change = Math.round(kFactor * (1 - expectedWin));
//   return change;
// }

// app.post('/api/battle/create', authMiddleware, async (req, res) => {
//   const { numProblems, scoringMode, timeLimit, minRating, maxRating } = req.body;
  
//   const user = await User.findById(req.user.id);
//   // Pass the creator's handle so we filter out problems they've already solved
//   const problems = await fetchProblems(numProblems || 5, minRating || 800, maxRating || 1800, [user.cfHandle]);
//   if (!problems.length) return res.status(500).json({ error: 'Could not fetch problems' });

//   const roomCode = generateRoomCode();
  
//   const battle = await Battle.create({
//     roomCode,
//     players: [{ userId: user._id, cfHandle: user.cfHandle, name: user.name, elo: user.elo, score: 0, solvedProblems: [] }],
//     problems,
//     scoringMode: scoringMode || 'first_solve',
//     timeLimit: timeLimit || 30,
//     numProblems: numProblems || 5,
//     status: 'waiting'
//   });

//   res.json({ roomCode, battleId: battle._id });
// });

// app.post('/api/battle/join', authMiddleware, async (req, res) => {
//   const { roomCode } = req.body;
  
//   // Debug: find without status filter first
//   const anyBattle = await Battle.findOne({ roomCode });
//   console.log('Join attempt:', roomCode, '| Found:', !!anyBattle, '| Status:', anyBattle?.status);
  
//   const battle = await Battle.findOne({ roomCode, status: 'waiting' });
//   if (!battle) return res.status(404).json({ error: 'Room not found or already started' });
  
//   const user = await User.findById(req.user.id);
//   if (battle.players.find(p => p.userId.toString() === user._id.toString()))
//     return res.status(400).json({ error: 'Already in this room' });
//   if (battle.players.length >= 2)
//     return res.status(400).json({ error: 'Room is full' });

//   battle.players.push({ userId: user._id, cfHandle: user.cfHandle, name: user.name, elo: user.elo, score: 0, solvedProblems: [] });

//   // Re-fetch problems now that we know both handles, filtering out problems solved by either player
//   const handles = battle.players.map(p => p.cfHandle);
//   const { numProblems, scoringMode } = battle;
//   // Infer rating range from existing problems
//   const ratings = battle.problems.map(p => p.rating);
//   const minRating = Math.min(...ratings);
//   const maxRating = Math.max(...ratings);
//   const freshProblems = await fetchProblems(numProblems, minRating, maxRating, handles);
//   if (freshProblems.length >= numProblems) {
//     battle.problems = freshProblems;
//   }

//   await battle.save();

//   // Notify player 1 immediately via socket that opponent joined
//   io.to(roomCode).emit('player_joined', {
//     player: { name: user.name, cfHandle: user.cfHandle, elo: user.elo }
//   });

//   res.json({ roomCode, battleId: battle._id });
// });

// app.get('/api/battle/:roomCode', authMiddleware, async (req, res) => {
//   const battle = await Battle.findOne({ roomCode: req.params.roomCode });
//   if (!battle) return res.status(404).json({ error: 'Battle not found' });
//   res.json(battle);
// });

// // ─── Socket.io Battle Engine ──────────────────────────────────────────────────

// const pollingIntervals = {}; // roomCode -> interval
// const battleTimers = {};     // roomCode -> timeout

// io.on('connection', (socket) => {
//   console.log('Socket connected:', socket.id);

//   socket.on('join_room', async ({ roomCode, token }) => {
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);
//       socket.userId = decoded.id;
//       socket.cfHandle = decoded.cfHandle;
//       socket.roomCode = roomCode;
//       socket.join(roomCode);

//       const battle = await Battle.findOne({ roomCode });
//       if (!battle) return socket.emit('error', 'Battle not found');

//       io.to(roomCode).emit('battle_state', battle);
      
//       // Start battle when both players joined
//       if (battle.players.length === 2 && battle.status === 'waiting') {
//         battle.status = 'active';
//         battle.startTime = new Date();
//         await battle.save();
        
//         io.to(roomCode).emit('battle_start', {
//           battle,
//           message: 'Battle started! Good luck!'
//         });

//         startPolling(roomCode, battle);
        
//         // Set timer
//         const timeLimitMs = battle.timeLimit * 60 * 1000;
//         battleTimers[roomCode] = setTimeout(() => endBattle(roomCode, 'timeout'), timeLimitMs);
//       }
//     } catch (err) {
//       socket.emit('error', 'Auth failed');
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Socket disconnected:', socket.id);
//   });
// });

// async function startPolling(roomCode, battle) {
//   if (pollingIntervals[roomCode]) return;
  
//   pollingIntervals[roomCode] = setInterval(async () => {
//     try {
//       const currentBattle = await Battle.findOne({ roomCode });
//       if (!currentBattle || currentBattle.status !== 'active') {
//         clearInterval(pollingIntervals[roomCode]);
//         delete pollingIntervals[roomCode];
//         return;
//       }

//       const currentProblem = currentBattle.problems[currentBattle.currentProblemIndex];
//       if (!currentProblem) return;

//       let updated = false;

//       for (const player of currentBattle.players) {
//         const problemKey = `${currentProblem.contestId}${currentProblem.index}`;
//         if (player.solvedProblems.includes(problemKey)) continue;

//         const solved = await checkSolved(player.cfHandle, currentProblem.contestId, currentProblem.index);
        
//         if (solved) {
//           player.solvedProblems.push(problemKey);
//           const pointsEarned = currentProblem.points || 1;
//           player.score += pointsEarned;
//           updated = true;

//           io.to(roomCode).emit('problem_solved', {
//             solver: player.cfHandle,
//             solverName: player.name,
//             problem: currentProblem,
//             pointsEarned,
//             scores: currentBattle.players.map(p => ({ name: p.name, cfHandle: p.cfHandle, score: p.score }))
//           });

//           // Check if both solved current problem or move to next
//           const bothSolved = currentBattle.players.every(p =>
//             p.solvedProblems.includes(problemKey)
//           );

//           // Move to next problem after first solve (first_solve mode) or both solve
//           const shouldAdvance = currentBattle.scoringMode === 'first_solve' || bothSolved;

//           if (shouldAdvance) {
//             currentBattle.currentProblemIndex += 1;
            
//             if (currentBattle.currentProblemIndex >= currentBattle.numProblems) {
//               await currentBattle.save();
//               clearInterval(pollingIntervals[roomCode]);
//               delete pollingIntervals[roomCode];
//               endBattle(roomCode, 'completed');
//               return;
//             }

//             io.to(roomCode).emit('next_problem', {
//               problemIndex: currentBattle.currentProblemIndex,
//               problem: currentBattle.problems[currentBattle.currentProblemIndex]
//             });
//           }
//           break; // Process one solve per poll cycle
//         }
//       }

//       if (updated) await currentBattle.save();
//       io.to(roomCode).emit('battle_update', {
//         scores: currentBattle.players.map(p => ({
//           name: p.name, cfHandle: p.cfHandle, score: p.score
//         })),
//         currentProblemIndex: currentBattle.currentProblemIndex
//       });

//     } catch (err) {
//       console.error('Polling error:', err.message);
//     }
//   }, 8000); // Poll every 8 seconds
// }

// async function endBattle(roomCode, reason) {
//   try {
//     clearInterval(pollingIntervals[roomCode]);
//     delete pollingIntervals[roomCode];
//     clearTimeout(battleTimers[roomCode]);
//     delete battleTimers[roomCode];

//     const battle = await Battle.findOne({ roomCode });
//     if (!battle || battle.status === 'finished') return;

//     battle.status = 'finished';
//     battle.endTime = new Date();

//     const [p1, p2] = battle.players;
//     let winner = null;
//     let eloChange = 0;

//     if (p1 && p2) {
//       if (p1.score > p2.score) winner = p1.cfHandle;
//       else if (p2.score > p1.score) winner = p2.cfHandle;
//       else winner = 'draw';

//       // Update ELO
//       const u1 = await User.findOne({ cfHandle: p1.cfHandle });
//       const u2 = await User.findOne({ cfHandle: p2.cfHandle });

//       if (u1 && u2 && winner !== 'draw') {
//         const winnerUser = winner === p1.cfHandle ? u1 : u2;
//         const loserUser = winner === p1.cfHandle ? u2 : u1;

//         eloChange = calculateElo(winnerUser.elo, loserUser.elo);
//         winnerUser.elo += eloChange;
//         loserUser.elo = Math.max(100, loserUser.elo - eloChange);
//         winnerUser.wins += 1;
//         loserUser.losses += 1;

//         winnerUser.eloHistory.push({ elo: winnerUser.elo, date: new Date() });
//         loserUser.eloHistory.push({ elo: loserUser.elo, date: new Date() });

//         await winnerUser.save();
//         await loserUser.save();
//       }
//     }

//     battle.winner = winner;
//     battle.eloChange = eloChange;
//     await battle.save();

//     io.to(roomCode).emit('battle_end', {
//       winner,
//       reason,
//       eloChange,
//       scores: battle.players.map(p => ({ name: p.name, cfHandle: p.cfHandle, score: p.score }))
//     });
//   } catch (err) {
//     console.error('End battle error:', err.message);
//   }
// }

// // ─── Start Server ─────────────────────────────────────────────────────────────

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, '0.0.0.0', () => console.log(`CodeBlitz running on port ${PORT}`));









const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB Connection with Better Error Handling ───────────────────────────
console.log("MongoDB URI:", process.env.MONGO_URI?.substring(0, 80) + "...");

// Force IPv4 and add timeout options
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Reduced from 30000 to fail faster
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  family: 4, // Force IPv4 - THIS IS CRITICAL
  retryWrites: true,
  retryReads: true,
};

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🔌 Connection state:', mongoose.connection.readyState);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Tip: Make sure your IP is whitelisted in MongoDB Atlas');
    console.log('💡 Tip: Check if your password has special characters that need URL encoding');
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectToMongoDB, 5000);
  }
}

mongoose.connection.on('error', err => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected — attempting to reconnect...');
  setTimeout(connectToMongoDB, 5000);
});

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

// Start connection
connectToMongoDB();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
});

// ─── MongoDB Models ───────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  cfHandle: { type: String, unique: true },
  elo: { type: Number, default: 1000 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  eloHistory: [{ elo: Number, date: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now }
});

const battleSchema = new mongoose.Schema({
  roomCode: { type: String, unique: true },
  players: [{
    userId: mongoose.Schema.Types.ObjectId,
    cfHandle: String,
    name: String,
    elo: { type: Number, default: 1000 },
    score: { type: Number, default: 0 },
    solvedProblems: [String]
  }],
  problems: [{
    contestId: Number,
    index: String,
    name: String,
    rating: Number,
    points: { type: Number, default: 1 },
    url: String
  }],
  currentProblemIndex: { type: Number, default: 0 },
  scoringMode: { type: String, enum: ['first_solve', 'time_based'], default: 'first_solve' },
  timeLimit: { type: Number, default: 30 },
  numProblems: { type: Number, default: 5 },
  status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
  startTime: Date,
  endTime: Date,
  winner: String,
  eloChange: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Battle = mongoose.model('Battle', battleSchema);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'codeblitz_secret_2024';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Codeforces API Helpers ───────────────────────────────────────────────────
async function verifyCodeforcesHandle(handle) {
  try {
    const res = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    return res.data.status === 'OK' ? res.data.result[0] : null;
  } catch {
    return null;
  }
}

function getProblemPoints(rating) {
  if (rating < 1000) return 1;
  if (rating < 1200) return 2;
  if (rating < 1400) return 3;
  if (rating < 1600) return 4;
  if (rating < 1800) return 5;
  if (rating < 2000) return 6;
  if (rating < 2200) return 7;
  if (rating < 2400) return 8;
  if (rating < 2600) return 9;
  return 10;
}

async function getSolvedProblems(cfHandle) {
  try {
    const res = await axios.get(
      `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=1000`
    );
    if (res.data.status !== 'OK') return new Set();
    const solved = new Set();
    for (const sub of res.data.result) {
      if (sub.verdict === 'OK') {
        solved.add(`${sub.problem.contestId}${sub.problem.index}`);
      }
    }
    return solved;
  } catch {
    return new Set();
  }
}

async function fetchProblems(numProblems, minRating = 800, maxRating = 2000, handles = []) {
  try {
    const solvedSets = await Promise.all(handles.map(h => getSolvedProblems(h)));
    const allSolved = new Set();
    for (const s of solvedSets) s.forEach(k => allSolved.add(k));

    const res = await axios.get('https://codeforces.com/api/problemset.problems');
    if (res.data.status !== 'OK') return [];
    
    let problems = res.data.result.problems.filter(p => {
      const key = `${p.contestId}${p.index}`;
      return (
        p.rating >= minRating &&
        p.rating <= maxRating &&
        p.contestId < 2000 &&
        !allSolved.has(key)
      );
    });
    
    for (let i = problems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [problems[i], problems[j]] = [problems[j], problems[i]];
    }
    
    return problems.slice(0, numProblems).map(p => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      points: getProblemPoints(p.rating),
      url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
    }));
  } catch (error) {
    console.error('Fetch problems error:', error.message);
    return [];
  }
}

async function checkSolved(cfHandle, contestId, problemIndex) {
  try {
    const res = await axios.get(
      `https://codeforces.com/api/user.status?handle=${cfHandle}&from=1&count=20`
    );
    if (res.data.status !== 'OK') return false;
    
    return res.data.result.some(sub =>
      sub.verdict === 'OK' &&
      sub.problem.contestId === contestId &&
      sub.problem.index === problemIndex
    );
  } catch {
    return false;
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { name, email, password, cfHandle } = req.body;
  if (!name || !email || !password || !cfHandle)
    return res.status(400).json({ error: 'All fields required' });

  const cfUser = await verifyCodeforcesHandle(cfHandle);
  if (!cfUser) return res.status(400).json({ error: 'Codeforces handle not found' });

  const existing = await User.findOne({ $or: [{ email }, { cfHandle }] });
  if (existing) return res.status(400).json({ error: 'Email or CF handle already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name, email, password: hashed, cfHandle,
    eloHistory: [{ elo: 1000, date: new Date() }]
  });
  const token = jwt.sign({ id: user._id, cfHandle: user.cfHandle, name: user.name }, JWT_SECRET);
  res.json({ token, user: { name: user.name, email, cfHandle, elo: user.elo } });
});

app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ error: 'All fields required' });

  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { cfHandle: identifier }
    ]
  });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, cfHandle: user.cfHandle, name: user.name }, JWT_SECRET);
  res.json({ token, user: { name: user.name, email: user.email, cfHandle: user.cfHandle, elo: user.elo, wins: user.wins, losses: user.losses } });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

app.get('/api/profile/:cfHandle', async (req, res) => {
  const user = await User.findOne({ cfHandle: req.params.cfHandle }).select('-password -email');
  if (!user) return res.status(404).json({ error: 'User not found' });

  const battles = await Battle.find({
    'players.cfHandle': user.cfHandle,
    status: 'finished'
  });
  const solvedSet = new Set();
  for (const b of battles) {
    const player = b.players.find(p => p.cfHandle === user.cfHandle);
    if (player) player.solvedProblems.forEach(k => solvedSet.add(k));
  }

  res.json({
    name: user.name,
    cfHandle: user.cfHandle,
    elo: user.elo,
    wins: user.wins,
    losses: user.losses,
    eloHistory: user.eloHistory || [],
    problemsSolved: solvedSet.size,
    createdAt: user.createdAt
  });
});

app.get('/api/leaderboard', async (req, res) => {
  const users = await User.find().sort({ elo: -1 }).limit(20).select('name cfHandle elo wins losses');
  res.json(users);
});

// ─── Battle Routes ────────────────────────────────────────────────────────────
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculateElo(winnerElo, loserElo, kFactor = 32) {
  const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const change = Math.round(kFactor * (1 - expectedWin));
  return change;
}

app.post('/api/battle/create', authMiddleware, async (req, res) => {
  const { numProblems, scoringMode, timeLimit, minRating, maxRating } = req.body;
  
  const user = await User.findById(req.user.id);
  const problems = await fetchProblems(numProblems || 5, minRating || 800, maxRating || 1800, [user.cfHandle]);
  if (!problems.length) return res.status(500).json({ error: 'Could not fetch problems' });

  const roomCode = generateRoomCode();
  
  const battle = await Battle.create({
    roomCode,
    players: [{ userId: user._id, cfHandle: user.cfHandle, name: user.name, elo: user.elo, score: 0, solvedProblems: [] }],
    problems,
    scoringMode: scoringMode || 'first_solve',
    timeLimit: timeLimit || 30,
    numProblems: numProblems || 5,
    status: 'waiting'
  });

  res.json({ roomCode, battleId: battle._id });
});

app.post('/api/battle/join', authMiddleware, async (req, res) => {
  const { roomCode } = req.body;
  
  const anyBattle = await Battle.findOne({ roomCode });
  console.log('Join attempt:', roomCode, '| Found:', !!anyBattle, '| Status:', anyBattle?.status);
  
  const battle = await Battle.findOne({ roomCode, status: 'waiting' });
  if (!battle) return res.status(404).json({ error: 'Room not found or already started' });
  
  const user = await User.findById(req.user.id);
  if (battle.players.find(p => p.userId.toString() === user._id.toString()))
    return res.status(400).json({ error: 'Already in this room' });
  if (battle.players.length >= 2)
    return res.status(400).json({ error: 'Room is full' });

  battle.players.push({ userId: user._id, cfHandle: user.cfHandle, name: user.name, elo: user.elo, score: 0, solvedProblems: [] });

  const handles = battle.players.map(p => p.cfHandle);
  const { numProblems } = battle;
  const ratings = battle.problems.map(p => p.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const freshProblems = await fetchProblems(numProblems, minRating, maxRating, handles);
  if (freshProblems.length >= numProblems) {
    battle.problems = freshProblems;
  }

  await battle.save();

  io.to(roomCode).emit('player_joined', {
    player: { name: user.name, cfHandle: user.cfHandle, elo: user.elo }
  });

  res.json({ roomCode, battleId: battle._id });
});

app.get('/api/battle/:roomCode', authMiddleware, async (req, res) => {
  const battle = await Battle.findOne({ roomCode: req.params.roomCode });
  if (!battle) return res.status(404).json({ error: 'Battle not found' });
  res.json(battle);
});

// ─── Socket.io Battle Engine ──────────────────────────────────────────────────
const pollingIntervals = {};
const battleTimers = {};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_room', async ({ roomCode, token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.cfHandle = decoded.cfHandle;
      socket.roomCode = roomCode;
      socket.join(roomCode);

      const battle = await Battle.findOne({ roomCode });
      if (!battle) return socket.emit('error', 'Battle not found');

      io.to(roomCode).emit('battle_state', battle);
      
      if (battle.players.length === 2 && battle.status === 'waiting') {
        battle.status = 'active';
        battle.startTime = new Date();
        await battle.save();
        
        io.to(roomCode).emit('battle_start', {
          battle,
          message: 'Battle started! Good luck!'
        });

        startPolling(roomCode, battle);
        
        const timeLimitMs = battle.timeLimit * 60 * 1000;
        battleTimers[roomCode] = setTimeout(() => endBattle(roomCode, 'timeout'), timeLimitMs);
      }
    } catch (err) {
      socket.emit('error', 'Auth failed');
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

async function startPolling(roomCode, battle) {
  if (pollingIntervals[roomCode]) return;
  
  pollingIntervals[roomCode] = setInterval(async () => {
    try {
      const currentBattle = await Battle.findOne({ roomCode });
      if (!currentBattle || currentBattle.status !== 'active') {
        clearInterval(pollingIntervals[roomCode]);
        delete pollingIntervals[roomCode];
        return;
      }

      const currentProblem = currentBattle.problems[currentBattle.currentProblemIndex];
      if (!currentProblem) return;

      let updated = false;

      for (const player of currentBattle.players) {
        const problemKey = `${currentProblem.contestId}${currentProblem.index}`;
        if (player.solvedProblems.includes(problemKey)) continue;

        const solved = await checkSolved(player.cfHandle, currentProblem.contestId, currentProblem.index);
        
        if (solved) {
          player.solvedProblems.push(problemKey);
          const pointsEarned = currentProblem.points || 1;
          player.score += pointsEarned;
          updated = true;

          io.to(roomCode).emit('problem_solved', {
            solver: player.cfHandle,
            solverName: player.name,
            problem: currentProblem,
            pointsEarned,
            scores: currentBattle.players.map(p => ({ name: p.name, cfHandle: p.cfHandle, score: p.score }))
          });

          const bothSolved = currentBattle.players.every(p =>
            p.solvedProblems.includes(problemKey)
          );

          const shouldAdvance = currentBattle.scoringMode === 'first_solve' || bothSolved;

          if (shouldAdvance) {
            currentBattle.currentProblemIndex += 1;
            
            if (currentBattle.currentProblemIndex >= currentBattle.numProblems) {
              await currentBattle.save();
              clearInterval(pollingIntervals[roomCode]);
              delete pollingIntervals[roomCode];
              endBattle(roomCode, 'completed');
              return;
            }

            io.to(roomCode).emit('next_problem', {
              problemIndex: currentBattle.currentProblemIndex,
              problem: currentBattle.problems[currentBattle.currentProblemIndex]
            });
          }
          break;
        }
      }

      if (updated) await currentBattle.save();
      io.to(roomCode).emit('battle_update', {
        scores: currentBattle.players.map(p => ({
          name: p.name, cfHandle: p.cfHandle, score: p.score
        })),
        currentProblemIndex: currentBattle.currentProblemIndex
      });

    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }, 8000);
}

async function endBattle(roomCode, reason) {
  try {
    clearInterval(pollingIntervals[roomCode]);
    delete pollingIntervals[roomCode];
    clearTimeout(battleTimers[roomCode]);
    delete battleTimers[roomCode];

    const battle = await Battle.findOne({ roomCode });
    if (!battle || battle.status === 'finished') return;

    battle.status = 'finished';
    battle.endTime = new Date();

    const [p1, p2] = battle.players;
    let winner = null;
    let eloChange = 0;

    if (p1 && p2) {
      if (p1.score > p2.score) winner = p1.cfHandle;
      else if (p2.score > p1.score) winner = p2.cfHandle;
      else winner = 'draw';

      const u1 = await User.findOne({ cfHandle: p1.cfHandle });
      const u2 = await User.findOne({ cfHandle: p2.cfHandle });

      if (u1 && u2 && winner !== 'draw') {
        const winnerUser = winner === p1.cfHandle ? u1 : u2;
        const loserUser = winner === p1.cfHandle ? u2 : u1;

        eloChange = calculateElo(winnerUser.elo, loserUser.elo);
        winnerUser.elo += eloChange;
        loserUser.elo = Math.max(100, loserUser.elo - eloChange);
        winnerUser.wins += 1;
        loserUser.losses += 1;

        winnerUser.eloHistory.push({ elo: winnerUser.elo, date: new Date() });
        loserUser.eloHistory.push({ elo: loserUser.elo, date: new Date() });

        await winnerUser.save();
        await loserUser.save();
      }
    }

    battle.winner = winner;
    battle.eloChange = eloChange;
    await battle.save();

    io.to(roomCode).emit('battle_end', {
      winner,
      reason,
      eloChange,
      scores: battle.players.map(p => ({ name: p.name, cfHandle: p.cfHandle, score: p.score }))
    });
  } catch (err) {
    console.error('End battle error:', err.message);
  }
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 CodeBlitz running on port ${PORT}`));
console.log(`📱 Open http://localhost:${PORT} in your browser`);