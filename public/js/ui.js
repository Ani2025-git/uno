/**
 * Upgraded High-End Uno UI with Full No Mercy Support (25-Card Meter & Knockouts)
 */
class UnoUI {
  constructor() {
    this.opponentsContainer = document.getElementById('opponents-container');
    this.playerHandContainer = document.getElementById('player-hand');
    this.discardContainer = document.getElementById('discard-pile');
    this.deckContainer = document.getElementById('deck-pile');
    this.directionIndicator = document.getElementById('direction-ring');
    this.colorAura = document.getElementById('table-color-aura');
    this.stackBadge = document.getElementById('stack-badge');
    this.tableAlert = document.getElementById('table-alert');
    this.jumpInBtn = document.getElementById('jump-in-btn');
    this.mercyGauge = document.getElementById('local-mercy-gauge');

    // Modals
    this.colorModal = document.getElementById('color-picker-modal');
    this.swapModal = document.getElementById('swap-modal');
    this.winnerModal = document.getElementById('winner-modal');

    // Action buttons
    this.unoShoutBtn = document.getElementById('btn-uno-shout');
    this.unoCatchBtn = document.getElementById('btn-uno-catch');

    // Turn Banner & Messages Feed
    this.turnBanner = document.getElementById('game-turn-banner');
    this.turnBannerText = document.getElementById('turn-banner-text');
    this.messagesList = document.getElementById('messages-content-list');

    this.localPlayerId = 'player_local';
    this.pendingWildCard = null;
    this.pendingSevenCard = null;

    // Callbacks
    this.onPlayCard = null;
    this.onDrawCard = null;
    this.onJumpIn = null;
    this.onUnoShout = null;
    this.onUnoCatch = null;

    this.initEvents();
    this.initDeckGraphic();
  }

  initDeckGraphic() {
    if (this.deckContainer) {
      this.deckContainer.innerHTML = `
        <div class="deck-card-stack">
          ${getCardBackSVG()}
        </div>
      `;
    }
  }

  initEvents() {
    if (this.deckContainer) {
      this.deckContainer.addEventListener('click', () => {
        Sound.playClick();
        if (this.onDrawCard) this.onDrawCard();
      });
    }

    if (this.unoShoutBtn) {
      this.unoShoutBtn.addEventListener('click', () => {
        if (this.onUnoShout) this.onUnoShout();
      });
    }

    if (this.unoCatchBtn) {
      this.unoCatchBtn.addEventListener('click', () => {
        if (this.onUnoCatch) this.onUnoCatch();
      });
    }

    if (this.jumpInBtn) {
      this.jumpInBtn.addEventListener('click', () => {
        if (this.onJumpIn) this.onJumpIn();
      });
    }

    document.querySelectorAll('.radial-color-sector').forEach(sector => {
      sector.addEventListener('click', (e) => {
        const color = e.currentTarget.getAttribute('data-color');
        this.selectColorChoice(color);
      });
    });
  }

  renderState(state, localPlayerId) {
    this.localPlayerId = localPlayerId || this.localPlayerId;
    const localPlayer = state.players.find(p => p.id === this.localPlayerId);
    const isMyTurn = state.currentPlayer && state.currentPlayer.id === this.localPlayerId;

    // 1. Render Opponents with Mercy Rule meters
    this.renderOpponents(state.players, state.currentPlayer, state.gameMode);

    // 2. Render Table Center
    this.renderCenter(state.topCard, state.activeColor, state.direction, state.stackCount);

    // 3. Render Player Hand
    if (localPlayer) {
      if (localPlayer.isEliminated) {
        this.playerHandContainer.innerHTML = `
          <div style="font-size:24px; font-weight:900; color:#ff1e38; margin:auto 0; text-align:center;">
            💀 YOU WERE ELIMINATED BY THE MERCY RULE (25+ CARDS)!
          </div>
        `;
      } else {
        this.renderPlayerHand(localPlayer.hand, state.topCard, state.activeColor, state.stackCount, isMyTurn, state.houseRules);
      }

      // Update Local Player Mercy Gauge
      if (this.mercyGauge) {
        const count = localPlayer.hand.length;
        this.mercyGauge.textContent = state.gameMode === 'mercy' ? `MERCY GAUGE: ${count} / 25 CARDS` : `${count} CARDS`;
        if (count >= 18) {
          this.mercyGauge.style.color = '#ff1e38';
          this.mercyGauge.style.borderColor = '#ff1e38';
        } else if (count >= 12) {
          this.mercyGauge.style.color = '#ffd000';
          this.mercyGauge.style.borderColor = '#ffd000';
        } else {
          this.mercyGauge.style.color = '#00f0ff';
          this.mercyGauge.style.borderColor = 'rgba(0, 240, 255, 0.4)';
        }
      }
    }

    // 4. Update Turn Class & Banner
    const arena = document.getElementById('game-arena');
    if (arena) {
      if (isMyTurn && localPlayer && !localPlayer.isEliminated) arena.classList.add('my-turn');
      else arena.classList.remove('my-turn');
    }
    this.updateTurnBanner(isMyTurn, state.currentPlayer?.name);

    // 5. Jump-In Availability Check
    this.checkJumpInAvailability(localPlayer, state.topCard, isMyTurn, state.houseRules);

    // 6. Winner Check
    if (state.isGameOver && state.winner) {
      this.showWinnerModal(state.winner);
    }
  }

  renderOpponents(players, currentPlayer, gameMode) {
    if (!this.opponentsContainer) return;
    this.opponentsContainer.innerHTML = '';

    const opponents = players.filter(p => p.id !== this.localPlayerId);

    opponents.forEach(p => {
      const isTurn = currentPlayer && currentPlayer.id === p.id;
      const slot = document.createElement('div');
      slot.className = `opponent-slot ${isTurn ? 'active-turn' : ''} ${p.isEliminated ? 'eliminated' : ''}`;
      slot.id = `opp-slot-${p.id}`;

      let miniCardsHtml = '';
      if (!p.isEliminated) {
        const displayCards = Math.min(p.cardCount, 8);
        for (let i = 0; i < displayCards; i++) {
          miniCardsHtml += `<div class="mini-card-back">${getCardBackSVG()}</div>`;
        }
      }

      // 25-Card Danger Warning Color
      const dangerColor = p.cardCount >= 18 ? '#ff1e38' : p.cardCount >= 12 ? '#ffd000' : '#ff0077';

      slot.innerHTML = `
        <div class="opponent-avatar" id="avatar-${p.id}">
          ${!p.isEliminated ? `
            <svg class="timer-ring" viewBox="0 0 76 76">
              <circle class="timer-circle" id="circle-${p.id}" cx="38" cy="38" r="34"></circle>
            </svg>
          ` : ''}
          <span>${p.isEliminated ? '💀' : (p.avatar || '🤖')}</span>
          <span class="opponent-card-count" style="background:${p.isEliminated ? '#555' : dangerColor}">
            ${p.isEliminated ? 'OUT' : (gameMode === 'mercy' ? `${p.cardCount}/25` : p.cardCount)}
          </span>
        </div>
        <div class="opponent-name">
          <span>${p.name}</span>
          ${p.isEliminated ? '<span class="bot-tag" style="background:#ff1e38; color:#fff; border-color:#ff1e38;">OUT</span>' : (p.isBot ? `<span class="bot-tag">${p.personality || 'BOT'}</span>` : '')}
        </div>
        <div class="opponent-cards-fan">
          ${miniCardsHtml}
        </div>
      `;

      this.opponentsContainer.appendChild(slot);
    });
  }

  renderCenter(topCard, activeColor, direction, stackCount) {
    if (this.colorAura) {
      const colorMap = {
        red: 'rgba(255, 30, 56, 0.45)',
        blue: 'rgba(0, 132, 255, 0.45)',
        green: 'rgba(0, 214, 89, 0.45)',
        yellow: 'rgba(255, 208, 0, 0.45)',
        wild: 'rgba(0, 240, 255, 0.45)'
      };
      this.colorAura.style.backgroundColor = colorMap[activeColor] || colorMap.red;
    }

    if (this.directionIndicator) {
      this.directionIndicator.className = `direction-indicator ${direction === 1 ? 'clockwise' : 'counter-clockwise'}`;
    }

    if (this.stackBadge) {
      if (stackCount > 0) {
        this.stackBadge.style.display = 'block';
        this.stackBadge.textContent = `+${stackCount} STACK`;
      } else {
        this.stackBadge.style.display = 'none';
      }
    }

    if (this.discardContainer && topCard) {
      this.discardContainer.innerHTML = '';
      const topEl = createCardElement(topCard, false);
      topEl.classList.add('card-played-anim');
      topEl.style.setProperty('--discard-rot', `${topCard.rotation || 0}deg`);
      topEl.style.transform = `rotate(${topCard.rotation || 0}deg)`;
      this.discardContainer.appendChild(topEl);
    }
  }

  renderPlayerHand(hand, topCard, activeColor, stackCount, isMyTurn, houseRules) {
    if (!this.playerHandContainer) return;
    this.playerHandContainer.innerHTML = '';

    const total = hand.length;
    const maxSpread = Math.min(total * 16, 56);
    const step = total > 1 ? maxSpread / (total - 1) : 0;
    const startAngle = -maxSpread / 2;

    hand.forEach((card, idx) => {
      const angle = startAngle + (idx * step);
      const yOffset = Math.abs(angle) * 0.4;

      const playable = isMyTurn && isCardPlayable(card, topCard, activeColor, stackCount, houseRules);

      const cardEl = createCardElement(card, playable, (selectedCard) => {
        this.handleCardClick(selectedCard);
      });

      cardEl.style.transform = `rotate(${angle}deg) translateY(${yOffset}px)`;
      cardEl.style.zIndex = idx + 1;

      this.playerHandContainer.appendChild(cardEl);
    });
  }

  handleCardClick(card) {
    if (card.color === 'wild' || card.type.startsWith('wild') || card.type === 'mystery') {
      this.pendingWildCard = card;
      this.openColorPicker();
      return;
    }

    if (card.value === 7) {
      this.pendingSevenCard = card;
      this.openSwapSelector();
      return;
    }

    if (this.onPlayCard) {
      this.onPlayCard(card.id);
    }
  }

  openColorPicker() {
    if (this.colorModal) this.colorModal.classList.add('active');
  }

  closeColorPicker() {
    if (this.colorModal) this.colorModal.classList.remove('active');
  }

  selectColorChoice(color) {
    this.closeColorPicker();
    if (this.pendingWildCard && this.onPlayCard) {
      this.onPlayCard(this.pendingWildCard.id, color);
      this.pendingWildCard = null;
    }
  }

  openSwapSelector() {
    const list = document.getElementById('swap-targets-list');
    if (!list || !window.gameEngine) return;
    list.innerHTML = '';

    const opponents = window.gameEngine.getActivePlayers().filter(p => p.id !== this.localPlayerId);
    opponents.forEach(p => {
      const item = document.createElement('div');
      item.className = 'swap-target-card';
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:28px;">${p.avatar || '🤖'}</span>
          <div>
            <div style="font-weight:800; color:#fff; font-size:16px;">${p.name}</div>
            <div style="font-size:12px; color:#94a3b8; font-weight:700;">${p.cardCount} cards in hand</div>
          </div>
        </div>
        <button class="btn-primary" style="padding:8px 16px; font-size:13px;">SWAP HAND</button>
      `;
      item.addEventListener('click', () => {
        this.closeSwapSelector();
        if (this.pendingSevenCard && this.onPlayCard) {
          this.onPlayCard(this.pendingSevenCard.id, null, p.id);
          this.pendingSevenCard = null;
        }
      });
      list.appendChild(item);
    });

    if (this.swapModal) this.swapModal.classList.add('active');
  }

  closeSwapSelector() {
    if (this.swapModal) this.swapModal.classList.remove('active');
  }

  checkJumpInAvailability(localPlayer, topCard, isMyTurn, houseRules) {
    if (!this.jumpInBtn || !houseRules.jumpIn || isMyTurn || !localPlayer || !topCard || localPlayer.isEliminated) {
      if (this.jumpInBtn) this.jumpInBtn.style.display = 'none';
      return;
    }

    const matchingCard = localPlayer.hand.find(c => isExactJumpInMatch(c, topCard));
    if (matchingCard) {
      this.jumpInBtn.style.display = 'block';
      this.jumpInBtn.textContent = `⚡ JUMP-IN with ${matchingCard.displayName}!`;
      this.jumpInBtn.onclick = () => {
        if (this.onJumpIn) this.onJumpIn(matchingCard.id);
      };
    } else {
      this.jumpInBtn.style.display = 'none';
    }
  }

  updateTimer(timeLeft, maxTime, currentTurnPlayerId) {
    const fraction = Math.max(0, timeLeft / maxTime);
    const offset = 213 * (1 - fraction);

    const circle = document.getElementById(`circle-${currentTurnPlayerId}`);
    if (circle) {
      circle.style.strokeDashoffset = offset;
      if (fraction < 0.25) circle.style.stroke = '#ff1e38';
      else if (fraction < 0.5) circle.style.stroke = '#ffd000';
      else circle.style.stroke = '#00f0ff';
    }

    const isMyTurn = currentTurnPlayerId === this.localPlayerId;
    let turnName = 'Opponent';
    if (window.gameEngine && window.gameEngine.players) {
      const p = window.gameEngine.players.find(pl => pl.id === currentTurnPlayerId);
      if (p) turnName = p.name;
    }
    this.updateTurnBanner(isMyTurn, turnName, timeLeft);
  }

  updateTurnBanner(isMyTurn, currentPlayerName, timeLeft = null) {
    if (!this.turnBanner || !this.turnBannerText) return;
    const timeStr = timeLeft !== null ? ` (${timeLeft}s)` : '';

    if (isMyTurn) {
      this.turnBanner.classList.add('my-turn');
      this.turnBannerText.textContent = `👉 YOUR TURN${timeStr} — Play a card or draw!`;
    } else {
      this.turnBanner.classList.remove('my-turn');
      this.turnBannerText.textContent = `⏳ ${currentPlayerName || 'Opponent'}'s Turn${timeStr}...`;
    }
  }

  addMessageToFeed(text, type = 'action', sender = null, avatar = null) {
    if (!this.messagesList) {
      this.messagesList = document.getElementById('messages-content-list');
    }
    if (!this.messagesList) return;

    const msgEl = document.createElement('div');
    msgEl.className = `feed-msg ${type}`;
    if (sender) {
      msgEl.innerHTML = `<strong>${avatar || '👤'} ${sender}:</strong> ${text}`;
    } else {
      msgEl.textContent = text;
    }

    this.messagesList.appendChild(msgEl);
    this.messagesList.scrollTop = this.messagesList.scrollHeight;
  }

  showAlert(message, type = 'info') {
    // 1. Add to live in-game message feed
    const feedType = type === 'warning' ? 'hazard' : type === 'jump' ? 'hazard' : type === 'swap' ? 'action' : 'action';
    this.addMessageToFeed(message, feedType);

    // 2. Display prominent table center alert
    if (!this.tableAlert) return;
    this.tableAlert.textContent = message;
    this.tableAlert.style.display = 'block';

    // GUARANTEED HIGH CONTRAST: Deep dark background with bold bright colors!
    this.tableAlert.style.background = '#0f172a';
    this.tableAlert.style.color = '#ffffff';

    if (type === 'warning') {
      this.tableAlert.style.borderColor = '#ff1e38';
      this.tableAlert.style.color = '#ff6b81';
    } else if (type === 'shield') {
      this.tableAlert.style.borderColor = '#00f0ff';
      this.tableAlert.style.color = '#00f0ff';
    } else if (type === 'swap') {
      this.tableAlert.style.borderColor = '#ffd000';
      this.tableAlert.style.color = '#ffd000';
    } else if (type === 'jump') {
      this.tableAlert.style.borderColor = '#ff0077';
      this.tableAlert.style.color = '#ff77c2';
    } else {
      this.tableAlert.style.borderColor = '#ffd000';
      this.tableAlert.style.color = '#ffffff';
    }

    clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.tableAlert.style.display = 'none';
    }, 3200);
  }

  showWinnerModal(winner) {
    if (!this.winnerModal) return;
    const nameEl = document.getElementById('winner-name');
    if (nameEl) nameEl.textContent = `${winner.name} WINS!`;

    this.winnerModal.classList.add('active');

    if (window.confettiCannon) {
      window.confettiCannon.fire(4500);
    }
  }

  spawnEmote(avatar, emoteId) {
    const bubble = document.createElement('div');
    bubble.className = 'floating-emote';
    bubble.textContent = emoteId;

    bubble.style.left = `${window.innerWidth / 2 + (Math.random() - 0.5) * 200}px`;
    bubble.style.top = `${window.innerHeight / 2 + (Math.random() - 0.5) * 100}px`;

    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1600);
  }
}
