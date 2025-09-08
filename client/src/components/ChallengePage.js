// client/src/components/ChallengePage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './ChallengePage.module.css';

// === IMPORT ALL ASSETS FROM THE SRC FOLDER ===
import forestBg from '../images/background-forest.gif';
import butterflyIcon from '../icons/butterfly.gif';
import speechBubbleIcon from '../icons/speech-bubble.png';
import homeIcon from '../icons/home.png';
import leaderboardIcon from '../icons/leaderboard.png';
import cheatsheetIcon from '../icons/cheatsheet.png';
// ==========================================

function ChallengePage() {
  const { challengeId } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [showWebshell, setShowWebshell] = useState(false);
  const [flagInput, setFlagInput] = useState('');

  useEffect(() => {
    const fetchChallenge = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/challenge/${challengeId}`);
        const data = await response.json();
        if (data.success) {
          setChallenge(data.challenge);
        } else {
          navigate('/map');
        }
      } catch (error) {
        console.error("Failed to fetch challenge:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenge();
  }, [challengeId, navigate]);

  const handleFlagSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You are not logged in!");
      return navigate('/');
    }
    try {
      const response = await fetch('http://localhost:5000/api/challenge/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          flag: flagInput
        })
      });
      const data = await response.json();
      alert(data.message);
      if (data.success && data.message !== "Already solved!") {
        navigate('/map');
      }
    } catch (error) {
      console.error("Error submitting flag:", error);
      alert("An error occurred.");
    }
  };

  if (isLoading) return <div>Loading Challenge...</div>;
  if (!challenge) return <div>Challenge not found.</div>;

  return (
    <div className={styles.pageContainer} style={{ backgroundImage: `url(${forestBg})` }}>
      <div className={styles.mainContent}>
        {/* Challenge Info Box */}
        <div className={styles.challengeBox}>
          <h1>{challenge.name}</h1>
          <div className={styles.header}>
            <span>{challenge.category}</span>
            <span>{challenge.difficulty}</span>
          </div>
          <p className={styles.description}>{challenge.description}</p>
          <a href="/files/placeholder.zip" download className={styles.downloadLink}>
            &lt;&lt;Downloadable file&gt;&gt;
          </a>
          <form onSubmit={handleFlagSubmit} className={styles.flagForm}>
            <input
              type="text"
              className={styles.flagInput}
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              placeholder="flag{...}"
            />
            <button type="submit" className={styles.submitButton}>Submit</button>
          </form>
        </div>

        {/* Hint Area */}
        <div className={styles.hintArea}>
          <div
            className={styles.mascotContainer}
            onClick={() => setShowHint(!showHint)}
          >
            <img
              src={butterflyIcon}
              alt="Hint Mascot"
              className={styles.hintMascot}
            />
            <img
              src={speechBubbleIcon}
              alt="Show Hint"
              className={styles.speechBubble}
            />
          </div>
          {showHint && (
            <div className={styles.hintBox}>
              <strong>Hint:</strong> This is a placeholder hint. You might want to use a specific tool. Check the cheatsheet!
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <h3>Legend</h3>
          <Link to="/map" className={styles.legendItem}>
            <span className={styles.icon} style={{ backgroundImage: `url(${homeIcon})` }}></span>
            <span>Home</span>
          </Link>
          <a href="/leaderboard" target="_blank" rel="noopener noreferrer" className={styles.legendItem}>
            <span className={styles.icon} style={{ backgroundImage: `url(${leaderboardIcon})` }}></span>
            <span>Leaderboard</span>
          </a>
          <a href="/cheatsheet" target="_blank" rel="noopener noreferrer" className={styles.legendItem}>
            <span className={styles.icon} style={{ backgroundImage: `url(${cheatsheetIcon})` }}></span>
            <span>Cheatsheet</span>
          </a>
        </div>
      </div>

      {/* Webshell Toggle and Container */}
      <div className={styles.webshellToggle} onClick={() => setShowWebshell(!showWebshell)}>
        Open Webshell
      </div>
      <div className={`${styles.webshellContainer} ${showWebshell ? styles.visible : ''}`}>
        <h2>Webshell</h2>
        <p>Terminal will be loaded here.</p>
        <button onClick={() => setShowWebshell(false)}>X</button>
      </div>
    </div>
  );
}

export default ChallengePage;