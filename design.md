# Design System & Motion UI Guide — CARD ARENA

**Founder & Lead Architect:** Abhay Pandey  
**Design Philosophy:** Cinematic Futuristic Esports Motion Design  

---

## 1. Core Visual Direction & Color Palette

**CARD ARENA** strictly avoids generic dashboard and casino aesthetics, utilizing a high-contrast futuristic cyber-battle theme.

### Color Tokens

| Token | Hex | Role |
|---|---|---|
| **Electric Blue** | `#0066FF` | Primary action buttons, energy glow, active borders |
| **Neon Cyan** | `#00F0FF` | Primary kinetic accents, laser particles, reactive focus rings |
| **Solar Gold** | `#FFD700` | Legendary tier cards, victory badges, Grandmaster crests |
| **Combat Crimson** | `#FF3B30` | Damage numbers, combat attacks, defeat indicators |
| **Deep Navy** | `#030712` | Dark mode base background |
| **Slate Charcoal** | `#0B1220` | Glassmorphism card surfaces and panel elevation |
| **Platinum Silver** | `#E2E8F0` | High-contrast kinetic typography and titles |

> *Rule: Purple is strictly avoided as a primary accent to preserve the cyan/blue cybernetic identity.*

---

## 2. Dual-Theme Design Tokens

Transitions between themes are animated across $500\text{ms}$ using CSS custom properties:

```css
:root {
  --bg-main: #030712;
  --bg-surface: #0b1220;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border-main: rgba(0, 240, 255, 0.2);
}

:root.light {
  --bg-main: #f8fafc;
  --bg-surface: #ffffff;
  --text-main: #09090b;
  --text-muted: #64748b;
  --border-main: rgba(0, 102, 255, 0.25);
}
```

---

## 3. Motion Design & 3D Interactive Physics

### 3.1 3D Cursor-Tracking Card Tilt
Cards utilize CSS 3D perspective (`perspective: 1000px`) and `transform-style: preserve-3d`. The card calculates mouse coordinates relative to center:

$$\text{rotateX} = \left(\frac{y - \text{centerY}}{\text{centerY}}\right) \times -14^\circ, \quad \text{rotateY} = \left(\frac{x - \text{centerX}}{\text{centerX}}\right) \times 14^\circ$$

### 3.2 Dynamic Holographic Specular Foil Sheen
An animated linear gradient overlay follows cursor movement across the card surface, mimicking high-end holographic trading cards:

```css
.holo-foil {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(0, 240, 255, 0.25) 30%,
    rgba(0, 102, 255, 0.3) 50%,
    rgba(255, 215, 0, 0.25) 70%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 200%;
}
```

### 3.3 60fps GPU Particle Arena Canvas
The background features a dedicated HTML5 `<canvas>` rendering 60 floating cybernetic energy nodes with distance-based connective webs and smooth cursor repulsion physics.

---

## 4. Typography Hierarchy
* **Display Titles:** `font-display` (Orbitron, Audiowide, Black 900) uppercase with gradient text clip.
* **Combat Numbers & Stats:** `font-mono` (JetBrains Mono) for rapid readability during intense turns.
* **Body & Descriptions:** `font-sans` (Inter) for clean text readability.
