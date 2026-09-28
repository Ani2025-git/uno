/**
 * Web Audio API Cyber Synth Engine with UNO No Mercy Sound FX
 */
class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.8;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, type = 'sine', duration = 0.15, gainVal = 0.2, delay = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainVal * this.volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  playCard() {
    this.tone(480, 'triangle', 0.08, 0.25);
    this.tone(240, 'sine', 0.1, 0.3, 0.02);
  }

  playDraw() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playSkip() {
    this.tone(350, 'sawtooth', 0.12, 0.2);
    this.tone(350, 'sawtooth', 0.12, 0.2, 0.1);
  }

  playSkipEveryone() {
    this.tone(300, 'sawtooth', 0.08, 0.25);
    this.tone(400, 'sawtooth', 0.08, 0.25, 0.08);
    this.tone(500, 'sawtooth', 0.08, 0.25, 0.16);
    this.tone(600, 'square', 0.2, 0.3, 0.24);
  }

  playReverse() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(650, now + 0.15);
    osc.frequency.linearRampToValueAtTime(200, now + 0.3);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.33);
  }

  playDrawTwo() {
    this.tone(550, 'square', 0.12, 0.2);
    this.tone(440, 'square', 0.18, 0.25, 0.1);
  }

  playDrawFour() {
    this.tone(300, 'sawtooth', 0.1, 0.2);
    this.tone(450, 'sawtooth', 0.1, 0.2, 0.08);
    this.tone(600, 'sawtooth', 0.1, 0.2, 0.16);
    this.tone(800, 'sawtooth', 0.2, 0.25, 0.24);
  }

  // No Mercy: +6 Penalty Sound
  playDrawSix() {
    [250, 350, 500, 650, 800, 950].forEach((freq, idx) => {
      this.tone(freq, 'sawtooth', 0.12, 0.2, idx * 0.05);
    });
  }

  // No Mercy: +10 Nuke Sound
  playDrawTen() {
    [150, 200, 300, 450, 600, 750, 900, 1100].forEach((freq, idx) => {
      this.tone(freq, 'square', 0.15, 0.25, idx * 0.05);
    });
    // Sub-bass rumble
    this.tone(60, 'sine', 0.7, 0.4, 0.2);
  }

  // No Mercy: Discard All Sound
  playDiscardAll() {
    [400, 450, 500, 550, 600, 700].forEach((f, i) => {
      this.tone(f, 'triangle', 0.06, 0.2, i * 0.04);
    });
  }

  // No Mercy: 25-Card Knockout Elimination Gong
  playKnockout() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.tone(120, 'sawtooth', 0.6, 0.45);
    this.tone(90, 'square', 0.8, 0.4, 0.1);
    this.tone(60, 'sawtooth', 1.0, 0.5, 0.2);
  }

  playShield() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this.tone(freq, 'sine', 0.45, 0.15, i * 0.03);
    });
  }

  playMystery() {
    const notes = [220, 440, 330, 660, 550, 880, 770, 1100];
    notes.forEach((freq, i) => {
      this.tone(freq, i % 2 === 0 ? 'square' : 'sawtooth', 0.06, 0.15, i * 0.05);
    });
  }

  playJumpIn() {
    this.tone(880, 'sine', 0.08, 0.3);
    this.tone(1320, 'square', 0.12, 0.3, 0.04);
  }

  playUnoShout() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      this.tone(freq, 'triangle', 0.35, 0.25, idx * 0.08);
    });
  }

  playCatch() {
    this.tone(700, 'sawtooth', 0.15, 0.25);
    this.tone(400, 'sawtooth', 0.25, 0.3, 0.12);
  }

  playVictory() {
    const melody = [
      { f: 523.25, d: 0.15, delay: 0 },
      { f: 659.25, d: 0.15, delay: 0.15 },
      { f: 783.99, d: 0.15, delay: 0.3 },
      { f: 1046.5, d: 0.45, delay: 0.45 },
      { f: 783.99, d: 0.15, delay: 0.75 },
      { f: 1046.5, d: 0.65, delay: 0.95 }
    ];
    melody.forEach(m => this.tone(m.f, 'triangle', m.d, 0.25, m.delay));
  }

  playDefeat() {
    const notes = [400, 350, 300, 240];
    notes.forEach((f, i) => {
      this.tone(f, 'sawtooth', 0.3, 0.2, i * 0.18);
    });
  }

  playClick() {
    this.tone(800, 'sine', 0.04, 0.1);
  }

  playEmote(id) {
    switch (id) {
      case 'fire':
        this.tone(600, 'sawtooth', 0.15, 0.2);
        this.tone(800, 'square', 0.2, 0.2, 0.08);
        break;
      case 'skull':
        this.tone(180, 'sawtooth', 0.3, 0.3);
        break;
      case 'laugh':
        [600, 750, 600, 750, 600].forEach((f, i) => this.tone(f, 'sine', 0.08, 0.15, i * 0.07));
        break;
      case 'shock':
        this.tone(900, 'triangle', 0.15, 0.3);
        this.tone(450, 'sine', 0.25, 0.2, 0.1);
        break;
      default:
        this.tone(550, 'sine', 0.1, 0.15);
    }
  }
}

const Sound = new CyberAudioEngine();
if (typeof window !== 'undefined') window.Sound = Sound;
if (typeof global !== 'undefined') global.Sound = Sound;
