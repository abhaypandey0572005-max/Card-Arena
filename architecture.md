# System Architecture & Technical Design — CARD ARENA

**Founder & Lead Architect:** Abhay Pandey  
**Monorepo Structure:** npm Workspaces (`@card-battler/shared`, `@card-battler/server`, `@card-battler/client`)  

---

## 1. High-Level Monorepo Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              CARD ARENA                                │
 │                                                                        │
 │   ┌───────────────────────┐             ┌──────────────────────────┐   │
 │   │  @card-battler/client │             │  @card-battler/server    │   │
 │   │  (React 19 + Vite)    │◄─── WS ────►│  (Node.js + Express)     │   │
 │   │  - 3D Motion Cards    │    /ws      │  - State Machine Engine  │   │
 │   │  - Custom Deck Studio │             │  - Dynamic Matchmaker    │   │
 │   │  - Leaderboard & Ranks│             │  - Chrono AI Controller  │   │
 │   └───────────┬───────────┘             └────────────┬─────────────┘   │
 │               │                                      │                 │
 │               └───────────────────┬──────────────────┘                 │
 │                                   ▼                                    │
 │                       ┌───────────────────────┐                        │
 │                       │  @card-battler/shared │                        │
 │                       │  (TypeScript Types)   │                        │
 │                       │  - Card Database (35+)│                        │
 │                       │  - WebSocket Protocol │                        │
 │                       │  - Combat Schemas     │                        │
 │                       └───────────────────────┘                        │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Layers & Responsibilities

### 2.1 `@card-battler/shared`
* **Data Catalog:** `CARD_DATABASE` (35+ character cards with Power, Speed, Agility, Health, Energy, and Super Moves) and `PRESET_DECKS`.
* **State Types:** `GameState`, `PlayerState`, `CardInstance`, `CombatLogEntry`.
* **Protocol Messages:** Full-duplex discriminated unions for client messages (`JOIN_QUEUE`, `CREATE_CUSTOM_ROOM`, `START_AI_MATCH`, `GAME_ACTION`) and server messages (`GAME_STATE`, `CUSTOM_ROOM_STATE`, `MATCH_FOUND`, `ACTION_REJECTED`).

### 2.2 `@card-battler/server`
* **Authoritative State Machine (`state-machine.ts`):** Pure deterministic state transitions. Implements Speed Initiative strike resolution and Agility kinetic mitigation.
* **Room Manager (`room-manager.ts`):** Manages active game rooms with a serialized Promise queue per room (`room.actionQueue`), eliminating concurrency race conditions.
* **Chrono AI Controller (`ai-bot.ts`):** Automated bot engine that checks mana curves, summons units, targets frontline units, and simulates human-like turn progression with a 1.2s thinking delay.
* **Custom Lobby Hub (`server.ts`):** Generates 6-digit room codes (`ARENA-XXXX`) and broadcasts live room states to host and guest.

### 2.3 `@card-battler/client`
* **React 19 + TypeScript + Tailwind CSS:** High-performance frontend UI.
* **Procedural Sound Engine (`audio.ts`):** Custom Web Audio API synthesizer generating real-time sound waves without audio downloads.
* **3D Perspective Engine (`Card3D.tsx`):** Mathematical mouse-tilt calculations with dynamic specular foil reflections.
* **Local Persistence:** Ranks, MMR, match history, theme preferences, and custom hybrid decks stored in `localStorage`.

---

## 3. Real-Time WebSocket Communication Flow

```
 Client (Player A)                   Node.js WebSocket Server             Client (Player B / AI)
        │                                       │                                   │
        │─── CREATE_CUSTOM_ROOM ───────────────►│                                   │
        │◄── CUSTOM_ROOM_STATE (ARENA-4921) ────│                                   │
        │                                       │◄── JOIN_CUSTOM_ROOM (ARENA-4921) ─│
        │◄── CUSTOM_ROOM_STATE (2/2 Players) ───┼─── CUSTOM_ROOM_STATE (2/2) ──────►│
        │                                       │                                   │
        │─── START_CUSTOM_MATCH ───────────────►│                                   │
        │◄── MATCH_FOUND + GAME_STATE ──────────┼─── MATCH_FOUND + GAME_STATE ─────►│
        │                                       │                                   │
        │─── GAME_ACTION (Play Thanos) ────────►│ (Validates Mana & Board Limit)   │
        │◄── GAME_STATE (Turn Updated) ─────────┼─── GAME_STATE (Turn Updated) ────►│
        │                                       │                                   │
```

---

## 4. Cloud Deployment Architecture
* **Single-Port Production Serving:** In production (`NODE_ENV=production`), the Node.js Express server automatically hosts compiled static assets from `packages/client/dist` and accepts WebSockets on `/ws` through the same port.
* **Infrastructure Manifest:** Includes `render.yaml` for 1-click Blueprint deployment and a multi-stage `Dockerfile`.
