# 🧠 Memory — CARD ARENA Project

> A living document that tracks project context, architecture, key decisions, change history, and user preferences throughout development.

---

## Project Identity

| Field | Value |
| :--- | :--- |
| **Project Name** | CARD ARENA (कार्ड एरीना) |
| **Type** | Real-time Multiplayer Web Card Battler & 5-Card Stat Showdown Game |
| **Founder & Lead** | Abhay Pandey |
| **Repository** | [github.com/abhaypandey0572005-max/Card-Arena](https://github.com/abhaypandey0572005-max/Card-Arena.git) |
| **Frontend Deployment**| Vercel (`dist` output via Vite build) |
| **Backend Deployment** | Render (`render.yaml` Docker/Node service running WebSocket server) |
| **Local Workspace** | `C:\Users\Dell\.gemini\antigravity\scratch\realtime-card-game\` |
| **Status** | ✅ Production Ready (v1.4) |

---

## Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Monorepo Architecture** | npm workspaces | 3 packages: `@card-battler/client`, `@card-battler/server`, `@card-battler/shared` |
| **Frontend Framework** | React 19 + TypeScript | High-performance reactive UI with strict typings |
| **Build Tool & Bundler** | Vite 6 | Sub-second HMR and optimized production bundling |
| **Styling & Effects** | Tailwind CSS + Lucide Icons | Glassmorphism, cybernetic gradients, Cinzel & Inter typography |
| **3D & Motion** | CSS `preserve-3d`, Canvas Confetti | 3D holographic tilt, foil sheen reflection, victory confetti |
| **Sound System** | Procedural Web Audio API | Zero-dependency synth for lasers, clashes, victory fanfares, card snaps |
| **Backend Server** | Node.js + Express + `ws` | WebSocket server with room matchmaking, ping heartbeats, and AI engine |
| **Character Artwork** | PokeAPI, Jikan, Wikimedia, Superhero API | High-definition portrait assets stored in `packages/client/public/cards/` |

---

## Monorepo File Structure

```
realtime-card-game/
├── package.json                    # Workspace root scripts (build, dev, test)
├── vercel.json                     # Vercel configuration for SPA routing & caching
├── render.yaml                     # Render deployment manifest for backend service
├── architecture.md                 # System architecture & WebSocket protocol
├── prd.md                          # Product Requirements Document
├── memory.md                       # This living context document
├── rules.md                        # Coding standards & conventions
├── phases.md                       # Roadmap & phase breakdown
│
├── packages/
│   ├── shared/                     # Shared models, card templates, game state types
│   │   ├── src/
│   │   │   ├── types/              # CardTemplate, GameState, PlayerState, Actions
│   │   │   └── data/cards.ts       # 60 Cards (12 per universe) + Preset Decks
│   │   └── package.json
│   │
│   ├── server/                     # Real-time WebSocket game server
│   │   ├── src/
│   │   │   ├── engine/             # State machine, combat resolver, bot AI
│   │   │   ├── matchmaking/        # Queue manager & private room codes
│   │   │   └── server.ts           # HTTP + WS server entry point
│   │   └── package.json
│   │
│   └── client/                     # React Vite client application
│       ├── public/
│       │   └── cards/              # HD artwork for Marvel, DC, WWE, Anime (60+ images)
│       ├── src/
│       │   ├── components/
│       │   │   ├── ShowdownArena.tsx     # 5-Card Stat Showdown game mode
│       │   │   ├── Battlefield.tsx       # Grid-based tactical arena
│       │   │   ├── Card3D.tsx            # Holographic tilt card component
│       │   │   ├── CharacterArt.tsx      # Multi-source dynamic character art renderer
│       │   │   ├── UniverseSelector.tsx  # Realm selection modal (Marvel, DC, etc.)
│       │   │   ├── DeckBuilder.tsx       # Custom hybrid deck builder
│       │   │   └── Leaderboard.tsx       # Global Elo MMR rankings
│       │   ├── utils/
│       │   │   ├── showdown-engine.ts    # 3-Stat duel calculator & AI logic
│       │   │   └── audio.ts              # Web Audio procedural sound FX
│       │   ├── hooks/useGameSocket.ts    # WebSocket hook with auto-reconnect
│       │   ├── App.tsx                   # Top-level screen coordinator
│       │   └── main.tsx                  # React DOM mount point
│       └── package.json
```

---

## Key Decisions Log

### Decision 1: Monorepo with Shared Typings (`@card-battler/shared`)
- **Context:** Ensuring game state rules, card definitions, and combat outcomes are strictly synchronized across client and server.
- **Decision:** Built a shared TypeScript workspace compiled prior to both client and server builds.
- **Rationale:** Prevents desync bugs between client rendering and server validation.

### Decision 2: Deployment Split (Render Backend + Vercel Frontend)
- **Context:** Vercel serverless does not natively support persistent stateful WebSockets.
- **Decision:** Deployed backend Node.js WebSocket service on Render, while frontend is deployed as a high-speed static Vite bundle on Vercel. Added auto-fallback WebSocket URL detection in `useGameSocket.ts`.

### Decision 3: Dedicated 5-Card Stat Showdown Mode (Simplified Gameplay)
- **Context:** User found the original 4x3 grid-based battlefield too complex for quick play and wanted a direct, nostalgic "Trump Cards" / Top Trumps experience.
- **Decision:** Built `ShowdownArena.tsx` and `showdown-engine.ts`:
  - 5 random cards dealt to Player and Computer from the chosen universe.
  - 5 fast rounds of 1v1 character clashes comparing **Attack (💥)**, **Speed (⚡)**, and **Agility (🛡️)**.
  - Winner gets +1 point. First to 5 rounds concludes the match.

### Decision 4: Equal 12-Card Rosters Per Universe
- **Context:** User requested equal cards for each universe (10-12 cards) instead of uneven card pools.
- **Decision:** Curated exactly 12 minion cards for all 5 universes:
  - **Marvel (12):** Spider-Man, Iron Man, Thor, Hulk, Thanos, Wolverine, Captain America, Deadpool, Scarlet Witch, Black Panther, Doctor Strange, Venom.
  - **DC (12):** The Flash, Harley Quinn, Batman, The Joker, Aquaman, Green Lantern, Wonder Woman, Superman, Darkseid, Cyborg, Green Arrow, Nightwing.
  - **Pokemon (12):** Pikachu, Blastoise, Gengar, Mewtwo, Charizard, Lucario, Greninja, Rayquaza, Snorlax, Dragonite, Eevee, Machamp.
  - **WWE (12):** John Cena, The Rock, Roman Reigns, The Undertaker, Brock Lesnar, Triple H, Stone Cold Steve Austin, Randy Orton, Seth Rollins, Rey Mysterio, Edge, Kane.
  - **Anime (12):** Levi Ackerman, Naruto Uzumaki, Monkey D. Luffy, Gojo Satoru, Goku, Roronoa Zoro, Sasuke Uchiha, Vegeta, Saitama, Tanjiro Kamado, Ichigo Kurosaki, Kakashi Hatake.

### Decision 5: "Loser Plays First" Dynamic Turn Initiative
- **Context:** In original AI battles, Computer was only countering or player was always leading. The user requested: *"I want the loser to play the chance like if I won that particular round then computer have to play chance and if computer won then I have to play."*
- **Decision:** Implemented dynamic turn initiative:
  - **Round 1:** Player leads $\rightarrow$ Computer counters.
  - **Round N (If Player won):** Computer is the loser $\rightarrow$ Computer is forced to lead! Computer plays its card onto the pedestal $\rightarrow$ Player inspects its Attack/Speed/Agility and tactically picks the counter card!
  - **Round N (If Computer won):** Player is the loser $\rightarrow$ Player must lead $\rightarrow$ Computer counters.
  - **Tied Round:** Turn initiative alternates.

### Decision 6: Zero-Asset Procedural Audio Synthesizer
- **Context:** Avoid loading large MP3/WAV files that can fail or lag.
- **Decision:** Used browser native Web Audio API oscillators and gain envelopes to procedurally synthesize lasers, impacts, card swooshes, and victory fanfares.

---

## 60-Card Master Universe Matrix (12 Cards Each)

| Universe | 12 Minion Cards | Key Strengths |
| :--- | :--- | :--- |
| **Marvel** | Spider-Man, Iron Man, Thor, Hulk, Thanos, Wolverine, Captain America, Deadpool, Scarlet Witch, Black Panther, Doctor Strange, Venom | Balanced combatants with high Attack (Hulk 10, Thanos 9) and nimble acrobats (Spider-Man 9 Agi) |
| **DC** | The Flash, Harley Quinn, Batman, The Joker, Aquaman, Green Lantern, Wonder Woman, Superman, Darkseid, Cyborg, Green Arrow, Nightwing | Extreme speed (The Flash 10 Spd) and supreme titans (Superman 10 Atk, Darkseid 10 HP) |
| **Pokemon** | Pikachu, Blastoise, Gengar, Mewtwo, Charizard, Lucario, Greninja, Rayquaza, Snorlax, Dragonite, Eevee, Machamp | High agility and speed (Greninja 10 Spd/10 Agi, Pikachu 10 Spd, Rayquaza 10 Atk) |
| **WWE** | John Cena, The Rock, Roman Reigns, The Undertaker, Brock Lesnar, Triple H, Stone Cold Steve Austin, Randy Orton, Seth Rollins, Rey Mysterio, Edge, Kane | High raw power and stamina (Brock Lesnar 10 Atk, Undertaker 10 HP, Rey Mysterio 10 Spd/Agi) |
| **Anime** | Levi, Naruto, Luffy, Gojo, Goku, Zoro, Sasuke, Vegeta, Saitama, Tanjiro, Ichigo, Kakashi | Maximum strike ratings and supreme agility (Saitama 10 Atk, Goku 10 Atk, Gojo 10 Agi, Levi 10 Spd) |

---

## Change History Log

### v1.0 — Initial Fullstack Release
- Fullstack monorepo with Express/WS server and React 19 client.
- 4x3 tactical battlefield grid with summon phases, card movement, and super moves.
- Lobby with Quick Match, Private Friend Code rooms, and Chrono AI bot.
- Persistent Elo leaderboard and Deck Builder.

### v1.1 — Cloud Deployment
- Configured Render backend with Docker/Node service.
- Configured Vercel frontend with SPA rewrites.
- Added smart auto-reconnecting WebSocket client hook.

### v1.2 — Universe vs Universe & Streamlined Battle
- Added Universe Selector modal (Marvel vs Marvel, DC vs DC, etc.).
- Started tactical matches with 3 starting energy and 1-click "All-Out Strike".
- Added high-resolution character artwork for heroes.

### v1.3 — 5-Card Stat Showdown Mode
- Introduced 5-card Top Trumps-style battle mode (`ShowdownArena.tsx`).
- 3-stat duel engine comparing Attack, Speed, and Agility.
- Smart AI counter picking algorithm saving high-power cards.
- Screen shake and 3D clash presentation.

### v1.4 — 12 Cards per Universe & Dynamic Turn Initiative
- Expanded all 5 universes to exactly 12 cards with balanced stats and local HD artwork.
- Implemented "Loser Plays First" dynamic initiative where the loser of each round is forced to lead, giving the winner the counter advantage.
- Clean build across all packages and synced with GitHub `origin/main`.

### v1.5 — Player Authentication & Founder Profile Integration (Current)
- Built cinematic **LoginPage** with Username & Password authentication, Remember Me session persistence, and custom Champion Avatar selection.
- Created local authentication engine (`auth.ts`) with account creation, password validation, and seeded Founder account.
- Enhanced **Founder Section** (`FounderModal.tsx` + Spotlight Card on Login Page) with comprehensive details of **Abhay Pandey** (Founder & Lead Architect, GitHub profile, project repository, direct contact email, and full-stack technical contributions).
- Added navbar login badge showing active username, online status, and seamless account sign-out / switching.

---

## User Preferences (Learned)

- **Language:** Prefers Hindi / Hinglish in conversation ("Bhai...", "yess", etc.).
- **Simplicity Over Complexity:** Strongly favors clear, fast, intuitive card duels (like Top Trumps / Trump Cards) over overly complex multi-rule systems.
- **Universe Purity:** Enjoys playing universe-pure matches (Marvel vs Marvel, DC vs DC, Anime vs Anime, etc.).
- **Fairness & Balance:** Demands equal deck roster sizes (exactly 12 cards per universe) and fair rules.
- **Dynamic Advantage:** Loved the classic card game rule: "The loser of a round must lead next round; the winner gets the advantage to inspect and counter."
- **Automation:** Prefers automated builds and git push without needing to manually run complex commands.

---

## Future Roadmap

- [ ] 🔊 Audio Mute / Unmute toggle button directly in the Showdown Arena UI.
- [ ] 👥 2-Player Online Multiplayer support for the 5-Card Stat Showdown mode.
- [ ] 📱 Mobile haptic vibration feedback for device browsers during clashes.
- [ ] 🌟 Special Ability / Super Move trigger during tied stat rounds.
- [ ] 🏅 Achievements system for 5-0 clean sweeps.

---

*Last updated: 2026-09-08 15:30 IST*
