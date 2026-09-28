const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    activeRooms: Object.keys(rooms).length,
    timestamp: Date.now(),
    name: 'UNO With Friends & Bots Server'
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// REAL-TIME MULTIPLAYER ROOMS & BOT SYSTEM
// ==========================================
const rooms = {};

const DEFAULT_BOT_NAMES = ['Viper', 'Echo', 'Glitch', 'Nova', 'Titan', 'Ghost'];
const DEFAULT_BOT_AVATARS = ['🐍', '🤖', '⚡', '🔮', '🛡️', '👾'];

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

wss.on('connection', (ws) => {
  let currentRoomId = null;
  let playerId = 'player_' + Math.random().toString(36).substr(2, 8);
  let playerName = 'Player';

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        // 1. CREATE ROOM (Mode, Timer, Name)
        case 'CREATE_ROOM': {
          const roomId = generateRoomCode();
          currentRoomId = roomId;
          playerName = (payload.playerName || 'Host').slice(0, 15);
          const gameMode = payload.gameMode || 'mercy'; // 'mercy', 'classic', 'chaos'
          const turnTimer = parseInt(payload.turnTimer, 10) || 30; // 15, 30, 45, 60s

          rooms[roomId] = {
            id: roomId,
            hostId: playerId,
            gameMode,
            turnTimer,
            houseRules: payload.houseRules || {},
            players: [
              {
                id: playerId,
                name: playerName,
                avatar: payload.avatar || '🤠',
                isHost: true,
                isBot: false,
                isReady: true,
                ws
              }
            ],
            isStarted: false,
            createdAt: Date.now()
          };

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            payload: {
              roomId,
              playerId,
              isHost: true,
              gameMode,
              turnTimer
            }
          }));

          broadcastRoomPlayers(roomId);
          break;
        }

        // 2. JOIN ROOM (Code, Name)
        case 'JOIN_ROOM': {
          const code = (payload.roomId || '').toUpperCase().trim();
          const room = rooms[code];

          if (!room) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: `Room ${code} does not exist.` }
            }));
            return;
          }

          if (room.isStarted) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: `Game in room ${code} has already started.` }
            }));
            return;
          }

          if (room.players.length >= 6) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: `Room ${code} is full (max 6 players).` }
            }));
            return;
          }

          currentRoomId = code;
          playerName = (payload.playerName || 'Guest').slice(0, 15);

          const newPlayer = {
            id: playerId,
            name: playerName,
            avatar: payload.avatar || '👤',
            isHost: false,
            isBot: false,
            isReady: true,
            ws
          };

          room.players.push(newPlayer);

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            payload: {
              roomId: code,
              playerId,
              isHost: false,
              gameMode: room.gameMode,
              turnTimer: room.turnTimer
            }
          }));

          broadcastRoomPlayers(code);
          break;
        }

        // 3. ADD BOT TO ROOM (Host only)
        case 'ADD_BOT': {
          if (!currentRoomId || !rooms[currentRoomId]) return;
          const room = rooms[currentRoomId];
          if (room.hostId !== playerId) return;
          if (room.players.length >= 6) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Room is full (max 6 players including bots).' }
            }));
            return;
          }

          const botIndex = room.players.filter(p => p.isBot).length;
          const botName = DEFAULT_BOT_NAMES[botIndex % DEFAULT_BOT_NAMES.length];
          const botAvatar = DEFAULT_BOT_AVATARS[botIndex % DEFAULT_BOT_AVATARS.length];
          const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

          room.players.push({
            id: botId,
            name: botName,
            avatar: botAvatar,
            isHost: false,
            isBot: true,
            isReady: true,
            ws: null
          });

          broadcastRoomPlayers(currentRoomId);
          break;
        }

        // 4. REMOVE BOT FROM ROOM (Host only)
        case 'REMOVE_BOT': {
          if (!currentRoomId || !rooms[currentRoomId]) return;
          const room = rooms[currentRoomId];
          if (room.hostId !== playerId) return;

          const targetBotId = payload.botId;
          const botIdx = room.players.findIndex(p => p.id === targetBotId && p.isBot);
          if (botIdx !== -1) {
            room.players.splice(botIdx, 1);
            broadcastRoomPlayers(currentRoomId);
          }
          break;
        }

        // 5. START GAME (Host only)
        case 'START_GAME': {
          if (!currentRoomId || !rooms[currentRoomId]) return;
          const room = rooms[currentRoomId];
          if (room.hostId !== playerId) return;
          if (room.players.length < 2) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Need at least 2 players (friends or bots) to start!' }
            }));
            return;
          }

          room.isStarted = true;

          const playerPayload = room.players.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            isHost: p.isHost,
            isBot: p.isBot
          }));

          broadcastToRoom(currentRoomId, {
            type: 'GAME_STARTED',
            payload: {
              roomId: currentRoomId,
              gameMode: room.gameMode,
              turnTimer: room.turnTimer,
              houseRules: room.houseRules,
              players: playerPayload
            }
          });
          break;
        }

        // 6. IN-GAME ACTION BROADCAST
        case 'GAME_ACTION': {
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            type: 'GAME_ACTION',
            payload: {
              senderId: playerId,
              action: payload.action,
              data: payload.data
            }
          });
          break;
        }

        // 7. EMOTE & CHAT
        case 'EMOTE': {
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            type: 'EMOTE',
            payload: { senderId: playerId, emote: payload.emote }
          });
          break;
        }

        case 'CHAT': {
          if (!currentRoomId) return;
          broadcastToRoom(currentRoomId, {
            type: 'CHAT',
            payload: { senderId: playerId, senderName: playerName, text: payload.text }
          });
          break;
        }
      }
    } catch (e) {
      console.error('[Server] Message error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && rooms[currentRoomId]) {
      const room = rooms[currentRoomId];
      room.players = room.players.filter(p => p.id !== playerId);

      if (room.players.length === 0 || room.players.every(p => p.isBot)) {
        delete rooms[currentRoomId];
      } else {
        if (room.hostId === playerId) {
          const nextHuman = room.players.find(p => !p.isBot);
          if (nextHuman) {
            room.hostId = nextHuman.id;
            nextHuman.isHost = true;
          }
        }
        broadcastRoomPlayers(currentRoomId);
      }
    }
  });
});

function broadcastRoomPlayers(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const list = room.players.map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    isBot: p.isBot,
    isReady: p.isReady
  }));

  broadcastToRoom(roomId, {
    type: 'ROOM_PLAYERS_UPDATE',
    payload: {
      roomId,
      gameMode: room.gameMode,
      turnTimer: room.turnTimer,
      players: list
    }
  });
}

function broadcastToRoom(roomId, messageObj) {
  const room = rooms[roomId];
  if (!room) return;
  const payloadStr = JSON.stringify(messageObj);
  room.players.forEach(p => {
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payloadStr);
    }
  });
}

server.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 UNO With Friends & Bots running at http://localhost:${PORT}`);
  console.log(`⚡ Real-Time Rooms with Bot Support`);
  console.log(`=================================================\n`);
});
