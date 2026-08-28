# Complete Game Rules & Combat Mechanics — CARD ARENA

**Founder & Lead Architect:** Abhay Pandey  
**Engine:** Deterministic Authoritative State Machine  

---

## 1. Objective of the Game
Reduce the opponent's **Hero Health from 30 down to 0** while defending your own Hero and controlling the battlefield.

---

## 2. The 5-Stat Battle System

Every card in **CARD ARENA** features a 5-stat combat matrix:

| Stat | Name | Formula / Tactical Effect |
|---|---|---|
| 💎 **ENG** | Energy Cost | The reactor energy required from your mana pool to deploy the card. |
| 💥 **PWR** | Attack Power | The base strike damage dealt to defenders or the opposing hero. |
| ⚡ **SPD** | Speed Initiative | Priority in combat strikes ($1 - 10$ scale). |
| 🛡️ **AGI** | Agility Mitigation | Kinetic damage absorption ($\lfloor \text{AGI} / 3 \rfloor$) and evasion ($1 - 10$ scale). |
| ❤️ **HP** | Stamina Health | Maximum damage a unit can absorb before being destroyed. |

---

## 3. Combat Formulas & Strike Resolution

### 3.1 Speed Strike Initiative (Speed Duel)
When an Attacker attacks a Defender:

1. **If $\text{Attacker Speed} \ge \text{Defender Speed}$ (Attacker Strikes First):**
   * Damage Dealt to Defender = $\max(1, \text{Attacker PWR} - \lfloor \text{Defender AGI} / 3 \rfloor)$.
   * If Defender's HP drops to $\le 0$, the defender is **immediately destroyed** (SPEED STRIKE). The attacker takes **ZERO counter-damage**!
   * If Defender survives, defender counters with: $\max(1, \text{Defender PWR} - \lfloor \text{Attacker AGI} / 3 \rfloor)$.

2. **If $\text{Defender Speed} > \text{Attacker Speed}$ (Defender Parries First):**
   * Defender strikes first: Damage Dealt to Attacker = $\max(1, \text{Defender PWR} - \lfloor \text{Attacker AGI} / 3 \rfloor)$.
   * If Attacker's HP drops to $\le 0$, the attacker is **defeated before landing a hit** (SPEED PARRY).
   * If Attacker survives, attacker deals counter-damage.

---

## 4. Special Keywords & Abilities

* 🛡️ **Taunt:** Enemy minions and heroes MUST target this minion before attacking other targets or the hero.
* 🛡️ **Divine Shield:** Absorbs the first instance of combat damage completely (shield breaks after 1 hit).
* ⚡ **Rush:** Can attack enemy minions immediately on the turn it is summoned (cannot attack the hero on turn 1).
* 💥 **Battlecry:** An instant bonus effect that triggers the moment the card is deployed from hand.
* ✨ **Super Move:** Unique character ultimate abilities (e.g. *Thanos Infinity Snap*, *Goku Super Kamehameha*, *Charizard Mega Fire Blast*).

---

## 5. Turn Structure & Resource Progression

1. **Draw Phase:** Active player draws 1 card from their 14-card deck.
2. **Energy Reactor Refill:**
   * Turn 1: 1 Max Energy
   * Turn 2: 2 Max Energy ... ramping up to a maximum cap of **10 Energy**.
3. **Action Phase (60-Second Timer):**
   * Deploy minions from hand (up to 7 board limit).
   * Direct minions to attack enemy minions or enemy hero.
4. **End Turn Phase:**
   * Active player clicks "END TURN", passing initiative to the opponent.
5. **Fatigue Damage:**
   * If a player's deck is empty upon drawing, they take ramping fatigue damage ($1, 2, 3, 4\dots$) directly to their Hero HP.
