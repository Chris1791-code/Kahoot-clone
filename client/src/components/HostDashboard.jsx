import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function HostDashboard({ socket }) {
  const [pin, setPin] = useState(null);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState('setup'); // setup, lobby, question, leaderboard, podium
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    socket.on('game_created', (newPin) => {
      setPin(newPin);
      setStatus('lobby');
    });

    socket.on('player_joined', (player) => {
      setPlayers((prev) => [...prev, player]);
    });

    socket.on('player_left', (player) => {
      setPlayers((prev) => prev.filter(p => p.id !== player.id));
    });

    socket.on('question_started', (data) => {
      setCurrentQ(data.question);
      setStatus('question');
    });

    socket.on('all_answered', () => {
      // Automatically show results if everyone answered
      socket.emit('show_results', pin);
    });

    socket.on('results_data', (data) => {
      setResults(data);
      // Update players state with new scores
      setPlayers(data.players);
      setStatus('leaderboard');
    });

    socket.on('show_podium', (finalPlayers) => {
      setPlayers(finalPlayers);
      setStatus('podium');
    });

    return () => {
      socket.off('game_created');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('question_started');
      socket.off('all_answered');
      socket.off('results_data');
      socket.off('show_podium');
    };
  }, [socket, pin]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Map format: Question | A | B | C | D | Correct (A,B,C,D) | Time (s)
      const formattedQs = data.map(row => ({
        text: row.Question || row.Câu_hỏi,
        A: row.A,
        B: row.B,
        C: row.C,
        D: row.D,
        correct: (row.Correct || row.Đáp_án).toString().toUpperCase().trim(),
        time: parseInt(row.Time || row.Thời_gian || 20)
      }));
      setQuestions(formattedQs);
    };
    reader.readAsBinaryString(file);
  };

  const handleCreateGame = () => {
    if (questions.length === 0) return alert('Vui lòng tải lên file Excel câu hỏi trước!');
    socket.emit('create_game', questions);
  };

  const handleNext = () => {
    socket.emit('next_question', pin);
  };

  const handleSkipTime = () => {
    socket.emit('show_results', pin);
  };

  // SOUND SYSTEM
  useEffect(() => {
    if (status === 'lobby') playSound('lobby');
    if (status === 'question') playSound('question');
    if (status === 'leaderboard') playSound('leaderboard');
    if (status === 'podium') playSound('podium');
  }, [status]);

  const playSound = (type) => {
    // Để âm thanh hoạt động, bạn cần bỏ các file lobby.mp3, question.mp3 vào thư mục public/
    // Code này sẽ tự tìm thẻ audio và play
    const audio = document.getElementById(`audio-${type}`);
    if (audio) {
      document.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
      audio.play().catch(e => console.log('Autoplay blocked by browser'));
    }
  };


  if (status === 'setup') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bk-offwhite p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border-t-8 border-bk-navy">
          <h2 className="text-2xl font-bold text-bk-navy mb-4">Tạo phòng Quiz mới</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Tải lên file Excel (.xlsx). Các cột bắt buộc: <br/>
            <strong>Question, A, B, C, D, Correct, Time</strong>
          </p>
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="mb-6 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bk-sky file:text-bk-navy hover:file:bg-bk-gold transition-colors"
          />
          {questions.length > 0 && (
            <p className="text-green-600 font-bold mb-4">Đã tải {questions.length} câu hỏi!</p>
          )}
          <button 
            onClick={handleCreateGame}
            disabled={questions.length === 0}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${questions.length > 0 ? 'bg-bk-sunrise hover:scale-105' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Tạo phòng ngay
          </button>
        </div>
      </div>
    );
  }

  if (status === 'lobby') {
    return (
      <div className="flex-1 flex flex-col p-8 bg-bk-offwhite">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-lg border-b-4 border-bk-navy">
          <div>
            <h2 className="text-gray-500 font-semibold mb-1">Mã phòng của bạn:</h2>
            <div className="text-6xl font-black tracking-widest text-bk-navy">{pin}</div>
          </div>
          <button 
            onClick={handleNext}
            disabled={players.length === 0}
            className={`px-8 py-4 text-2xl font-bold rounded-xl shadow-md ${players.length > 0 ? 'bg-bk-sunrise text-white hover:scale-105' : 'bg-gray-300 text-gray-500'}`}
          >
            Bắt đầu Game
          </button>
        </div>
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-bk-navy mb-4">Người chơi ({players.length})</h3>
          <div className="flex flex-wrap gap-4">
            {players.map(p => (
              <motion.div key={p.id} initial={{scale:0}} animate={{scale:1}} className="bg-bk-sky text-bk-navy font-bold px-6 py-3 rounded-lg shadow-sm text-xl">{p.nickname}</motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'question' && currentQ) {
    return (
      <div className="flex-1 flex flex-col p-8 bg-bk-offwhite">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center mb-8 border-b-8 border-bk-navy">
          <h1 className="text-4xl font-bold text-bk-navy">{currentQ.text}</h1>
        </div>
        <div className="flex justify-between mb-4">
          <div className="w-16 h-16 rounded-full bg-bk-navy text-white flex items-center justify-center text-2xl font-bold">{currentQ.time}s</div>
          <button onClick={handleSkipTime} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-400">Bỏ qua / Hiển thị đáp án</button>
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-bk-sunrise rounded-xl flex items-center p-6 text-white text-2xl font-bold shadow-md"><span className="mr-4">A:</span> {currentQ.A}</div>
          <div className="bg-bk-sky rounded-xl flex items-center p-6 text-white text-2xl font-bold shadow-md"><span className="mr-4">B:</span> {currentQ.B}</div>
          <div className="bg-bk-gold rounded-xl flex items-center p-6 text-white text-2xl font-bold shadow-md"><span className="mr-4">C:</span> {currentQ.C}</div>
          <div className="bg-bk-coral rounded-xl flex items-center p-6 text-white text-2xl font-bold shadow-md"><span className="mr-4">D:</span> {currentQ.D}</div>
        </div>
      </div>
    );
  }

  if (status === 'leaderboard' && results) {
    // Sắp xếp top 10
    const topPlayers = [...results.players].sort((a,b) => b.score - a.score).slice(0, 10);
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bk-offwhite">
        <h2 className="text-4xl font-bold text-bk-navy mb-8">Bảng Xếp Hạng Top 10</h2>
        <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-xl mb-8">
          {topPlayers.map((p, idx) => (
            <div key={p.id} className="flex justify-between items-center py-4 border-b last:border-0">
              <span className="text-2xl font-bold text-gray-700"><span className="text-bk-coral mr-4">#{idx+1}</span>{p.nickname}</span>
              <span className="text-2xl font-bold text-bk-navy">{p.score} pt</span>
            </div>
          ))}
        </div>
        <button onClick={handleNext} className="bg-bk-sunrise text-white px-8 py-4 text-2xl font-bold rounded-xl hover:scale-105 shadow-md transition-transform">
          Tiếp theo
        </button>
      </div>
    );
  }

  if (status === 'podium') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bk-navy text-white">
        <h1 className="text-6xl font-black text-bk-gold mb-12">BỤC VINH QUANG</h1>
        <div className="flex items-end gap-4 h-64">
          {players[1] && (
             <div className="w-32 bg-gray-300 h-2/3 rounded-t-lg flex flex-col items-center p-4">
               <span className="text-bk-navy font-bold text-xl">{players[1].nickname}</span>
               <span className="text-bk-navy text-3xl font-black">2</span>
             </div>
          )}
          {players[0] && (
             <div className="w-32 bg-bk-gold h-full rounded-t-lg flex flex-col items-center p-4 shadow-[0_0_30px_rgba(255,209,102,0.5)]">
               <span className="text-bk-navy font-bold text-2xl">{players[0].nickname}</span>
               <span className="text-bk-navy text-5xl font-black mt-2">1</span>
               <span className="text-bk-navy font-bold mt-4">{players[0].score}</span>
             </div>
          )}
          {players[2] && (
             <div className="w-32 bg-orange-400 h-1/2 rounded-t-lg flex flex-col items-center p-4">
               <span className="text-bk-navy font-bold text-lg">{players[2].nickname}</span>
               <span className="text-bk-navy text-2xl font-black mt-2">3</span>
             </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
