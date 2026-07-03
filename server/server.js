const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Cấu trúc games[pin] = { hostId, players, status, questions, currentQ, startTime, answersCount }
const games = {};

function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on('connection', (socket) => {
  console.log('Kết nối:', socket.id);

  socket.on('create_game', (questions) => {
    let pin;
    do { pin = generatePIN(); } while (games[pin]);

    games[pin] = {
      hostId: socket.id,
      players: [], // { id, nickname, score, currentAnswer, isCorrect, streak }
      status: 'lobby',
      questions: questions || [],
      currentQ: 0,
      startTime: 0,
      answersCount: 0
    };
    
    socket.join(pin);
    socket.emit('game_created', pin);
  });

  socket.on('join_game', (data) => {
    const { pin, nickname } = data;
    if (games[pin] && games[pin].status === 'lobby') {
      const nameExists = games[pin].players.find(p => p.nickname.toLowerCase() === nickname.toLowerCase());
      if (nameExists) return socket.emit('join_error', 'Tên đã tồn tại!');

      const player = { id: socket.id, nickname, score: 0, currentAnswer: null, isCorrect: false };
      games[pin].players.push(player);
      socket.join(pin);
      socket.emit('joined_successfully', player);
      io.to(games[pin].hostId).emit('player_joined', player);
    } else {
      socket.emit('join_error', 'Mã PIN sai hoặc phòng đã bắt đầu!');
    }
  });

  // HOST bắt đầu câu hỏi (hoặc câu tiếp theo)
  socket.on('next_question', (pin) => {
    if (games[pin] && games[pin].hostId === socket.id) {
      if (games[pin].currentQ >= games[pin].questions.length) {
        games[pin].status = 'podium';
        io.to(pin).emit('show_podium', games[pin].players.sort((a,b) => b.score - a.score));
        return;
      }

      games[pin].status = 'question';
      games[pin].startTime = Date.now();
      games[pin].answersCount = 0;
      
      // Reset trạng thái trả lời của người chơi
      games[pin].players.forEach(p => { p.currentAnswer = null; p.isCorrect = false; });

      const q = games[pin].questions[games[pin].currentQ];
      
      // Gửi câu hỏi cho host và player (ẩn đáp án đúng với player)
      io.to(games[pin].hostId).emit('question_started', { question: q, index: games[pin].currentQ });
      io.to(pin).except(games[pin].hostId).emit('question_started', {
        time: q.time,
        index: games[pin].currentQ
      });
    }
  });

  // PLAYER gửi đáp án
  socket.on('submit_answer', (data) => {
    const { pin, answer } = data;
    const game = games[pin];
    if (game && game.status === 'question') {
      const player = game.players.find(p => p.id === socket.id);
      if (player && !player.currentAnswer) {
        player.currentAnswer = answer;
        game.answersCount++;
        
        const q = game.questions[game.currentQ];
        const timeElapsed = (Date.now() - game.startTime) / 1000;
        
        if (answer === q.correct) {
          player.isCorrect = true;
          // Điểm = Tối đa 1000, giảm dần theo thời gian
          const timeScore = Math.max(0, 1 - (timeElapsed / q.time));
          const earned = Math.round(500 + (500 * timeScore));
          player.score += earned;
        }

        io.to(game.hostId).emit('answer_received', game.answersCount);
        
        // Nếu tất cả đã trả lời
        if (game.answersCount === game.players.length) {
           io.to(game.hostId).emit('all_answered');
        }
      }
    }
  });

  // HOST yêu cầu hiển thị đáp án và bảng xếp hạng câu hỏi
  socket.on('show_results', (pin) => {
    if (games[pin] && games[pin].hostId === socket.id) {
      games[pin].status = 'leaderboard';
      const q = games[pin].questions[games[pin].currentQ];
      
      // Thống kê số người chọn A,B,C,D
      const stats = { A:0, B:0, C:0, D:0 };
      games[pin].players.forEach(p => {
        if (p.currentAnswer) stats[p.currentAnswer]++;
      });

      // Báo cho host kết quả
      socket.emit('results_data', { stats, correct: q.correct, players: games[pin].players });
      
      // Báo cho player họ đúng hay sai
      games[pin].players.forEach(p => {
        io.to(p.id).emit('question_result', { isCorrect: p.isCorrect, score: p.score, correctAns: q.correct });
      });

      games[pin].currentQ++; // Chuẩn bị câu tiếp theo
    }
  });

  socket.on('disconnect', () => {
    for (const pin in games) {
      if (games[pin].hostId === socket.id) {
        io.to(pin).emit('host_disconnected');
        delete games[pin];
      } else {
        const index = games[pin].players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          const removed = games[pin].players.splice(index, 1)[0];
          io.to(games[pin].hostId).emit('player_left', removed);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
