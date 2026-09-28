/**
 * Main Application Orchestrator
 * Focused on Play with Friends & Bots with Full Room Lobby Display (Code, Timing, Mode, 6 Seat Pods)
 */
document.addEventListener('DOMContentLoaded', () => {
  window.cyberParticles = new CyberParticleCanvas('background-canvas');
  window.confettiCannon = new ConfettiCannon('confetti-canvas');

  window.gameEngine = new UnoGameEngine();
  const ui = new UnoUI();
  const net = new UnoNetworkClient();

  let selectedMode = 'mercy'; // 'mercy', 'classic', 'chaos'
  let selectedTimer = 30;     // 15, 30, 45, 60 seconds
  let selectedAvatar = '🤠';
  let currentRoomData = null;
  let localPlayer = { id: null, name: 'Player 1', avatar: '🤠', isHost: false };

  const houseRules = {
    mercyRule: true,
    stacking: true,
    sevenZero: true,
    jumpIn: true,
    shieldCard: false,
    mysteryCard: false
  };

  const screens = {
    lobby: document.getElementById('lobby-screen'),
    roomLobby: document.getElementById('room-lobby-screen'),
    game: document.getElementById('game-screen')
  };

  function switchScreen(screenName) {
    Object.values(screens).forEach(s => s && s.classList.remove('active'));
    if (screens[screenName]) {
      screens[screenName].classList.add('active');
    }
  }

  // Connect WebSocket on boot
  net.connect();

  // Check URL params for invite link (?room=XYZ123)
  try {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      const joinModal = document.getElementById('join-modal');
      const codeInput = document.getElementById('join-code-input');
      if (codeInput) codeInput.value = roomFromUrl.toUpperCase();
      if (joinModal) joinModal.classList.add('active');
    }
  } catch (e) {}

  // 1. Avatar Picker Selection
  const avatarChoices = document.querySelectorAll('.avatar-choice');
  avatarChoices.forEach(choice => {
    choice.addEventListener('click', (e) => {
      avatarChoices.forEach(c => c.classList.remove('selected'));
      const target = e.currentTarget;
      target.classList.add('selected');
      selectedAvatar = target.getAttribute('data-avatar') || '🤠';
      localPlayer.avatar = selectedAvatar;
      Sound.playClick();
    });
  });

  // 2. Modals: Host & Join Modals
  const hostModal = document.getElementById('host-modal');
  const joinModal = document.getElementById('join-modal');
  const rulesModal = document.getElementById('rules-modal');

  const btnOpenHost = document.getElementById('btn-open-host-modal');
  const btnCloseHost = document.getElementById('btn-close-host-modal');
  const btnOpenJoin = document.getElementById('btn-open-join-modal');
  const btnCloseJoin = document.getElementById('btn-close-join-modal');

  if (btnOpenHost && hostModal) {
    btnOpenHost.addEventListener('click', () => {
      Sound.playClick();
      hostModal.classList.add('active');
    });
  }
  if (btnCloseHost && hostModal) {
    btnCloseHost.addEventListener('click', () => {
      Sound.playClick();
      hostModal.classList.remove('active');
    });
  }

  if (btnOpenJoin && joinModal) {
    btnOpenJoin.addEventListener('click', () => {
      Sound.playClick();
      joinModal.classList.add('active');
      const input = document.getElementById('join-code-input');
      if (input) setTimeout(() => input.focus(), 150);
    });
  }
  if (btnCloseJoin && joinModal) {
    btnCloseJoin.addEventListener('click', () => {
      Sound.playClick();
      joinModal.classList.remove('active');
    });
  }

  // 3. Mode Selector Pills (What You Play)
  const modePills = document.querySelectorAll('.mode-pill');
  modePills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      modePills.forEach(p => p.classList.remove('selected'));
      const target = e.currentTarget;
      target.classList.add('selected');
      selectedMode = target.getAttribute('data-mode');
      Sound.playClick();

      // Configure rules based on mode
      if (selectedMode === 'mercy') {
        houseRules.mercyRule = true;
        houseRules.stacking = true;
        houseRules.shieldCard = false;
        houseRules.mysteryCard = false;
      } else if (selectedMode === 'chaos') {
        houseRules.shieldCard = true;
        houseRules.mysteryCard = true;
        houseRules.mercyRule = false;
      } else {
        houseRules.mercyRule = false;
        houseRules.shieldCard = false;
        houseRules.mysteryCard = false;
      }
    });
  });

  // 4. Turn Timer Selector Pills
  const timerPills = document.querySelectorAll('.timer-pill');
  timerPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      timerPills.forEach(p => p.classList.remove('selected'));
      const target = e.currentTarget;
      target.classList.add('selected');
      selectedTimer = parseInt(target.getAttribute('data-time'), 10) || 30;
      Sound.playClick();
    });
  });

  // 5. Sound Mute Toggle
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = Sound.toggleMute();
      muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
      muteBtn.title = isMuted ? 'Unmute Sound' : 'Mute Sound';
    });
  }

  // 6. Rules Modal
  const btnOpenRules = document.getElementById('btn-rules');
  const btnCloseRules = document.getElementById('btn-close-rules');
  if (btnOpenRules && rulesModal) {
    btnOpenRules.addEventListener('click', () => {
      Sound.playClick();
      rulesModal.classList.add('active');
    });
  }
  if (btnCloseRules && rulesModal) {
    btnCloseRules.addEventListener('click', () => {
      Sound.playClick();
      rulesModal.classList.remove('active');
    });
  }

  // 7. Create Room Action
  const btnCreateRoom = document.getElementById('btn-create-room');
  if (btnCreateRoom) {
    btnCreateRoom.addEventListener('click', () => {
      Sound.playClick();
      if (hostModal) hostModal.classList.remove('active');

      const nameInput = document.getElementById('player-name-input');
      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Host';
      localPlayer.name = name;
      localPlayer.avatar = selectedAvatar;
      localPlayer.isHost = true;

      net.createRoom(name, selectedMode, selectedTimer, houseRules, selectedAvatar);
    });
  }

  // 8. Join Room Action
  const btnJoinRoom = document.getElementById('btn-join-room');
  if (btnJoinRoom) {
    btnJoinRoom.addEventListener('click', () => {
      Sound.playClick();
      const codeInput = document.getElementById('join-code-input');
      const code = codeInput && codeInput.value.trim() ? codeInput.value.trim().toUpperCase() : '';
      if (!code || code.length !== 6) {
        alert('Please enter a valid 6-character room code!');
        return;
      }

      if (joinModal) joinModal.classList.remove('active');

      const nameInput = document.getElementById('player-name-input');
      const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Player';
      localPlayer.name = name;
      localPlayer.avatar = selectedAvatar;
      localPlayer.isHost = false;

      net.joinRoom(code, name, selectedAvatar);
    });
  }

  // 9. Leave Room Action
  const btnLobbyLeave = document.getElementById('btn-lobby-leave');
  if (btnLobbyLeave) {
    btnLobbyLeave.addEventListener('click', () => {
      Sound.playClick();
      if (confirm('Are you sure you want to leave this room?')) {
        switchScreen('lobby');
        window.location.reload();
      }
    });
  }

  // ========================================================
  // ROOM LOBBY EVENT HANDLERS (SHOWS TIMING, WHAT YOU PLAY, SEATS)
  // ========================================================

  net.onRoomCreated = (data) => {
    localPlayer.id = data.playerId;
    localPlayer.isHost = true;
    currentRoomData = data;
    showRoomLobby(data.roomId, data.gameMode, data.turnTimer, true);
  };

  net.onRoomJoined = (data) => {
    localPlayer.id = data.playerId;
    localPlayer.isHost = data.isHost;
    currentRoomData = data;
    showRoomLobby(data.roomId, data.gameMode, data.turnTimer, data.isHost);
  };

  function showRoomLobby(roomId, gameMode, turnTimer, isHost) {
    switchScreen('roomLobby');

    // 1. Room Code
    const codeEl = document.getElementById('room-code-display');
    if (codeEl) codeEl.textContent = roomId;

    // 2. What You Play (Mode Display)
    const modeEl = document.getElementById('meta-mode-display');
    if (modeEl) {
      const modeNames = {
        mercy: '💀 Mode: UNO No Mercy (25-Card KO)',
        classic: '🃏 Mode: Classic UNO (Official Rules)',
        chaos: '⚡ Mode: Cyber Chaos (Shields & Mystery)'
      };
      modeEl.textContent = modeNames[gameMode] || '🎮 Mode: Custom Match';
    }

    // 3. Timing Show
    const timingEl = document.getElementById('meta-timing-display');
    if (timingEl) {
      timingEl.textContent = `⏱️ Turn Timer: ${turnTimer} Seconds`;
    }

    // 4. Host controls visibility
    const addBotBtn = document.getElementById('btn-room-add-bot');
    const startGameBtn = document.getElementById('btn-room-start-game');
    const noticeEl = document.getElementById('room-host-notice');

    if (addBotBtn) addBotBtn.style.display = isHost ? 'flex' : 'none';
    if (startGameBtn) startGameBtn.style.display = isHost ? 'flex' : 'none';
    if (noticeEl) {
      noticeEl.textContent = isHost 
        ? 'You are the Host. Add bots to fill empty seats and launch when ready!'
        : 'Waiting for the host to add bots and start the game...';
    }
  }

  // 5. Render 6-Seat Visual Pods Grid
  net.onPlayerListUpdate = (payload) => {
    const seatsGrid = document.getElementById('room-seats-grid');
    const countEl = document.getElementById('meta-players-count');
    const seatsInfo = document.getElementById('room-seats-info');
    const startBtn = document.getElementById('btn-room-start-game');

    const players = payload.players || [];
    const totalCount = players.length;
    const maxSeats = 6;

    if (countEl) countEl.textContent = `👥 ${totalCount} / ${maxSeats} Players`;
    if (seatsInfo) seatsInfo.textContent = `Seats Available: ${Math.max(0, maxSeats - totalCount)}`;

    if (startBtn && localPlayer.isHost) {
      startBtn.disabled = totalCount < 2;
      startBtn.style.opacity = totalCount >= 2 ? '1' : '0.5';
      startBtn.textContent = totalCount < 2 ? '⏳ Need 2+ Players to Start' : '🚀 Start Game';
    }

    if (seatsGrid) {
      let html = '';
      for (let i = 0; i < maxSeats; i++) {
        const p = players[i];
        if (p) {
          // Occupied seat pod
          html += `
            <div class="seat-pod occupied" id="seat-pod-${p.id}">
              <div class="seat-left">
                <div class="seat-avatar">${p.avatar || (p.isBot ? '🤖' : '👤')}</div>
                <div>
                  <div class="seat-name">
                    <span>${p.name}</span>
                    <span class="seat-badge ${p.isHost ? 'host' : p.isBot ? 'bot' : ''}">
                      ${p.isHost ? '👑 HOST' : p.isBot ? 'BOT' : 'PLAYER'}
                    </span>
                  </div>
                  <div style="font-size:11px; font-weight:800; color:var(--brand-green); margin-top:2px;">READY TO PLAY</div>
                </div>
              </div>
              ${(localPlayer.isHost && p.isBot) ? `
                <button class="btn-remove-pod-bot" data-bot-id="${p.id}" title="Remove Bot">❌</button>
              ` : ''}
            </div>
          `;
        } else {
          // Empty seat pod
          html += `
            <div class="seat-pod empty ${localPlayer.isHost ? 'clickable-add-bot' : ''}" title="${localPlayer.isHost ? 'Click to add an AI bot' : 'Waiting for friend'}">
              <span>➕ Empty Seat ${i + 1}</span>
              ${localPlayer.isHost ? `<span style="font-size:11px; opacity:0.8;">(Click to Add Bot)</span>` : ''}
            </div>
          `;
        }
      }

      seatsGrid.innerHTML = html;

      // Bind remove bot buttons
      seatsGrid.querySelectorAll('.btn-remove-pod-bot').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const botId = e.currentTarget.getAttribute('data-bot-id');
          Sound.playClick();
          net.removeBot(botId);
        });
      });

      // Bind click empty seat to add bot (if host)
      if (localPlayer.isHost) {
        seatsGrid.querySelectorAll('.seat-pod.empty.clickable-add-bot').forEach(emptyPod => {
          emptyPod.addEventListener('click', () => {
            Sound.playClick();
            net.addBot();
          });
        });
      }
    }
  };

  // Add Bot Button
  const btnAddBot = document.getElementById('btn-room-add-bot');
  if (btnAddBot) {
    btnAddBot.addEventListener('click', () => {
      Sound.playClick();
      net.addBot();
    });
  }

  // Copy Invite Link Button
  const btnCopyLink = document.getElementById('btn-copy-link');
  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', () => {
      Sound.playClick();
      const code = document.getElementById('room-code-display')?.textContent || '';
      const inviteUrl = `${window.location.origin}/?room=${code}`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        btnCopyLink.textContent = '✅ Copied Invite Link!';
        setTimeout(() => {
          btnCopyLink.textContent = '📋 Copy Invite Link';
        }, 2200);
      }).catch(() => {
        prompt('Copy room invite link:', inviteUrl);
      });
    });
  }

  // Start Game Button
  const btnStartGame = document.getElementById('btn-room-start-game');
  if (btnStartGame) {
    btnStartGame.addEventListener('click', () => {
      Sound.playClick();
      net.startGame();
    });
  }

  // ========================================================
  // IN-GAME INITIALIZATION & SYNCHRONIZATION
  // ========================================================

  net.onGameStart = (gameData) => {
    switchScreen('game');

    const gameMode = gameData.gameMode || 'mercy';
    const turnTimer = gameData.turnTimer || 30;
    const roomPlayers = gameData.players || [];

    // Initialize local game engine instance with room players & bots
    const enginePlayers = roomPlayers.map(p => {
      if (p.isBot) {
        return new BotPlayer(p.id, p.name, 'aggressive', p.avatar || '🤖');
      } else {
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar || '👤',
          isBot: false,
          isEliminated: false
        };
      }
    });

    window.gameEngine.turnTimeLimit = turnTimer;

    window.gameEngine.onStateChange = (state) => {
      ui.renderState(state, localPlayer.id);
    };

    window.gameEngine.onNotification = (msg, type) => {
      ui.showAlert(msg, type);
    };

    window.gameEngine.onTimerTick = (timeLeft, maxTime) => {
      const current = window.gameEngine.getCurrentPlayer();
      if (current) ui.updateTimer(timeLeft, maxTime, current.id);
    };

    ui.onPlayCard = (cardId, chosenColor, swapTargetId) => {
      Sound.playCard();
      window.gameEngine.playCard(localPlayer.id, cardId, chosenColor, swapTargetId);
      net.sendGameAction('PLAY_CARD', { cardId, chosenColor, swapTargetId });
    };

    ui.onDrawCard = () => {
      window.gameEngine.drawCard(localPlayer.id);
      net.sendGameAction('DRAW_CARD', {});
    };

    ui.onJumpIn = (cardId) => {
      window.gameEngine.jumpIn(localPlayer.id, cardId);
      net.sendGameAction('JUMP_IN', { cardId });
    };

    ui.onUnoShout = () => {
      window.gameEngine.callUno(localPlayer.id);
    };

    ui.onUnoCatch = () => {
      window.gameEngine.catchUno(localPlayer.id);
    };

    // Initialize authoritative engine
    window.gameEngine.init(enginePlayers, houseRules, gameMode);
  };

  // Sync game actions from other room players
  net.onGameAction = (msg) => {
    if (msg.senderId === localPlayer.id) return; // Ignore own echoes
    const { action, data } = msg;
    if (action === 'PLAY_CARD') {
      window.gameEngine.playCard(msg.senderId, data.cardId, data.chosenColor, data.swapTargetId);
    } else if (action === 'DRAW_CARD') {
      window.gameEngine.drawCard(msg.senderId);
    } else if (action === 'JUMP_IN') {
      window.gameEngine.jumpIn(msg.senderId, data.cardId);
    }
  };

  // Quick In-Game Emote Reactions
  document.querySelectorAll('.emote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const emote = e.currentTarget.getAttribute('data-emote');
      Sound.playEmote(emote);
      ui.spawnEmote(localPlayer.avatar || '👤', emote);
      net.sendEmote(emote);
    });
  });

  net.onEmoteReceived = (senderId, emote) => {
    const p = window.gameEngine?.players?.find(pl => pl.id === senderId);
    ui.spawnEmote(p ? p.avatar : '👤', emote);
  };

  // Live In-Game Chat Feed Handler
  net.onChatMessage = (payload) => {
    const isSelf = payload.senderId === localPlayer.id;
    ui.addMessageToFeed(
      payload.text,
      isSelf ? 'chat self' : 'chat',
      payload.senderName,
      payload.avatar
    );
  };

  function sendInGameChatMessage() {
    const input = document.getElementById('in-game-chat-input');
    const text = input ? input.value.trim() : '';
    if (!text) return;
    net.sendChat(text);
    ui.addMessageToFeed(text, 'chat self', localPlayer.name, localPlayer.avatar);
    input.value = '';
    Sound.playClick();
  }

  const btnSendChat = document.getElementById('btn-send-in-game-chat');
  const chatInput = document.getElementById('in-game-chat-input');
  if (btnSendChat) btnSendChat.addEventListener('click', sendInGameChatMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendInGameChatMessage();
      }
    });
  }

  // Quick Chat Phrase Chips
  document.querySelectorAll('.phrase-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const phrase = e.currentTarget.getAttribute('data-phrase');
      if (phrase) {
        net.sendChat(phrase);
        ui.addMessageToFeed(phrase, 'chat self', localPlayer.name, localPlayer.avatar);
        Sound.playClick();
      }
    });
  });

  // Toggle In-Game Messages Panel
  const btnToggleMsgs = document.getElementById('btn-toggle-messages');
  const msgsPanel = document.getElementById('game-messages-panel');
  if (btnToggleMsgs && msgsPanel) {
    btnToggleMsgs.addEventListener('click', () => {
      msgsPanel.classList.toggle('minimized');
      btnToggleMsgs.textContent = msgsPanel.classList.contains('minimized') ? '➕' : '➖';
    });
  }

  // Return to Lobby
  const btnReturnLobby = document.getElementById('btn-return-lobby');
  const logoHomeBtn = document.getElementById('logo-home-btn');
  [btnReturnLobby, logoHomeBtn].forEach(el => {
    if (el) {
      el.addEventListener('click', () => {
        Sound.playClick();
        document.getElementById('winner-modal')?.classList.remove('active');
        switchScreen('lobby');
      });
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      ui.onDrawCard && ui.onDrawCard();
    } else if (e.key.toLowerCase() === 'u') {
      ui.onUnoShout && ui.onUnoShout();
    } else if (e.key.toLowerCase() === 'j') {
      ui.onJumpIn && ui.onJumpIn();
    } else if (e.key.toLowerCase() === 'm') {
      muteBtn && muteBtn.click();
    }
  });
});
