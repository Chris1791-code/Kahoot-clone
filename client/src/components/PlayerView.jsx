import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PlayerView({ socket }) {
  const location = useLocation();
  const navigate = useNavigate();
  const player = location.state?.player;
  
  const [status, setStatus] = useState('lobby'); // lobby, playing, answered, result
  const [score, setScore] = useState(player?.score || 0);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!player) {
      navigate('/');
      return;
    }

    socket.on('question_started', () => {
      setStatus('playing');
      setResultData(null);
    });

    socket.on('question_result', (data) => {
      setResultData(data);
      setScore(data.score);
      setStatus('result');
    });

    socket.on('host_disconnected', () => {
      alert('Host đã ngắt kết nối. Trò chơi kết thúc!');
      navigate('/');
    });

    return () => {
      socket.off('question_started');
      socket.off('question_result');
      socket.off('host_disconnected');
    };
  }, [socket, player, navigate]);

  const handleAnswer = (ans) => {
    const pin = location.state?.pin;
    socket.emit('submit_answer', { pin, answer: ans });
    setStatus('answered');
  };

  if (!player) return null;

  if (status === 'lobby') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-bk-sky text-bk-navy">
        <h2 className="text-3xl font-bold mb-4 text-center">Bạn đã vào phòng!</h2>
        <p className="text-xl mb-8">Tên của bạn: <strong className="text-white bg-bk-navy px-3 py-1 rounded-md">{player.nickname}</strong></p>
        <p className="mt-4 font-medium text-lg text-center">Đang chờ Host bắt đầu trò chơi...</p>
      </div>
    );
  }

  if (status === 'result' && resultData) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-4 text-white ${resultData.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
        <motion.h1 initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl font-black mb-4">
          {resultData.isCorrect ? 'ĐÚNG!' : 'SAI!'}
        </motion.h1>
        {!resultData.isCorrect && <p className="text-2xl mb-8">Đáp án đúng là: {resultData.correctAns}</p>}
        <div className="bg-white/20 p-6 rounded-2xl text-center">
          <p className="text-xl">Điểm hiện tại</p>
          <p className="text-5xl font-bold">{score}</p>
        </div>
        <p className="mt-8">Đang đợi câu tiếp theo...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="text-center mb-6">
        <p className="text-gray-500 font-semibold">{player.nickname}</p>
        <div className="bg-white inline-block px-4 py-1 rounded-full shadow-sm text-bk-navy font-bold">
          Điểm: {score}
        </div>
      </div>

      {status === 'playing' ? (
        <div className="flex-1 grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
          <button onClick={() => handleAnswer('A')} className="bg-bk-sunrise text-white text-5xl font-bold rounded-xl shadow-md active:scale-95 transition-transform">A</button>
          <button onClick={() => handleAnswer('B')} className="bg-bk-sky text-white text-5xl font-bold rounded-xl shadow-md active:scale-95 transition-transform">B</button>
          <button onClick={() => handleAnswer('C')} className="bg-bk-gold text-white text-5xl font-bold rounded-xl shadow-md active:scale-95 transition-transform">C</button>
          <button onClick={() => handleAnswer('D')} className="bg-bk-coral text-white text-5xl font-bold rounded-xl shadow-md active:scale-95 transition-transform">D</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl font-bold text-bk-navy text-center">
            Đã lưu câu trả lời! <br/> Đang đợi những người khác...
          </motion.div>
        </div>
      )}
    </div>
  );
}
