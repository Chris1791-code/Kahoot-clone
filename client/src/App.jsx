import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PlayerView from './components/PlayerView';
import HostDashboard from './components/HostDashboard';
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Kết nối tới server Socket.io (chạy ở cổng 3001)
const socket = io('https://kahoot-clone-ozy2.onrender.com/');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Header chung có Logo ĐHBK */}
        <header className="bg-bk-navy p-4 flex justify-center items-center shadow-md">
          <h1 className="text-white text-2xl font-bold tracking-wider flex items-center gap-3">
            <span className="text-bk-gold">ĐHBK</span> 
            <span className="text-bk-sky font-light">| Quiz</span>
          </h1>
        </header>

        {/* Nội dung thay đổi theo Route */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/play/:pin" element={<PlayerView socket={socket} />} />
            <Route path="/host" element={<HostDashboard socket={socket} />} />
          </Routes>
        </main>
        
        {/* Footer hiển thị trạng thái kết nối */}
        <footer className="p-2 text-center text-sm text-gray-500">
          Status: {isConnected ? <span className="text-green-500">Connected</span> : <span className="text-red-500">Disconnected</span>}
        </footer>
      </div>
    </Router>
  );
}

export default App;
