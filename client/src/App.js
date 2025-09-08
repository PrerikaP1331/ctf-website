// client/src/App.js

import { Routes, Route } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage.js';
import VideoPage from './components/VideoPage.js';
import MapPage from './components/MapPage.js';
import ChallengePage from './components/ChallengePage.js'; 
import LeaderboardPage from './components/LeaderboardPage.js';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/story" element={<VideoPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/challenge/:challengeId" element={<ChallengePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} /> 
      </Routes>
    </div>
  );
}

export default App;