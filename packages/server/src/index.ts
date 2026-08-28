import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createGameWebSocketServer } from './websocket/server.js';
import { PRESET_DECKS, CARD_DATABASE } from '@card-battler/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    engine: 'Authoritative Real-Time Card Game Engine',
    version: '1.0.0',
  });
});

// Card Catalog API
app.get('/api/cards', (_req, res) => {
  res.json({ cards: CARD_DATABASE });
});

// Deck Presets API
app.get('/api/decks', (_req, res) => {
  res.json({ decks: PRESET_DECKS });
});

const httpServer = createServer(app);
const { roomManager, matchmaker } = createGameWebSocketServer(httpServer);

// Server Metrics API
app.get('/api/metrics', (_req, res) => {
  res.json({
    queuedPlayers: matchmaker.getQueueLength(),
    timestamp: Date.now(),
  });
});

// Production Static Client Serving
const clientDistPath = path.resolve(__dirname, '../../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚔️  Real-Time Card Game Server is running!`);
  console.log(`📡 HTTP API listening at http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Server ready at ws://localhost:${PORT}/ws`);
  console.log(`====================================================`);
});
