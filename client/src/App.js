import { Routes, Route } from 'react-router-dom';
import './App.css';
import LoginPage from './components/LoginPage';
import VideoPage from './components/VideoPage';
import MapPage from './components/MapPage';
import ChallengePage from './components/ChallengePage';

function App() {
  return (
    <div className="App">
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
