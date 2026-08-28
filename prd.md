# Product Requirements Document (PRD) — CARD ARENA

**Product Name:** CARD ARENA  
**Version:** 1.0.0 (Production Release)  
**Founder & Lead Architect:** Abhay Pandey  
**Target Platform:** Web Browsers (Desktop, Tablet, Mobile)  

---

## 1. Executive Summary
**CARD ARENA** is a motion-design, real-time multiplayer card battle web application featuring iconic characters across 5 major universes: **Marvel**, **DC**, **Pokemon**, **WWE**, and **Anime** (+ Sci-Fi Apex). 

The platform blends competitive multiplayer gaming with cinematic motion graphics, 3D holographic card physics, procedural Web Audio synthesizer sound FX, a 5-stat tactical combat engine (Power, Speed, Agility, Health, Energy), private friend invite rooms, an automated AI practice bot, and a global Elo rating leaderboard.

---

## 2. Target Audience & Personas
1. **Competitive Card Gamers:** Players who enjoy Hearthstone, Magic: The Gathering, or Marvel Snap seeking rapid, tactical 3-minute matches.
2. **Pop Culture Enthusiasts:** Fans of Marvel, DC, Anime (Dragon Ball, Naruto, One Piece, Jujutsu Kaisen, Attack on Titan), Pokemon, and WWE.
3. **Casual Social Gamers:** Friends wanting instant 1-click private battle rooms with 6-digit codes and zero account registration friction.

---

## 3. Core Product Features

### 3.1 5-Universe Card Database & Official Visuals
* 35+ fully configured cards spanning Marvel, DC, Pokemon, WWE, and Anime.
* Official high-resolution character portraits and PokeAPI sprites with 3D mouse tilt and holographic foil specular glare.

### 3.2 5-Stat Battle Engine
* **Power (PWR):** Combat strike damage output.
* **Speed (SPD):** Initiative calculation. Units with $\text{Speed} \ge \text{Target Speed}$ strike first. If the defender is eliminated, they cannot counter-attack.
* **Agility (AGI):** Kinetic mitigation reducing incoming strike damage by $\lfloor \text{AGI} / 3 \rfloor$.
* **Stamina (HP):** Maximum survival pool.
* **Energy (ENG):** Deployment cost from the energy reactor.

### 3.3 Three Distinct Game Modes
1. **Quick Match (PvP):** Radar matchmaking with dynamic Elo search window expansion ($\pm 100\text{ MMR}$ every 3 seconds).
2. **Play with Friends:** Private 6-digit room codes (`ARENA-XXXX`) with 1-click copyable invite URLs (`?room=ARENA-XXXX`).
3. **Play vs Computer (AI):** Automated single-player practice matches against `Chrono AI` with intelligent combat pacing.

### 3.4 Custom Hybrid Deck Builder
* Assemble 14-card cross-universe dream decks (e.g. *Goku + Thanos + Pikachu + Superman*).
* Real-time balance radar (Average Power, Speed, Agility, Health) and Mana Curve histogram.
* Persistent `localStorage` save and edit capabilities.

### 3.5 Global Leaderboard & Rank Tier System
* Tiers: 🥉 Bronze Pilot $\rightarrow$ 🥈 Silver Striker $\rightarrow$ 🥇 Gold Champion $\rightarrow$ 💎 Platinum Vanguard $\rightarrow$ 💠 Diamond Overlord $\rightarrow$ 👑 Grandmaster Titan.
* Dynamic rating adjustments ($+25\text{ MMR}$ on Win, $-15\text{ MMR}$ on Defeat).
* Persistent match history logging with opponent names, decks used, and rating deltas.

### 3.6 Dual Theme & Audio Experience
* Dual Mode: 🌙 Dark Mode (Futuristic Battle Arena) and ☀️ Light Mode (Cybernetic Gaming Studio) with 500ms smooth CSS variable transitions.
* Procedural Web Audio API sound synthesizer with zero external asset latency.

---

## 4. Non-Functional Requirements (NFR)
* **Latency:** Server state action resolution under $50\text{ms}$ over native WebSockets.
* **Rendering Performance:** 60fps GPU canvas particle background and 3D card tilt with CSS `preserve-3d`.
* **Zero External Dependencies:** Built-in procedural sound FX and locally hosted character portraits.
* **Responsive:** Fully responsive from 360px mobile viewports to 4K ultra-wide monitors.
