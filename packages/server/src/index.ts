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

// Production Static Client Serving with multi-path resolution
const possiblePaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'packages/client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../../packages/client/dist'),
];

const clientDistPath = possiblePaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log('Serving client static files from:', clientDistPath);
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.log('No client dist found; serving backend API and status page');
  app.get('/', (_req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CARD ARENA — Game Engine Online</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { background: #030712; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #0b1220; border: 1px solid #00F0FF; padding: 40px; border-radius: 24px; text-align: center; box-shadow: 0 0 30px rgba(0,240,255,0.2); max-width: 480px; }
            h1 { color: #00F0FF; margin-bottom: 10px; font-weight: 900; letter-spacing: 2px; }
            .badge { display: inline-block; background: rgba(34,197,94,0.2); border: 1px solid #22c55e; color: #4ade80; padding: 4px 12px; border-radius: 12px; font-weight: 800; font-size: 12px; margin-bottom: 20px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            code { color: #FFD700; background: #030712; padding: 2px 6px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">● SERVER ONLINE</span>
            <h1>⚔️ CARD ARENA</h1>
            <p>Authoritative Real-Time Multiplayer WebSocket Engine is active and ready for battles!</p>
            <p>WebSocket Endpoint: <code>/ws</code></p>
          </div>
        </body>
      </html>
    `);
  });
}

httpServer.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚔️  Real-Time Card Game Server is running!`);
  console.log(`📡 HTTP API listening at http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Server ready at ws://localhost:${PORT}/ws`);
  console.log(`====================================================`);
});
