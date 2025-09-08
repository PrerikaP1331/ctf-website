import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './VideoPage.module.css';

function VideoPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null); 
  const [isPlaying, setIsPlaying] = useState(true); 

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pause(); 
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying); 
  };

  const handleSkip = () => {
    navigate('/map');
  };

  return (
    <div className={styles.videoContainer}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef} 
          className={styles.videoPlayer}
          src="/videos/story-video.mp4" 
          autoPlay
          muted
          onEnded={handleSkip}
        />

        <div className={styles.controlsContainer}>
          {isPlaying ? (
            <img
              src="/icons/pause.png" 
              alt="Pause"
              className={styles.controlButton}
              onClick={togglePlayPause}
            />
          ) : (
            <img
              src="/icons/play.png" 
              alt="Play"
              className={styles.controlButton}
              onClick={togglePlayPause}
            />
          )}

          <img
            src="/icons/skip.png" 
            alt="Skip"
            className={styles.controlButton}
            onClick={handleSkip}
          />
        </div>
      </div>
    </div>
  );
}

export default VideoPage;