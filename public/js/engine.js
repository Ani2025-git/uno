/**
 * Authoritative Client/Local UNO Game Engine
 * Featuring full UNO No Mercy (Show 'Em No Mercy), Stacking, and 25-Card Elimination
 */
class UnoGameEngine {
  constructor() {
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.topCard = null;
    this.activeColor = 'red';
    this.currentTurnIndex = 0;
    this.direction = 1; // 1 = Clockwise, -1 = Counter-Clockwise
    this.stackCount = 0;
    this.isGameOver = false;
    this.winner = null;
    this.gameMode = 'mercy'; // 'mercy', 'chaos', 'classic'

    this.houseRules = {
      jumpIn: true,
      stacking: true,
      sevenZero: true,
      shieldCard: false,
      mysteryCard: false,
      mercyRule: true // 25 card elimination
    };

    this.turnTimeLimit = 25;
    this.timeRemaining = 25;
    this.timerInterval = null;
    this.onStateChange = null;
    this.onNotification = null;
    this.onMysteryEvent = null;
    this.onPlayerEliminated = null;
  }

  init(players, rules = {}, gameMode = 'mercy') {
    this.gameMode = gameMode;
    this.players = players.map(p => {
      let playerInstance = p;
      if (p.isBot) {
        if (!(p instanceof BotPlayer) || typeof p.chooseMove !== 'function') {
          playerInstance = new BotPlayer(p.id, p.name, p.personality || 'aggressive', p.avatar || '🤖');
        }
      }
      playerInstance.isEliminated = false;
      return playerInstance;
    });

    this.houseRules = {
      ...this.houseRules,
      ...rules,
      mercyRule: gameMode === 'mercy' ? true : !!rules.mercyRule
    };

    this.deck = createDeck(this.houseRules, this.gameMode);
    this.discardPile = [];
    this.direction = 1;
    this.stackCount = 0;
    this.isGameOver = false;
    this.winner = null;
    this.currentTurnIndex = 0;

    // Deal 7 cards to each player
    this.players.forEach(p => {
      p.hand = [];
      p.hasCalledUno = false;
      for (let i = 0; i < 7; i++) {
        p.hand.push(this.deck.pop());
      }
    });

    // Flip first card (must not be wild or action)
    let initialCard = this.deck.pop();
    while (initialCard.color === 'wild' || initialCard.type === 'shield' || initialCard.type === 'mystery' || initialCard.type.startsWith('wild_') || initialCard.type === 'discard_all' || initialCard.type === 'skip_everyone') {
      this.deck.unshift(initialCard);
      initialCard = this.deck.pop();
    }

    this.discardPile.push(initialCard);
    this.topCard = initialCard;
    this.activeColor = initialCard.color;

    this.startTurnTimer();
    this.notifyState();
    this.checkAITurn();
  }

  getActivePlayers() {
    return this.players.filter(p => !p.isEliminated);
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  startTurnTimer() {
    clearInterval(this.timerInterval);
    this.timeRemaining = this.turnTimeLimit;

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.onTimerTick) {
        this.onTimerTick(this.timeRemaining, this.turnTimeLimit);
      }

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.handleTurnTimeout();
      }
    }, 1000);
  }

  handleTurnTimeout() {
    const current = this.getCurrentPlayer();
    if (!current || current.isEliminated) return;
    if (this.onNotification) {
      this.onNotification(`${current.name}'s turn timed out! Auto-drawing card.`, 'warning');
    }
    this.drawCard(current.id, true);
  }

  /**
   * Play Card Action
   */
  playCard(playerId, cardId, chosenColor = null, swapTargetId = null) {
    if (this.isGameOver) return { success: false, error: 'Game is over' };

    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { success: false, error: 'Player not found' };

    if (playerIndex !== this.currentTurnIndex) {
      return { success: false, error: 'Not your turn' };
    }

    const player = this.players[playerIndex];
    if (player.isEliminated) return { success: false, error: 'Player eliminated' };

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIndex];

    if (!isCardPlayable(card, this.topCard, this.activeColor, this.stackCount, this.houseRules)) {
      return { success: false, error: 'Illegal card play' };
    }

    // Play card
    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.topCard = card;

    if (player.hand.length !== 1) {
      player.hasCalledUno = false;
    }

    // Check Win Condition
    if (player.hand.length === 0) {
      this.handleWin(player);
      return { success: true };
    }

    // Process Card Effects
    this.processCardEffect(card, player, chosenColor, swapTargetId);

    return { success: true };
  }

  /**
   * Process Card Actions (No Mercy + Classic + Chaos)
   */
  processCardEffect(card, player, chosenColor, swapTargetId) {
    if (card.color === 'wild' || card.type.startsWith('wild') || card.type === 'mystery') {
      this.activeColor = chosenColor || 'red';
    } else {
      this.activeColor = card.color;
    }

    let skipNext = false;
    let repeatTurn = false;

    // Normal Number and Wild Notifications
    if (card.type === 'number') {
      if (this.onNotification) {
        const colorEmoji = { red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡' }[card.color] || '🃏';
        this.onNotification(`${colorEmoji} ${player.name} played ${card.color.toUpperCase()} ${card.value}`);
      }
    } else if (card.type === 'wild') {
      if (this.onNotification) {
        this.onNotification(`🌈 ${player.name} played WILD! Color is ${(this.activeColor).toUpperCase()}`);
      }
    }

    // 1. NO MERCY: DISCARD ALL
    if (card.type === 'discard_all') {
      const matchColor = card.color;
      const discarded = [];
      for (let i = player.hand.length - 1; i >= 0; i--) {
        if (player.hand[i].color === matchColor) {
          discarded.push(player.hand.splice(i, 1)[0]);
        }
      }
      this.discardPile.push(...discarded);
      Sound.playDiscardAll();
      if (this.onNotification) {
        this.onNotification(`💥 DISCARD ALL! ${player.name} dumped ${discarded.length + 1} ${matchColor.toUpperCase()} cards!`, 'swap');
      }

      if (player.hand.length === 0) {
        this.handleWin(player);
        return;
      }
    }
    // 2. NO MERCY: SKIP EVERYONE (SKIP ALL)
    else if (card.type === 'skip_everyone') {
      repeatTurn = true;
      Sound.playSkipEveryone();
      if (this.onNotification) {
        this.onNotification(`⚡ SKIP EVERYONE! ${player.name} takes another turn immediately!`, 'jump');
      }
    }
    // 3. NO MERCY: WILD DRAW 10 (NUKE)
    else if (card.type === 'wild_draw10') {
      this.stackCount += 10;
      Sound.playDrawTen();
      if (this.onNotification) {
        this.onNotification(`💣 +10 NUKE PLAYED! Total stack: +${this.stackCount}`, 'glitch');
      }
    }
    // 4. NO MERCY: WILD DRAW 6
    else if (card.type === 'wild_draw6') {
      this.stackCount += 6;
      Sound.playDrawSix();
      if (this.onNotification) {
        this.onNotification(`🔥 +6 DRAW STACKED! Total stack: +${this.stackCount}`, 'glitch');
      }
    }
    // 5. NO MERCY: WILD COLOR ROULETTE
    else if (card.type === 'wild_roulette') {
      Sound.playMystery();
      if (this.onNotification) {
        this.onNotification(`🎯 COLOR ROULETTE: Next player must draw until ${this.activeColor.toUpperCase()} is pulled!`, 'glitch');
      }
      this.advanceTurn(false, true); // Trigger roulette on next player
      return;
    }
    // 6. SHIELD DEFLECT
    else if (card.type === 'shield') {
      if (this.stackCount > 0) {
        Sound.playShield();
        if (this.onNotification) {
          this.onNotification(`🛡️ ${player.name} DEFLECTED the +${this.stackCount} penalty!`, 'shield');
        }
        this.stackCount = 0;
      } else {
        Sound.playShield();
      }
    }
    // 7. REVERSE
    else if (card.type === 'reverse') {
      this.direction *= -1;
      Sound.playReverse();
      if (this.onNotification) {
        this.onNotification(`⇄ Direction reversed to ${this.direction === 1 ? 'Clockwise' : 'Counter-Clockwise'}!`);
      }
      if (this.getActivePlayers().length === 2) {
        skipNext = true;
      }
    }
    // 8. SKIP
    else if (card.type === 'skip') {
      skipNext = true;
      Sound.playSkip();
      if (this.onNotification) {
        this.onNotification(`⊘ Next player skipped!`);
      }
    }
    // 9. DRAW TWO (+2)
    else if (card.type === 'draw2') {
      if (this.houseRules.stacking) {
        this.stackCount += 2;
        Sound.playDrawTwo();
        if (this.onNotification) {
          this.onNotification(`⚡ +2 STACKED! Total penalty: +${this.stackCount}`);
        }
      } else {
        Sound.playDrawTwo();
        this.applyPenaltyToNextPlayer(2);
        skipNext = true;
      }
    }
    // 10. WILD DRAW FOUR (+4)
    else if (card.type === 'wild_draw4') {
      if (this.houseRules.stacking) {
        this.stackCount += 4;
        Sound.playDrawFour();
        if (this.onNotification) {
          this.onNotification(`💥 +4 STACKED! Total penalty: +${this.stackCount}`);
        }
      } else {
        Sound.playDrawFour();
        this.applyPenaltyToNextPlayer(4);
        skipNext = true;
      }
    }
    // 11. 7 & 0 HAND SWAPS
    else if (this.houseRules.sevenZero && card.type === 'number') {
      if (card.value === 7) {
        this.executeSevenSwap(player, swapTargetId);
      } else if (card.value === 0) {
        this.executeZeroRotation();
      }
    }
    // 12. MYSTERY GLITCH
    else if (card.type === 'mystery') {
      this.triggerMysteryGlitch(player);
    }

    if (repeatTurn) {
      this.startTurnTimer();
      this.notifyState();
      this.checkAITurn();
    } else {
      this.advanceTurn(skipNext);
    }
  }

  executeSevenSwap(player, targetId) {
    if (!targetId) {
      const opponents = this.getActivePlayers().filter(p => p.id !== player.id);
      targetId = opponents[0]?.id;
    }
    const target = this.players.find(p => p.id === targetId);
    if (target) {
      const tempHand = player.hand;
      player.hand = target.hand;
      target.hand = tempHand;
      if (this.onNotification) {
        this.onNotification(`🔄 HAND SWAP: ${player.name} swapped hands with ${target.name}!`, 'swap');
      }
      this.checkMercyElimination(player);
      this.checkMercyElimination(target);
    }
  }

  executeZeroRotation() {
    const active = this.getActivePlayers();
    const hands = active.map(p => p.hand);
    const n = active.length;
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + this.direction + n) % n;
      active[nextIdx].hand = hands[i];
    }
    if (this.onNotification) {
      this.onNotification(`🌪️ CYBER CYCLONE: All hands rotated ${this.direction === 1 ? 'forward' : 'backward'}!`, 'swap');
    }
    active.forEach(p => this.checkMercyElimination(p));
  }

  /**
   * 25-Card Mercy Rule Check
   * Instant Knockout Elimination if holding 25+ cards
   */
  checkMercyElimination(player) {
    if ((this.gameMode === 'mercy' || this.houseRules.mercyRule) && player.hand.length >= 25 && !player.isEliminated) {
      player.isEliminated = true;
      Sound.playKnockout();

      // Discard their cards
      this.discardPile.push(...player.hand);
      player.hand = [];

      if (this.onPlayerEliminated) {
        this.onPlayerEliminated(player);
      }
      if (this.onNotification) {
        this.onNotification(`💀 MERCY RULE ELIMINATION: ${player.name} held 25+ cards and was KNOCKED OUT!`, 'warning');
      }

      // Check if only 1 player remains
      const remaining = this.getActivePlayers();
      if (remaining.length === 1) {
        this.handleWin(remaining[0]);
        return true;
      }
      return true;
    }
    return false;
  }

  drawCard(playerId, forced = false) {
    if (this.isGameOver) return;
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex !== this.currentTurnIndex) return;

    const player = this.players[playerIndex];
    if (player.isEliminated) return;

    // Absorb Stacking Penalty
    if (this.stackCount > 0) {
      const penalty = this.stackCount;
      this.stackCount = 0;
      for (let i = 0; i < penalty; i++) {
        if (this.deck.length === 0) this.recycleDeck();
        if (this.deck.length > 0) player.hand.push(this.deck.pop());
      }
      Sound.playDrawTwo();
      if (this.onNotification) {
        this.onNotification(`💥 ${player.name} absorbed +${penalty} penalty cards!`);
      }

      // Check 25-Card Elimination
      if (this.checkMercyElimination(player)) {
        this.advanceTurn(false);
        return;
      }

      this.advanceTurn(false);
      return;
    }

    // Normal Draw
    if (this.deck.length === 0) this.recycleDeck();
    if (this.deck.length > 0) {
      const drawn = this.deck.pop();
      player.hand.push(drawn);
      Sound.playDraw();
      if (this.onNotification) {
        this.onNotification(`📥 ${player.name} drew a card`);
      }

      if (this.checkMercyElimination(player)) {
        this.advanceTurn(false);
        return;
      }

      if (isCardPlayable(drawn, this.topCard, this.activeColor, this.stackCount, this.houseRules)) {
        if (player.isBot) {
          setTimeout(() => {
            const wildColor = drawn.color === 'wild' ? player.chooseWildColor(this) : null;
            const swapTarget = (drawn.value === 7) ? player.chooseSwapTarget(this.players) : null;
            this.playCard(player.id, drawn.id, wildColor, swapTarget);
          }, 600);
          return;
        }
      } else {
        this.advanceTurn(false);
        return;
      }
    }

    this.advanceTurn(false);
  }

  jumpIn(playerId, cardId) {
    if (!this.houseRules.jumpIn || this.isGameOver) return false;

    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isEliminated) return false;

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];

    if (!isExactJumpInMatch(card, this.topCard)) {
      return false;
    }

    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    this.topCard = card;
    this.activeColor = card.color;

    Sound.playJumpIn();
    if (this.onNotification) {
      this.onNotification(`⚡ JUMP-IN! ${player.name} leaped into the turn!`, 'jump');
    }

    this.currentTurnIndex = this.players.findIndex(p => p.id === playerId);

    if (player.hand.length === 0) {
      this.handleWin(player);
      return true;
    }

    this.advanceTurn(false);
    return true;
  }

  advanceTurn(skip = false, isRoulette = false) {
    const active = this.getActivePlayers();
    if (active.length <= 1) {
      if (active.length === 1) this.handleWin(active[0]);
      return;
    }

    const n = this.players.length;
    let step = this.direction * (skip ? 2 : 1);
    let nextIdx = (this.currentTurnIndex + step + n * 10) % n;

    // Skip eliminated players
    while (this.players[nextIdx].isEliminated) {
      nextIdx = (nextIdx + this.direction + n * 10) % n;
    }

    this.currentTurnIndex = nextIdx;

    // Handle Color Roulette Execution on target player
    if (isRoulette) {
      const target = this.getCurrentPlayer();
      let drawnCount = 0;
      let pulled = null;
      while (drawnCount < 15) {
        if (this.deck.length === 0) this.recycleDeck();
        if (this.deck.length === 0) break;
        pulled = this.deck.pop();
        target.hand.push(pulled);
        drawnCount++;
        if (pulled.color === this.activeColor) break;
      }
      if (this.onNotification) {
        this.onNotification(`🎯 Roulette Result: ${target.name} drew ${drawnCount} cards until pulling ${this.activeColor.toUpperCase()}!`);
      }
      this.checkMercyElimination(target);
    }

    this.startTurnTimer();
    this.notifyState();
    this.checkAITurn();
  }

  checkAITurn() {
    if (this.isGameOver) return;
    const current = this.getCurrentPlayer();
    if (!current || !current.isBot || current.isEliminated) return;

    if (typeof current.chooseMove !== 'function' && typeof BotPlayer !== 'undefined') {
      Object.setPrototypeOf(current, BotPlayer.prototype);
    }

    const delay = Math.floor(Math.random() * 800) + 700;
    setTimeout(() => {
      if (this.getCurrentPlayer()?.id !== current.id || this.isGameOver) return;

      if (current.hand && current.hand.length === 2 && Math.random() > 0.1) {
        current.hasCalledUno = true;
        Sound.playUnoShout();
        if (this.onNotification) {
          this.onNotification(`📢 ${current.name} shouted UNO!`);
        }
      }

      let move = null;
      if (typeof current.chooseMove === 'function') {
        move = current.chooseMove(this);
      } else if (typeof BotPlayer !== 'undefined' && BotPlayer.prototype.chooseMove) {
        move = BotPlayer.prototype.chooseMove.call(current, this);
      }

      if (move) {
        let wildColor = null;
        if (move.color === 'wild' || move.type.startsWith('wild') || move.type === 'mystery') {
          if (typeof current.chooseWildColor === 'function') {
            wildColor = current.chooseWildColor(this);
          } else if (typeof BotPlayer !== 'undefined' && BotPlayer.prototype.chooseWildColor) {
            wildColor = BotPlayer.prototype.chooseWildColor.call(current, this);
          }
        }
        let swapTarget = null;
        if (move.value === 7) {
          if (typeof current.chooseSwapTarget === 'function') {
            swapTarget = current.chooseSwapTarget(this.players);
          } else if (typeof BotPlayer !== 'undefined' && BotPlayer.prototype.chooseSwapTarget) {
            swapTarget = BotPlayer.prototype.chooseSwapTarget.call(current, this.players);
          }
        }
        this.playCard(current.id, move.id, wildColor, swapTarget);
      } else {
        this.drawCard(current.id);
      }
    }, delay);
  }

  callUno(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isEliminated) return;
    player.hasCalledUno = true;
    Sound.playUnoShout();
    if (this.onNotification) {
      this.onNotification(`📢 ${player.name} called UNO!`);
    }
  }

  catchUno(reporterId) {
    const vulnerable = this.getActivePlayers().find(p => p.hand.length === 1 && !p.hasCalledUno);
    if (vulnerable) {
      Sound.playCatch();
      for (let i = 0; i < 2; i++) {
        if (this.deck.length === 0) this.recycleDeck();
        if (this.deck.length > 0) vulnerable.hand.push(this.deck.pop());
      }
      if (this.onNotification) {
        this.onNotification(`🚨 CAUGHT! ${vulnerable.name} forgot to call UNO and drew 2 cards!`, 'warning');
      }
      this.checkMercyElimination(vulnerable);
      this.notifyState();
    } else {
      if (this.onNotification) {
        this.onNotification('No vulnerable players to catch!', 'info');
      }
    }
  }

  recycleDeck() {
    if (this.discardPile.length <= 1) return;
    const top = this.discardPile.pop();
    this.deck = shuffleDeck(this.discardPile);
    this.discardPile = [top];
  }

  handleWin(winner) {
    this.isGameOver = true;
    this.winner = winner;
    clearInterval(this.timerInterval);
    Sound.playVictory();
    if (this.onGameOver) {
      this.onGameOver(winner);
    }
    this.notifyState();
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange(this.getStateSnapshot());
    }
  }

  getStateSnapshot() {
    return {
      topCard: this.topCard,
      activeColor: this.activeColor,
      currentTurnIndex: this.currentTurnIndex,
      currentPlayer: this.getCurrentPlayer(),
      direction: this.direction,
      stackCount: this.stackCount,
      isGameOver: this.isGameOver,
      winner: this.winner,
      gameMode: this.gameMode,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot,
        personality: p.personality,
        cardCount: p.hand.length,
        isEliminated: p.isEliminated,
        hasCalledUno: p.hasCalledUno,
        hand: p.hand
      })),
      houseRules: this.houseRules
    };
  }
}

if (typeof window !== 'undefined') window.UnoGameEngine = UnoGameEngine;
if (typeof global !== 'undefined') global.UnoGameEngine = UnoGameEngine;
