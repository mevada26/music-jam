import express, { Request, Response } from 'express';
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

// Root health check endpoint (e.g. for Render or browser testing)
app.get(['/', '/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: '🎵 Rave Sync Backend Server is running healthy!',
    serverTime: Date.now(),
    service: 'Rave Sync Server',
    uptime: Math.floor(process.uptime()),
  });
});

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
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`=========================================`);
});
