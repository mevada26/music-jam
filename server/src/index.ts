import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Enable CORS for local development and mobile clients
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Socket.io initialization with CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Setup Socket.io real-time handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🎵 Rave Sync Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint ready for NTP sync & rooms`);
  console.log(`🔍 YouTube search API: http://localhost:${PORT}/api/search?q=query`);
  console.log(`=========================================`);
});
