// // client/src/components/MapPage.js

// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import styles from './MapPage.module.css';

// // Assets
// import mapBackgroundImage from '../images/pixel-map.jpg';
// import flagRed from '../icons/flag-red.gif';
// import flagGreen from '../icons/flag-green.gif';
// import speechBubbleIcon from '../icons/speech-bubble.png';
// import homeIcon from '../icons/home.png';
// import cheatsheetIcon from '../icons/cheatsheet.png';
// import nisbCsLogo from '../icons/cs-logo.png';

// function MapPage() {
//   const [challenges, setChallenges] = useState([]);
//   const [solvedChallengeIds, setSolvedChallengeIds] = useState([]);
//   const [attemptsMap, setAttemptsMap] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();
//   const [activeInfoBox, setActiveInfoBox] = useState(null);

//   useEffect(() => {
//     const fetchMapData = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = {};
//         if (token) headers['Authorization'] = `Bearer ${token}`;

//         const response = await fetch('http://localhost:5000/api/map-data', { headers });
//         const data = await response.json();

//         if (data.success) {
//           setChallenges(data.challenges);
//           setSolvedChallengeIds(data.solvedChallengeIds);
//           setAttemptsMap(data.attemptsMap);
//         }
//       } catch (error) {
//         console.error('Failed to fetch map data:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchMapData();
//   }, []);

//   const handleFlagClick = (challengeId) => {
//     navigate(`/challenge/${challengeId}`);
//   };

//   const handleInfoClick = (challenge) => {
//     const attempts = attemptsMap[challenge.challengeId] || 0;
//     alert(
//       `Status for "${challenge.name}":\n\n` +
//       `Difficulty: ${challenge.difficulty}\n` +
//       `Status: ${solvedChallengeIds.includes(challenge.challengeId) ? 'Solved' : 'Unsolved'}\n` +
//       `Attempts: ${attempts}`
//     );
//   };

//   if (isLoading) return <div>Loading Map...</div>;

//   return (
//     <div className={styles.pageWrapper}>
//       <div
//         className={styles.background}
//         style={{ backgroundImage: `url(${mapBackgroundImage})` }}
//       />
//       <div className={styles.content}>
//         <h1 className={styles.header}>Challenge Map</h1>

//         {challenges.map((challenge) => {
//           const isSolved = solvedChallengeIds.includes(challenge.challengeId);
//           return (
//             <div
//               key={challenge.challengeId}
//               className={styles.challengePoint}
//               style={{ top: challenge.position.top, left: challenge.position.left }}
//             >
//               <img
//                 src={isSolved ? flagGreen : flagRed}
//                 alt={`Challenge: ${challenge.name}`}
//                 className={styles.flagIcon}
//                 onClick={() => handleFlagClick(challenge.challengeId)}
//               />
//               <img
//                 src={speechBubbleIcon}
//                 alt="Challenge Info"
//                 className={styles.infoIcon}
//                 onClick={() => handleInfoClick(challenge)}
//               />
//             </div>
//           );
//         })}

//         <div className={styles.legend}>
//           <h3>Legend</h3>
//           <Link to="/map" className={styles.legendItem}>
//             <span
//               className={styles.icon}
//               style={{ backgroundImage: `url(${homeIcon})` }}
//             />
//             <span>Home</span>
//           </Link>
//           {/* Leaderboard removed */}
//           <a
//             href="/cheatsheet"
//             target="_blank"
//             rel="noopener noreferrer"
//             className={styles.legendItem}
//           >
//             <span
//               className={styles.icon}
//               style={{ backgroundImage: `url(${cheatsheetIcon})` }}
//             />
//             <span>Cheatsheet</span>
//           </a>
//         </div>

//         <div className={styles.bottomleft}>
//         <img src={nisbCsLogo} alt="NISB CS Logo" className={styles.logo} />
//         <span className={styles.ctfTitle}>RUBIX CTF 2.0</span>
//        </div>

//       </div>
//     </div>
//   );
// }

// export default MapPage;

// client/src/components/MapPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './MapPage.module.css';

// Assets
import mapBackgroundImage from '../images/pixel-map.jpg';
import flagRed from '../icons/flag-red.gif';
import flagGreen from '../icons/flag-green.gif';
import speechBubbleIcon from '../icons/speech-bubble.png';
import homeIcon from '../icons/home.png';
import cheatsheetIcon from '../icons/cheatsheet.png';
import nisbCsLogo from '../icons/cs-logo.png';

function MapPage() {
  const [challenges, setChallenges] = useState([]);
  const [solvedChallengeIds, setSolvedChallengeIds] = useState([]);
  const [attemptsMap, setAttemptsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [activeInfoBox, setActiveInfoBox] = useState(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('http://localhost:5000/api/map-data', { headers });
        const data = await response.json();

        if (data.success) {
          setChallenges(data.challenges);
          setSolvedChallengeIds(data.solvedChallengeIds);
          setAttemptsMap(data.attemptsMap);
        }
      } catch (error) {
        console.error('Failed to fetch map data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMapData();
  }, []);

  const handleFlagClick = (challengeId) => {
    navigate(`/challenge/${challengeId}`);
  };

  const handleInfoClick = (challengeId) => {
    if (activeInfoBox === challengeId) {
      // If the user clicks the icon for the box that is already open, close it.
      setActiveInfoBox(null);
    } else {
      // Otherwise, open the box for the clicked challenge.
      setActiveInfoBox(challengeId);
    }
  };

  if (isLoading) return <div>Loading Map...</div>;

  return (
    <div className={styles.pageWrapper}>
      <div
        className={styles.background}
        style={{ backgroundImage: `url(${mapBackgroundImage})` }}
      />
      <div className={styles.content}>
        <h1 className={styles.header}>Challenge Map</h1>

        {challenges.map((challenge) => {
          const isSolved = solvedChallengeIds.includes(challenge.challengeId);
          return (
            <div
              key={challenge.challengeId}
              className={`${styles.challengePoint} ${activeInfoBox === challenge.challengeId ? styles.active : ''}`}
              style={{ top: challenge.position.top, left: challenge.position.left }}
            >
              <img
                src={isSolved ? flagGreen : flagRed}
                alt={`Challenge: ${challenge.name}`}
                className={styles.flagIcon}
                onClick={() => handleFlagClick(challenge.challengeId)}
              />
              <img
                src={speechBubbleIcon}
                alt="Challenge Info"
                className={styles.infoIcon}
                onClick={() => handleInfoClick(challenge.challengeId)}
              />
              {/* This is the new part that renders the info box */}
              {activeInfoBox === challenge.challengeId && (
                <div className={styles.infoBox}>
                  <h4>{challenge.name}</h4>
                  <p>Difficulty: {challenge.difficulty}</p>
                  <p>Status: {isSolved ? "Solved" : "Unsolved"}</p>
                  <p>Attempts: {attemptsMap[challenge.challengeId] || 0}</p>
                </div>
              )}
            </div>
          );
        })}

        <div className={styles.legend}>
          <h3>Legend</h3>
          <Link to="/map" className={styles.legendItem}>
            <span
              className={styles.icon}
              style={{ backgroundImage: `url(${homeIcon})` }}
            />
            <span>Home</span>
          </Link>
          {/* Leaderboard removed */}
          <a
            href="https://drive.google.com/drive/folders/1BUNbkVoGFlAfkQSRIzzfNNqCcYnojjM0?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.legendItem}
          >
            <span
              className={styles.icon}
              style={{ backgroundImage: `url(${cheatsheetIcon})` }}
            />
            <span>Cheatsheet</span>
          </a>
        </div>

        <div className={styles.bottomleft}>
        <img src={nisbCsLogo} alt="NISB CS Logo" className={styles.logo} />
        <span className={styles.ctfTitle}>RUBIX CTF 2.0</span>
       </div>

      </div>
    </div>
  );
}

export default MapPage;

