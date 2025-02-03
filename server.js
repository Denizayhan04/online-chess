require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Oyun şeması
const gameSchema = new mongoose.Schema({
  roomId: String,
  timeControl: Number,
  startingColor: String,
  moves: [String],
  whiteTime: Number,
  blackTime: Number,
  winner: String,
  endReason: String,
  createdAt: { type: Date, default: Date.now },
  creatorColor: String,
  creatorId: String,
  whiteToken: String,
  blackToken: String
});

const Game = mongoose.model('Game', gameSchema);

app.use(express.static('public'));

// Token oluşturma fonksiyonu
function generateToken() {
  return Math.random().toString(36).substring(2, 15);
}

// Socket.io olayları
io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı');

  socket.on('getGameState', async (data) => {
    try {
      console.log('Oyun durumu isteği:', data);
      const { roomId, token } = data;
      const game = await Game.findOne({ roomId });
      if (game) {
        socket.join(roomId);
        
        // Token'a göre oyuncu rengini belirle
        let playerColor;
        if (token === game.whiteToken) {
          playerColor = 'white';
        } else if (token === game.blackToken) {
          playerColor = 'black';
        } else {
          socket.emit('error', 'Geçersiz token');
          return;
        }
        
        socket.emit('gameState', {
          roomId: game.roomId,
          timeControl: game.timeControl,
          moves: game.moves,
          whiteTime: game.whiteTime,
          blackTime: game.blackTime,
          playerColor: playerColor  // Oyuncunun rengini doğrudan gönder
        });
      }
    } catch (error) {
      console.error('Oyun durumu alma hatası:', error);
    }
  });

  socket.on('createGame', async (data) => {
    try {
      console.log('Oyun oluşturma isteği:', data);
      
      // Oyun oluşturan için token üret
      const creatorToken = Math.floor(Math.random() * 100000000).toString();
      console.log('Oluşturulan creator token:', creatorToken);
      
      const game = new Game({
        roomId: Math.random().toString(36).substring(2, 8),
        timeControl: data.timeControl,
        startingColor: data.startingColor,
        moves: [],
        whiteTime: data.timeControl,
        blackTime: data.timeControl,
        creatorColor: data.startingColor,
        creatorId: socket.id,
        whiteToken: data.startingColor === 'white' ? creatorToken : null,
        blackToken: data.startingColor === 'black' ? creatorToken : null
      });
      
      await game.save();
      socket.join(game.roomId);
      console.log('Oyun oluşturuldu. White token:', game.whiteToken, 'Black token:', game.blackToken);
      
      socket.emit('gameCreated', {
        roomId: game.roomId,
        timeControl: game.timeControl,
        playerColor: data.startingColor,
        token: creatorToken
      });
    } catch (error) {
      console.error('Oyun oluşturma hatası:', error);
    }
  });

  socket.on('joinGame', async (roomId) => {
    try {
      console.log('Oyuna katılma isteği:', roomId);
      const game = await Game.findOne({ roomId });
      if (game) {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room && room.size >= 2) {
          socket.emit('error', 'Oda dolu');
          return;
        }

        socket.join(roomId);
        console.log('Mevcut tokenler - White:', game.whiteToken, 'Black:', game.blackToken);
        
        // Rastgele token üret
        const joinerToken = Math.floor(Math.random() * 100000000).toString();
        console.log('Oluşturulan joiner token:', joinerToken);
        
        // Oyuncunun rengini belirle
        const joinerColor = game.creatorColor === 'white' ? 'black' : 'white';
        
        // Token'ı kaydet
        if (joinerColor === 'white') {
          game.whiteToken = joinerToken;
        } else {
          game.blackToken = joinerToken;
        }
        
        await game.save();
        console.log('Güncellenen tokenler - White:', game.whiteToken, 'Black:', game.blackToken);
        
        // Tüm odaya oyunun başladığını bildir
        io.to(roomId).emit('gameJoined', {
          roomId: game.roomId,
          timeControl: game.timeControl,
          moves: game.moves,
          whiteTime: game.whiteTime,
          blackTime: game.blackTime
        });
        
        // Katılan kişiye özel bilgileri gönder
        socket.emit('playerAssigned', {
          playerColor: joinerColor,
          token: joinerToken
        });
      } else {
        console.log('Oda bulunamadı:', roomId);
        socket.emit('error', 'Oda bulunamadı');
      }
    } catch (error) {
      console.error('Oyuna katılma hatası:', error);
    }
  });

  socket.on('makeMove', async (data) => {
    try {
      console.log('Hamle yapma isteği:', data);
      const { roomId, move, remainingTime, playerColor } = data;
      const game = await Game.findOne({ roomId });
      
      if (game) {
        const isWhiteTurn = game.moves.length % 2 === 0;
        const isCorrectPlayer = (isWhiteTurn && playerColor === 'white') || 
                              (!isWhiteTurn && playerColor === 'black');
        
        if (!isCorrectPlayer) {
          socket.emit('error', 'Sıra sizde değil');
          return;
        }
        
        game.moves.push(move);
        
        if (isWhiteTurn) {
          game.whiteTime = remainingTime;
        } else {
          game.blackTime = remainingTime;
        }
        
        await game.save();
        console.log('Hamle kaydedildi:', move);
        
        io.to(roomId).emit('moveMade', {
          move,
          whiteTime: game.whiteTime,
          blackTime: game.blackTime,
          currentTurn: isWhiteTurn ? 'black' : 'white'
        });
      }
    } catch (error) {
      console.error('Hamle yapma hatası:', error);
    }
  });

  socket.on('gameEnded', async (data) => {
    try {
      console.log('Oyun sonlandırma isteği:', data);
      const { roomId, winner, reason } = data;
      const game = await Game.findOne({ roomId });
      if (game) {
        game.winner = winner;
        game.endReason = reason;
        await game.save();
        console.log('Oyun sonlandırıldı:', game);
        io.to(roomId).emit('gameOver', {
          winner,
          reason
        });
      }
    } catch (error) {
      console.error('Oyun sonlandırma hatası:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı bağlantısı kesildi');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 