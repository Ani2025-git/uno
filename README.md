# ⚡ CYBER UNO: Chaos Edition

> A high-performance, futuristic web card game inspired by modern UNO variants, elevated with **Jump-In mechanics**, **Shield Deflect cards**, **Mystery Glitch events**, **Stacking penalties**, and **7-0 Hand Swaps**.

---

## 🎮 Features & House Rules

### 1. ⚡ Jump-In Rule
If you hold the **exact matching card** (same color and same number/symbol) as the card just played on the discard pile, you can **Jump-In** immediately out of turn! Play then proceeds clockwise or counter-clockwise from your seat.

### 2. 🛡️ Shield Deflect Card
A defensive powerhouse! 
- Playing a **Shield Card** negates any incoming attack.
- If played against a stacked penalty (+2, +4, etc.), it **completely deflects the accumulated penalty cards**, saving you from taking the hit!

### 3. ✦ Mystery Glitch Card (Cyber Roulette)
When played, triggers an erratic cyber roulette event on the table:
- **Color Overload**: All cards in everyone's hands glitch into a single uniform color.
- **Hand Scramble**: Every player passes 1 random card to their neighbor.
- **Wild Surge**: +3 penalty cards erupt into the active table stack.

### 4. 💥 Stacking Combos
Chain +2 onto +2, +4 onto +4, or use a Shield to counter. Penalties accumulate until a player cannot counter and absorbs the entire hit!

### 5. 🔄 7 & 0 Hand Swaps
- **Playing a 7**: Choose any opponent to swap hands with.
- **Playing a 0**: All hands rotate around the table in the current turn direction.

### 6. 🤖 4 Adaptive AI Bot Personalities
- **Viper (Aggressive)**: Targets low-card players with 7s and hoards draw penalties.
- **Echo (Tactical)**: Saves shields for emergencies and tracks opponent color distributions.
- **Glitch (Chaotic)**: Fast jump-ins, prioritizes mystery cards and erratic plays.
- **Nova (Balanced)**: Highly competitive, classic high-level play.

### 7. 🎨 Cyber-Arcade Neon Aesthetic
- **Holographic 3D Cards**: Smooth curved hand fan with perspective tilt and dynamic hover elevation.
- **Custom Web Audio API Sound Engine**: Zero-latency procedural synth sound design (no missing sound files, crisp laser snaps, shield hums, victory fanfare).
- **Interactive Canvas Particles**: Ambient cyber nebula starfield, electric sparks on card placement, and celebratory victory confetti.
- **Emote Dock**: In-game animated cyber reactions (🔥, 💀, 🤣, 😱, 🤖, 🛡️, ⚡).

---

## 🚀 Running the Game Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: Vanilla HTML5, Vanilla CSS (Neon styling tokens, 3D CSS transforms), Vanilla JavaScript (ES6+ Modules, Web Audio API, Canvas 2D Physics).
- **Backend**: Node.js, Express, Native WebSockets (`ws`) for real-time multiplayer room creation and state synchronization.
- **Multiplayer Mode**: 6-character room codes with instant room creation, join codes, and host controls.
