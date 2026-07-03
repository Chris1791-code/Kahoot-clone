import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home({ socket }) {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('joined_successfully', (player) => {
      navigate(`/play/${pin}`, { state: { player, pin } });
    });

    socket.on('join_error', (msg) => {
      setError(msg);
    });

    return () => {
      socket.off('joined_successfully');
      socket.off('join_error');
    };
  }, [socket, navigate, pin]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!pin || !nickname) {
      setError('Vui lòng nhập đầy đủ PIN và Tên!');
      return;
    }
    setError('');
    socket.emit('join_game', { pin, nickname });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border-t-8 border-bk-coral"
      >
        <h2 className="text-2xl font-bold mb-6 text-bk-navy">Tham gia trò chơi</h2>
        
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Mã PIN (Ví dụ: 123456)"
            className="p-3 text-center text-xl border-2 border-gray-200 rounded-lg focus:border-bk-sky focus:outline-none transition-colors"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tên của bạn (Nickname)"
            className="p-3 text-center text-xl border-2 border-gray-200 rounded-lg focus:border-bk-sky focus:outline-none transition-colors"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          
          <button 
            type="submit"
            className="mt-2 bg-bk-navy hover:bg-bk-sky text-white text-xl font-bold py-4 rounded-lg transition-colors shadow-md"
          >
            Vào phòng!
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-gray-100">
          <button 
            onClick={() => navigate('/host')}
            className="text-bk-sunrise font-medium hover:underline"
          >
            Tạo phòng mới (Dành cho Host)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
