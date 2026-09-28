/**
 * Smart AI Bot Decision Logic & Personalities
 * Fully equipped with UNO No Mercy strategies (Stacking +6/+10, Discard All, Skip Everyone)
 */
const BOT_PROFILES = [
  { name: 'Viper', personality: 'aggressive', avatar: '🐍', tag: 'Aggressive' },
  { name: 'Echo', personality: 'tactical', avatar: '🤖', tag: 'Tactical' },
  { name: 'Glitch', personality: 'chaotic', avatar: '⚡', tag: 'Chaotic' },
  { name: 'Nova', personality: 'balanced', avatar: '🔮', tag: 'Balanced' },
  { name: 'Titan', personality: 'brute', avatar: '🛡️', tag: 'Brute' }
];

class BotPlayer {
  constructor(id, name, personality = 'balanced', avatar = '🤖') {
    this.id = id;
    this.name = name;
    this.personality = personality;
    this.avatar = avatar;
    this.hand = [];
    this.isBot = true;
    this.hasCalledUno = false;
    this.isEliminated = false;
  }

  chooseMove(gameState) {
    if (this.isEliminated) return null;
    const { topCard, activeColor, stackCount, houseRules } = gameState;

    const playable = this.hand.filter(card => 
      isCardPlayable(card, topCard, activeColor, stackCount, houseRules)
    );

    if (playable.length === 0) return null;

    // 1. If under attack (>0 stack), ALWAYS counter with highest draw card or shield!
    if (stackCount > 0) {
      const shield = playable.find(c => c.type === 'shield');
      if (shield) return shield;

      const nuke10 = playable.find(c => c.type === 'wild_draw10');
      if (nuke10) return nuke10;

      const draw6 = playable.find(c => c.type === 'wild_draw6');
      if (draw6) return draw6;

      const draw4 = playable.find(c => c.type === 'wild_draw4');
      if (draw4) return draw4;

      const draw2 = playable.find(c => c.type === 'draw2');
      if (draw2) return draw2;
    }

    // 2. Discard All check: If bot holds multiple cards of that color, shed them!
    const discardAll = playable.find(c => c.type === 'discard_all');
    if (discardAll) {
      const colorCards = this.hand.filter(c => c.color === discardAll.color);
      if (colorCards.length >= 2) return discardAll;
    }

    // 3. Skip Everyone (Skip All) is always high priority to take another turn
    const skipAll = playable.find(c => c.type === 'skip_everyone');
    if (skipAll) return skipAll;

    // 4. Personality-specific logic
    if (this.personality === 'aggressive' || this.personality === 'brute') {
      const attacks = playable.filter(c => 
        c.type === 'wild_draw10' || c.type === 'wild_draw6' || c.type === 'wild_draw4' || c.type === 'draw2'
      );
      if (attacks.length > 0) return attacks[0];

      const discard = playable.find(c => c.type === 'discard_all');
      if (discard) return discard;

      const numbers = playable.filter(c => c.type === 'number').sort((a, b) => b.value - a.value);
      if (numbers.length > 0) return numbers[0];

      return playable[0];
    }

    if (this.personality === 'tactical') {
      // Save +10 and Shields for defense unless down to 2 cards
      if (this.hand.length > 3) {
        const standard = playable.filter(c => c.type !== 'wild_draw10' && c.type !== 'shield');
        if (standard.length > 0) return standard[0];
      }
      return playable[0];
    }

    if (this.personality === 'chaotic') {
      const roulette = playable.find(c => c.type === 'wild_roulette');
      if (roulette) return roulette;

      const mystery = playable.find(c => c.type === 'mystery');
      if (mystery) return mystery;

      return playable[Math.floor(Math.random() * playable.length)];
    }

    // Balanced
    const numbers = playable.filter(c => c.type === 'number');
    if (numbers.length > 0) return numbers[0];

    return playable[0];
  }

  chooseWildColor(gameState) {
    const counts = this.getColorCounts();
    const colors = ['red', 'blue', 'green', 'yellow'];
    let bestColor = 'red';
    let max = -1;

    colors.forEach(color => {
      const c = counts[color] || 0;
      if (c > max) {
        max = c;
        bestColor = color;
      }
    });

    return bestColor;
  }

  chooseSwapTarget(players) {
    const opponents = players.filter(p => p.id !== this.id && !p.isEliminated && p.hand.length > 0);
    opponents.sort((a, b) => a.hand.length - b.hand.length);
    return opponents[0] ? opponents[0].id : null;
  }

  getColorCounts() {
    const counts = {};
    this.hand.forEach(c => {
      if (c.color !== 'wild') {
        counts[c.color] = (counts[c.color] || 0) + 1;
      }
    });
    return counts;
  }
}

if (typeof window !== 'undefined') window.BotPlayer = BotPlayer;
if (typeof global !== 'undefined') global.BotPlayer = BotPlayer;
