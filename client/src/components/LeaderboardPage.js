// client/src/components/LeaderboardPage.js

import React, { useState, useEffect } from 'react';
import styles from './LeaderboardPage.module.css';

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/leaderboard');
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []); // Empty array means this runs once on mount

  if (isLoading) {
    return <div>Loading Leaderboard...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Leaderboard</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((team, index) => (
            <tr key={team._id}>
              <td>{index + 1}</td>
              <td>{team.username}</td>
              <td>{team.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeaderboardPage;