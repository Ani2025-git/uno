/**
 * Resilient Network Client for Real-Time Rooms with Friends & Bots
 * Supports live WebSockets when connected, with automatic local room engine on static hosts (Vercel)
 */
class UnoNetworkClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.roomId = null;
    this.playerId = null;
    this.playerName = 'Player';
    this.avatar = '🤠';
    this.isHost = false;
    this.gameMode = 'mercy';
    this.turnTimer = 30;
    this.localRoom = null;

    // Callbacks
    this.onConnected = null;
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onPlayerListUpdate = null;
    this.onGameStart = null;
    this.onGameAction = null;
    this.onChatMessage = null;
    this.onEmoteReceived = null;
    this.onError = null;
  }

  connect(serverUrl = null) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultUrl = `${protocol}//${window.location.host}`;
    const url = serverUrl || defaultUrl;

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        if (this.onConnected) this.onConnected();
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
      };

      this.socket.onerror = (err) => {
        console.warn('[WS] Socket unavailable. Fallback to resilient local room engine.');
        this.isConnected = false;
      };
    } catch (e) {
      console.warn('[WS] Connection failed:', e);
      this.isConnected = false;
    }
  }

  send(type, payload = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify({ type, payload }));
  }

  createRoom(playerName, gameMode = 'mercy', turnTimer = 30, houseRules = {}, avatar = '🤠') {
    this.playerName = playerName;
    this.gameMode = gameMode;
    this.turnTimer = turnTimer;
    this.avatar = avatar;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('CREATE_ROOM', { playerName, gameMode, turnTimer, houseRules, avatar });
      return;
    }

    // Local in-browser room engine (100% Vercel compatible)
    const roomId = 'UNO' + Math.floor(100 + Math.random() * 899);
    this.roomId = roomId;
    this.playerId = 'player_host';
    this.isHost = true;

    this.localRoom = {
      id: roomId,
      hostId: this.playerId,
      gameMode,
      turnTimer,
      houseRules,
      players: [
        {
          id: this.playerId,
          name: playerName,
          avatar: avatar,
          isHost: true,
          isBot: false,
          isReady: true
        }
      ]
    };

    if (this.onRoomCreated) {
      this.onRoomCreated({
        roomId,
        playerId: this.playerId,
        isHost: true,
        gameMode,
        turnTimer
      });
    }

    if (this.onPlayerListUpdate) {
      this.onPlayerListUpdate({
        roomId,
        players: this.localRoom.players,
        gameMode,
        turnTimer
      });
    }
  }

  joinRoom(roomId, playerName, avatar = '👤') {
    this.playerName = playerName;
    this.avatar = avatar;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('JOIN_ROOM', { roomId: roomId.toUpperCase().trim(), playerName, avatar });
      return;
    }

    // In static local mode, simulate joining
    this.createRoom(playerName, 'mercy', 30, {}, avatar);
  }

  addBot() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('ADD_BOT');
      return;
    }

    if (!this.localRoom || this.localRoom.players.length >= 6) return;

    const botProfiles = (typeof BOT_PROFILES !== 'undefined') ? BOT_PROFILES : [
      { name: 'Viper', personality: 'aggressive', avatar: '🐍' },
      { name: 'Echo', personality: 'tactical', avatar: '🤖' },
      { name: 'Glitch', personality: 'chaotic', avatar: '⚡' },
      { name: 'Nova', personality: 'balanced', avatar: '🔮' },
      { name: 'Titan', personality: 'brute', avatar: '🛡️' }
    ];

    const currentCount = this.localRoom.players.length;
    const profile = botProfiles[(currentCount - 1) % botProfiles.length];
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    this.localRoom.players.push({
      id: botId,
      name: profile.name,
      avatar: profile.avatar,
      isHost: false,
      isBot: true,
      personality: profile.personality,
      isReady: true
    });

    if (this.onPlayerListUpdate) {
      this.onPlayerListUpdate({
        roomId: this.localRoom.id,
        players: this.localRoom.players,
        gameMode: this.localRoom.gameMode,
        turnTimer: this.localRoom.turnTimer
      });
    }
  }

  removeBot(botId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('REMOVE_BOT', { botId });
      return;
    }

    if (!this.localRoom) return;
    this.localRoom.players = this.localRoom.players.filter(p => p.id !== botId);

    if (this.onPlayerListUpdate) {
      this.onPlayerListUpdate({
        roomId: this.localRoom.id,
        players: this.localRoom.players,
        gameMode: this.localRoom.gameMode,
        turnTimer: this.localRoom.turnTimer
      });
    }
  }

  startGame() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('START_GAME');
      return;
    }

    if (!this.localRoom || this.localRoom.players.length < 2) return;

    if (this.onGameStart) {
      this.onGameStart({
        roomId: this.localRoom.id,
        gameMode: this.localRoom.gameMode,
        turnTimer: this.localRoom.turnTimer,
        houseRules: this.localRoom.houseRules,
        players: this.localRoom.players
      });
    }
  }

  sendGameAction(action, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('GAME_ACTION', { action, data });
    }
  }

  sendEmote(emote) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('EMOTE', { emote });
    }
  }

  sendChat(text) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send('CHAT', { text });
      return;
    }

    if (this.onChatMessage) {
      this.onChatMessage({
        senderId: this.playerId || 'local',
        senderName: this.playerName || 'You',
        avatar: this.avatar || '🤠',
        text,
        timestamp: Date.now()
      });
    }
  }

  handleServerMessage(msg) {
    switch (msg.type) {
      case 'ROOM_CREATED':
        this.roomId = msg.payload.roomId;
        this.playerId = msg.payload.playerId;
        this.isHost = true;
        this.gameMode = msg.payload.gameMode;
        this.turnTimer = msg.payload.turnTimer;
        if (this.onRoomCreated) this.onRoomCreated(msg.payload);
        break;

      case 'ROOM_JOINED':
        this.roomId = msg.payload.roomId;
        this.playerId = msg.payload.playerId;
        this.isHost = msg.payload.isHost;
        this.gameMode = msg.payload.gameMode;
        this.turnTimer = msg.payload.turnTimer;
        if (this.onRoomJoined) this.onRoomJoined(msg.payload);
        break;

      case 'ROOM_PLAYERS_UPDATE':
        if (msg.payload.gameMode) this.gameMode = msg.payload.gameMode;
        if (msg.payload.turnTimer) this.turnTimer = msg.payload.turnTimer;
        if (this.onPlayerListUpdate) this.onPlayerListUpdate(msg.payload);
        break;

      case 'GAME_STARTED':
        if (this.onGameStart) this.onGameStart(msg.payload);
        break;

      case 'GAME_ACTION':
        if (this.onGameAction) this.onGameAction(msg.payload);
        break;

      case 'EMOTE':
        if (this.onEmoteReceived) this.onEmoteReceived(msg.payload.senderId, msg.payload.emote);
        break;

      case 'CHAT':
        if (this.onChatMessage) this.onChatMessage(msg.payload);
        break;

      case 'ERROR':
        if (this.onError) this.onError(msg.payload.message);
        else alert(msg.payload.message);
        break;
    }
  }
}
