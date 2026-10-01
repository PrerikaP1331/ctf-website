import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage';
import VideoPage from './components/VideoPage';
import MapPage from './components/MapPage';
import ChallengePage from './components/ChallengePage';

function SessionTimer() {
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateTimer = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setSecondsRemaining(null);
        return;
      }

      try {
        const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')));
        if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp) || payload.exp - payload.iat > 60 * 60) {
          throw new Error('Session exceeds the one-hour limit');
        }
        const remaining = Math.ceil((payload.exp * 1000 - Date.now()) / 1000);
        if (!Number.isFinite(remaining) || remaining <= 0) throw new Error('Session expired');
        setSecondsRemaining(remaining);
      } catch {
        localStorage.removeItem('token');
        setSecondsRemaining(null);
        navigate('/', { replace: true });
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [navigate]);

  if (secondsRemaining === null) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="sessionTimer" role="timer" aria-label="Session time remaining">
      Session {minutes}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <SessionTimer />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/story" element={<VideoPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/challenge/:challengeId" element={<ChallengePage />} />
      </Routes>
    </div>
  );
}

export default App;
