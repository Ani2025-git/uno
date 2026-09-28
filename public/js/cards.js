/**
 * Card Models, Vector SVG Assets, Deck Generator & Rule Validation
 * Including Full UNO No Mercy (Show 'Em No Mercy) Suite
 */
const CARD_COLORS = ['red', 'blue', 'green', 'yellow'];

const COLOR_HEX = {
  red: '#ff1e38',
  blue: '#0084ff',
  green: '#00d659',
  yellow: '#ffd000',
  wild: '#181b2a',
  shield: '#00f0ff',
  mystery: '#a855f7'
};

class Card {
  constructor(color, type, value = null, id = null) {
    this.color = color; // 'red', 'blue', 'green', 'yellow', 'wild'
    this.type = type;   // 'number', 'skip', 'reverse', 'draw2', 'wild', 'wild_draw4', 'wild_draw6', 'wild_draw10', 'discard_all', 'skip_everyone', 'wild_roulette', 'shield', 'mystery'
    this.value = value; // 0-9 for number, or null
    this.id = id || `${color}_${type}_${value !== null ? value : ''}_${Math.random().toString(36).substr(2, 6)}`;
    this.rotation = (Math.random() - 0.5) * 14;
  }

  get displayName() {
    if (this.type === 'number') return `${this.value}`;
    if (this.type === 'draw2') return '+2';
    if (this.type === 'wild_draw4') return '+4';
    if (this.type === 'wild_draw6') return '+6';
    if (this.type === 'wild_draw10') return '+10';
    if (this.type === 'discard_all') return 'DISCARD ALL';
    if (this.type === 'skip_everyone') return 'SKIP ALL';
    if (this.type === 'wild_roulette') return 'ROULETTE';
    if (this.type === 'shield') return 'SHIELD';
    if (this.type === 'mystery') return 'GLITCH';
    return this.type.toUpperCase();
  }
}

/**
 * Creates authentic vector SVG markup for any card
 */
function getCardSVG(card) {
  const isWild = card.color === 'wild';
  const hex = COLOR_HEX[card.color] || '#333';

  // ==========================================
  // NO MERCY CARDS
  // ==========================================

  // 1. WILD DRAW 10 (THE NUKE)
  if (card.type === 'wild_draw10') {
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nukeGrad_${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0a0510"/>
            <stop offset="100%" stop-color="#2a0005"/>
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="114" height="174" rx="14" fill="url(#nukeGrad_${card.id})" stroke="#ff0044" stroke-width="4"/>
        <!-- Warning hazard stripes rim -->
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#180005" stroke="#ff0044" stroke-width="3" transform="rotate(-28 60 90)"/>
        <!-- Center +10 with flame effect -->
        <g transform="translate(60, 94)">
          <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="36" fill="#ff0044" text-anchor="middle" stroke="#ffffff" stroke-width="3" paint-order="stroke fill">+10</text>
          <text x="0" y="24" font-family="'Outfit', sans-serif" font-weight="900" font-size="11" fill="#ffd000" text-anchor="middle" letter-spacing="1">NO MERCY</text>
        </g>
        <text x="14" y="26" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="16" fill="#ff0044" stroke="#ffffff" stroke-width="1.5" paint-order="stroke fill">+10</text>
        <g transform="translate(106, 154) rotate(180)">
          <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="16" fill="#ff0044" stroke="#ffffff" stroke-width="1.5" paint-order="stroke fill">+10</text>
        </g>
      </svg>
    `;
  }

  // 2. WILD DRAW 6
  if (card.type === 'wild_draw6') {
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="114" height="174" rx="14" fill="#10121d" stroke="#ff5500" stroke-width="4"/>
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
        <!-- 4-Quadrant Wild Pinwheel in Center -->
        <g transform="translate(60, 90) rotate(-28)">
          <path d="M0 0 L-26 -40 A 28 44 0 0 1 26 -40 Z" fill="#ff1e38"/>
          <path d="M0 0 L26 -40 A 28 44 0 0 1 26 40 Z" fill="#0084ff"/>
          <path d="M0 0 L26 40 A 28 44 0 0 1 -26 40 Z" fill="#ffd000"/>
          <path d="M0 0 L-26 40 A 28 44 0 0 1 -26 -40 Z" fill="#00d659"/>
        </g>
        <g transform="translate(60, 96)">
          <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-size="36" fill="#ff5500" text-anchor="middle" stroke="#ffffff" stroke-width="5" paint-order="stroke fill">+6</text>
        </g>
        <text x="16" y="26" font-family="'Outfit', sans-serif" font-weight="900" font-size="16" fill="#ff5500" stroke="#fff" stroke-width="2" paint-order="stroke fill">+6</text>
        <text x="104" y="164" font-family="'Outfit', sans-serif" font-weight="900" font-size="16" fill="#ff5500" text-anchor="end" stroke="#fff" stroke-width="2" paint-order="stroke fill">+6</text>
      </svg>
    `;
  }

  // 3. DISCARD ALL (Colored Card)
  if (card.type === 'discard_all') {
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="116" height="176" rx="14" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
        <rect x="6" y="6" width="108" height="168" rx="10" fill="${hex}"/>
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
        <!-- Triple Discard Cascading Cards -->
        <g transform="translate(60, 85)">
          <rect x="-24" y="-18" width="18" height="28" rx="3" fill="${hex}" stroke="#fff" stroke-width="2" transform="rotate(-20 -24 -18)"/>
          <rect x="-9" y="-22" width="18" height="28" rx="3" fill="${hex}" stroke="#fff" stroke-width="2"/>
          <rect x="6" y="-18" width="18" height="28" rx="3" fill="${hex}" stroke="#fff" stroke-width="2" transform="rotate(20 6 -18)"/>
          <text x="0" y="28" font-family="'Outfit', sans-serif" font-weight="900" font-size="12" fill="${hex}" text-anchor="middle" letter-spacing="0.5">DISCARD</text>
          <text x="0" y="40" font-family="'Outfit', sans-serif" font-weight="900" font-size="13" fill="${hex}" text-anchor="middle" letter-spacing="1">ALL</text>
        </g>
        <text x="14" y="26" font-family="'Outfit', sans-serif" font-weight="900" font-size="14" fill="#ffffff" stroke="#000" stroke-width="1.5" paint-order="stroke fill">ALL</text>
        <g transform="translate(106, 154) rotate(180)">
          <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-size="14" fill="#ffffff" stroke="#000" stroke-width="1.5" paint-order="stroke fill">ALL</text>
        </g>
      </svg>
    `;
  }

  // 4. SKIP EVERYONE (SKIP ALL)
  if (card.type === 'skip_everyone') {
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="116" height="176" rx="14" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
        <rect x="6" y="6" width="108" height="168" rx="10" fill="${hex}"/>
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
        <!-- Triple Slashed Avatars -->
        <g transform="translate(60, 85)">
          <circle cx="0" cy="0" r="24" fill="none" stroke="${hex}" stroke-width="6"/>
          <line x1="-17" y1="-17" x2="17" y2="17" stroke="${hex}" stroke-width="6"/>
          <text x="0" y="32" font-family="'Outfit', sans-serif" font-weight="900" font-size="12" fill="${hex}" text-anchor="middle" letter-spacing="1">SKIP ALL</text>
        </g>
        <text x="14" y="26" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#ffffff" stroke="#000" stroke-width="1.5" paint-order="stroke fill">⊘⊘</text>
        <g transform="translate(106, 154) rotate(180)">
          <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#ffffff" stroke="#000" stroke-width="1.5" paint-order="stroke fill">⊘⊘</text>
        </g>
      </svg>
    `;
  }

  // 5. WILD COLOR ROULETTE
  if (card.type === 'wild_roulette') {
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="114" height="174" rx="14" fill="#0d111e" stroke="#00f0ff" stroke-width="4"/>
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
        <!-- Color Roulette Wheel -->
        <g transform="translate(60, 88) rotate(-28)">
          <circle cx="0" cy="0" r="28" fill="#181b2a" stroke="#fff" stroke-width="2"/>
          <path d="M0 0 L0 -28 A 28 28 0 0 1 28 0 Z" fill="#ff1e38"/>
          <path d="M0 0 L28 0 A 28 28 0 0 1 0 28 Z" fill="#0084ff"/>
          <path d="M0 0 L0 28 A 28 28 0 0 1 -28 0 Z" fill="#ffd000"/>
          <path d="M0 0 L-28 0 A 28 28 0 0 1 0 -28 Z" fill="#00d659"/>
          <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#000" stroke-width="2"/>
        </g>
        <text x="60" y="132" font-family="'Outfit', sans-serif" font-weight="900" font-size="10" fill="#00f0ff" text-anchor="middle" letter-spacing="1">ROULETTE</text>
        <text x="16" y="24" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#00f0ff">🎯</text>
        <text x="104" y="166" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#00f0ff" text-anchor="end">🎯</text>
      </svg>
    `;
  }

  // 6. SHIELD (CHAOS)
  if (card.type === 'shield') {
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="114" height="174" rx="14" fill="#0b1021" stroke="#00f0ff" stroke-width="4"/>
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
        <g transform="translate(60, 90) scale(1.1)">
          <path d="M0 -30 L22 -18 L22 10 Q22 26 0 34 Q-22 26 -22 10 L-22 -18 Z" fill="#0b1021" stroke="#00f0ff" stroke-width="3"/>
          <path d="M0 -22 L15 -13 L15 8 Q15 20 0 26 Q-15 20 -15 8 L-15 -13 Z" fill="#00f0ff" opacity="0.6"/>
          <circle cx="0" cy="4" r="6" fill="#ffffff"/>
        </g>
        <text x="16" y="24" font-family="'Outfit', sans-serif" font-weight="900" font-size="14" fill="#00f0ff">🛡️</text>
        <text x="104" y="166" font-family="'Outfit', sans-serif" font-weight="900" font-size="14" fill="#00f0ff" text-anchor="end">🛡️</text>
      </svg>
    `;
  }

  // 7. MYSTERY (CHAOS)
  if (card.type === 'mystery') {
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="114" height="174" rx="14" fill="#0a0a14" stroke="#ff0077" stroke-width="4"/>
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
        <g transform="translate(60, 90)">
          <path d="M-15 -25 L15 -25 L22 0 L-22 0 Z" fill="#ff0077"/>
          <path d="M-22 4 L22 4 L15 25 L-15 25 Z" fill="#00f0ff"/>
          <text x="0" y="8" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">✦</text>
        </g>
        <text x="16" y="24" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#ff0077">✦</text>
        <text x="104" y="166" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#00f0ff" text-anchor="end">✦</text>
      </svg>
    `;
  }

  // 8. STANDARD WILDS
  if (card.type === 'wild' || card.type === 'wild_draw4') {
    const isDraw4 = card.type === 'wild_draw4';
    return `
      <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="114" height="174" rx="14" fill="#11131f" stroke="#ffffff" stroke-width="4"/>
        <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
        <g transform="translate(60, 90) rotate(-28)">
          <path d="M0 0 L-26 -40 A 28 44 0 0 1 26 -40 Z" fill="#ff1e38"/>
          <path d="M0 0 L26 -40 A 28 44 0 0 1 26 40 Z" fill="#0084ff"/>
          <path d="M0 0 L26 40 A 28 44 0 0 1 -26 40 Z" fill="#ffd000"/>
          <path d="M0 0 L-26 40 A 28 44 0 0 1 -26 -40 Z" fill="#00d659"/>
        </g>
        ${isDraw4 ? `
          <g transform="translate(60, 96)">
            <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" stroke="#000000" stroke-width="6" paint-order="stroke fill">+4</text>
          </g>
          <text x="16" y="26" font-family="'Outfit', sans-serif" font-weight="900" font-size="16" fill="#ffffff" stroke="#000" stroke-width="2" paint-order="stroke fill">+4</text>
          <text x="104" y="164" font-family="'Outfit', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="end" stroke="#000" stroke-width="2" paint-order="stroke fill">+4</text>
        ` : `
          <text x="16" y="24" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#ffffff">★</text>
          <text x="104" y="166" font-family="'Outfit', sans-serif" font-weight="900" font-size="15" fill="#ffffff" text-anchor="end">★</text>
        `}
      </svg>
    `;
  }

  // 9. STANDARD NUMBERS & ACTIONS
  let centerContent = '';
  let cornerSymbol = '';

  if (card.type === 'number') {
    cornerSymbol = `${card.value}`;
    centerContent = `
      <text x="0" y="20" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="64" fill="${hex}" text-anchor="middle" stroke="#ffffff" stroke-width="3" paint-order="stroke fill">${card.value}</text>
    `;
  } else if (card.type === 'skip') {
    cornerSymbol = '⊘';
    centerContent = `
      <circle cx="0" cy="0" r="26" fill="none" stroke="${hex}" stroke-width="8"/>
      <line x1="-18" y1="-18" x2="18" y2="18" stroke="${hex}" stroke-width="8"/>
    `;
  } else if (card.type === 'reverse') {
    cornerSymbol = '⇄';
    centerContent = `
      <g transform="translate(0, -10)">
        <path d="M-18 0 Q-18 -16 10 -16 L8 -22 L20 -14 L8 -6 L10 -12 Q-10 -12 -10 0 Z" fill="${hex}"/>
      </g>
      <g transform="translate(0, 10) rotate(180)">
        <path d="M-18 0 Q-18 -16 10 -16 L8 -22 L20 -14 L8 -6 L10 -12 Q-10 -12 -10 0 Z" fill="${hex}"/>
      </g>
    `;
  } else if (card.type === 'draw2') {
    cornerSymbol = '+2';
    centerContent = `
      <rect x="-18" y="-22" width="22" height="34" rx="4" fill="${hex}" stroke="#ffffff" stroke-width="2" transform="rotate(-10 -18 -22)"/>
      <rect x="-4" y="-18" width="22" height="34" rx="4" fill="${hex}" stroke="#ffffff" stroke-width="2" transform="rotate(10 -4 -18)"/>
      <text x="0" y="28" font-family="'Outfit', sans-serif" font-weight="900" font-size="28" fill="${hex}" text-anchor="middle" stroke="#ffffff" stroke-width="2" paint-order="stroke fill">+2</text>
    `;
  }

  return `
    <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="116" height="176" rx="14" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
      <rect x="6" y="6" width="108" height="168" rx="10" fill="${hex}"/>
      <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ffffff" transform="rotate(-28 60 90)"/>
      <g transform="translate(60, 90)">
        ${centerContent}
      </g>
      <text x="14" y="26" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="18" fill="#ffffff" stroke="#000000" stroke-width="1.5" paint-order="stroke fill">${cornerSymbol}</text>
      <g transform="translate(106, 154) rotate(180)">
        <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="18" fill="#ffffff" stroke="#000000" stroke-width="1.5" paint-order="stroke fill">${cornerSymbol}</text>
      </g>
    </svg>
  `;
}

function getCardBackSVG() {
  return `
    <svg viewBox="0 0 120 180" class="card-svg" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="116" height="176" rx="14" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
      <rect x="6" y="6" width="108" height="168" rx="10" fill="#0f1424"/>
      <ellipse cx="60" cy="90" rx="38" ry="58" fill="#ff1e38" transform="rotate(-28 60 90)"/>
      <ellipse cx="60" cy="90" rx="36" ry="56" fill="none" stroke="#ffd000" stroke-width="2" transform="rotate(-28 60 90)"/>
      <g transform="translate(60, 96) rotate(-28)">
        <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="34" fill="#ffd000" text-anchor="middle" stroke="#000000" stroke-width="5" paint-order="stroke fill">UNO</text>
        <text x="0" y="0" font-family="'Outfit', sans-serif" font-weight="900" font-style="italic" font-size="34" fill="#ffffff" text-anchor="middle">UNO</text>
      </g>
    </svg>
  `;
}

/**
 * Deck Generator Supporting Classic, Chaos, and UNO No Mercy (Show 'Em No Mercy)
 */
function createDeck(houseRules = {}, gameMode = 'mercy') {
  const deck = [];
  const isNoMercy = gameMode === 'mercy' || houseRules.noMercy;

  CARD_COLORS.forEach(color => {
    // 0
    deck.push(new Card(color, 'number', 0));

    // Numbers 1-9
    for (let n = 1; n <= 9; n++) {
      deck.push(new Card(color, 'number', n));
      deck.push(new Card(color, 'number', n));
    }

    // Classic Actions
    ['skip', 'reverse', 'draw2'].forEach(action => {
      deck.push(new Card(color, action));
      deck.push(new Card(color, action));
    });

    // NO MERCY: Discard All (2 per color) & Skip Everyone (1 per color)
    if (isNoMercy) {
      deck.push(new Card(color, 'discard_all'));
      deck.push(new Card(color, 'discard_all'));
      deck.push(new Card(color, 'skip_everyone'));
    }

    // Chaos: Colored Shield Cards
    if (houseRules.shieldCard && !isNoMercy) {
      deck.push(new Card(color, 'shield'));
    }
  });

  // Standard Wilds
  for (let i = 0; i < 4; i++) {
    deck.push(new Card('wild', 'wild'));
    deck.push(new Card('wild', 'wild_draw4'));
  }

  // NO MERCY WILDS: Wild Draw 6, Wild Draw 10, Wild Color Roulette
  if (isNoMercy) {
    for (let i = 0; i < 4; i++) {
      deck.push(new Card('wild', 'wild_draw6'));
      deck.push(new Card('wild', 'wild_draw10'));
      deck.push(new Card('wild', 'wild_roulette'));
    }
  }

  // Chaos: Mystery Glitch Cards
  if (houseRules.mysteryCard && !isNoMercy) {
    for (let i = 0; i < 4; i++) {
      deck.push(new Card('wild', 'mystery'));
    }
  }

  return shuffleDeck(deck);
}

function shuffleDeck(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isCardPlayable(card, topCard, activeColor, stackCount = 0, houseRules = {}) {
  if (!topCard) return true;

  // Stacking Rule In Effect:
  if (stackCount > 0 && houseRules.stacking) {
    if (card.type === 'shield') return true;
    if (card.type === 'wild_draw10') return true;
    if (card.type === 'wild_draw6') return true;
    if (card.type === 'wild_draw4') return true;
    if (card.type === 'draw2') return true;
    return false;
  }

  if (card.type === 'shield') {
    return card.color === activeColor || card.color === 'wild';
  }

  if (card.type === 'mystery' || card.type === 'wild_draw6' || card.type === 'wild_draw10' || card.type === 'wild_roulette') {
    return true;
  }

  if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild_draw4') {
    return true;
  }

  if (card.color === activeColor) {
    return true;
  }

  if (card.type === topCard.type) {
    if (card.type === 'number') {
      return card.value === topCard.value;
    }
    return true;
  }

  return false;
}

function isExactJumpInMatch(card, topCard) {
  if (!card || !topCard) return false;
  if (card.color === 'wild' || topCard.color === 'wild') return false;
  if (card.color !== topCard.color) return false;
  if (card.type !== topCard.type) return false;
  if (card.type === 'number') return card.value === topCard.value;
  return true;
}

function createCardElement(card, isPlayable = false, onPlay = null) {
  const el = document.createElement('div');
  el.className = `uno-card color-${card.color} ${isPlayable ? 'playable' : ''}`;
  if (card.type === 'shield') el.classList.add('card-shield');
  if (card.type === 'mystery') el.classList.add('card-mystery');
  if (card.type === 'wild_draw10') el.classList.add('card-draw10');
  if (card.type === 'wild_draw6') el.classList.add('card-draw6');
  el.setAttribute('data-id', card.id);

  el.innerHTML = getCardSVG(card);

  if (isPlayable && onPlay) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onPlay(card);
    });
  }

  return el;
}
