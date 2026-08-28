# ⚔️ CARD ARENA — Real-Time Multiverse Card Battle Game

> A motion-design, real-time multiplayer card battle web application featuring iconic characters across **Marvel**, **DC**, **Pokemon**, **WWE**, and **Anime**. Built with TypeScript, React 19, Vite, TailwindCSS, Web Audio API, and native WebSockets.

---

## 🌟 Key Features

### 1. 🦸 5 Multiverse Universes & Official Character Artwork
* **Marvel:** Spider-Man, Iron Man (Mark 85), Thor (God of Thunder), Thanos (The Inevitable), Incredible Hulk, Doctor Strange.
* **DC:** Superman (Man of Steel), Batman (The Dark Knight), The Flash, Wonder Woman.
* **Pokemon:** Pikachu, Charizard (Mega Flame), Mewtwo (Psychic Titan), Blastoise, Gengar *(Official PokeAPI sprites)*.
* **WWE:** The Rock (People's Champ), John Cena, The Undertaker (Deadman), Roman Reigns (Tribal Chief).
* **Anime All-Stars:** Son Goku (Ultra Instinct), Naruto Uzumaki (Sage Mode), Monkey D. Luffy (Gear 5), Satoru Gojo (Honored One), Levi Ackerman.

### 2. ⚡ 5-Stat Tactical Combat Engine
* 💥 **Power (PWR):** Raw attack and damage output.
* ⚡ **Speed (SPD):** **Strike Initiative!** If Attacker Speed $\ge$ Defender Speed, attacker strikes first. If the defender is eliminated, they cannot counter-attack!
* 🛡️ **Agility (AGI):** **Kinetic Mitigation & Evasion!** Reduces incoming strike damage by up to $\lfloor \text{AGI} / 3 \rfloor$.
* ❤️ **Stamina (HP):** Maximum health pool.
* 💎 **Energy (ENG):** Deployment reactor cost.

### 3. 🎮 3 Complete Game Modes
1. 🤖 **Play vs Computer (AI):** Instant solo matches against the smart `Chrono AI` algorithmic bot.
2. 👥 **Play with Friends:** Private 6-digit room codes (`ARENA-XXXX`) with 1-click copyable invite links (`?room=ARENA-XXXX`).
3. 🌐 **Quick Match (Global PvP):** Real-time animated radar Elo matchmaking.

### 4. 🏆 Global Leaderboard & Rank Tiers
* Climb from 🥉 **Bronze Pilot** $\rightarrow$ 🥈 **Silver Striker** $\rightarrow$ 🥇 **Gold Champion** $\rightarrow$ 💎 **Platinum Vanguard** $\rightarrow$ 💠 **Diamond Overlord** $\rightarrow$ 👑 **Grandmaster Titan**.
* Live Match MMR tracking ($+25\text{ MMR}$ Win / $-15\text{ MMR}$ Loss) and match history log.

### 5. 🃏 Custom Hybrid Deck Builder
* Assemble custom 14-card hybrid decks mixing heroes across all universes (*Goku + Thanos + Pikachu + Superman*).
* Real-time stat balance radar (Average Power, Speed, Agility, Health) and Mana Curve histogram.
* Persistent `localStorage` deck storage.

### 6. 🎨 High-End Motion UI & Procedural Audio
* 🌙 **Dark / ☀️ Light Mode Switcher** with smooth 500ms transitions.
* **3D Holographic Tilt Cards** with cursor-following perspective and specular glare.
* **Procedural Web Audio API Sound Synthesizer** (zero-asset sound FX for card plays, slashes, shields, and victory fanfares).
* **Cinematic Battlefield** with kinetic *"YOUR TURN"* banner, screen shake, and floating combat numbers.

---

## 🛠️ Architecture & Tech Stack

```
realtime-card-game/
├── packages/
│   ├── shared/          # Shared TypeScript interfaces, card database, protocol schemas
│   ├── server/          # Node.js + Express + WebSocket state machine server
│   └── client/          # React 19 + TypeScript + Vite + TailwindCSS + Framer Motion
├── render.yaml          # 1-Click free cloud deployment configuration
└── Dockerfile           # Production containerized deployment
```

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
* **Backend:** Node.js, Express, native `ws` WebSockets, Nanoid.
* **Audio:** Web Audio API Procedural Synthesizer.
* **Engine:** Authoritative deterministic state machine with action serialization.

---

## 🚀 Quick Start (Run Locally)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/card-arena.git
cd card-arena
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## ☁️ Cloud Deployment

### Deploy to Render
1. Push this repository to your GitHub account.
2. Go to [Render.com](https://render.com) $\rightarrow$ New $\rightarrow$ Blueprint.
3. Connect your repository — Render will automatically read `render.yaml` and deploy the entire full-stack application for free!

---

## 📜 License
MIT License. Built for fun and competitive card gaming.
