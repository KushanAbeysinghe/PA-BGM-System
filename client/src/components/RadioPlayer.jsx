import React, { useState, useEffect, useRef } from 'react';
import ReactAudioPlayer from 'react-audio-player';
import axios from 'axios';
import './RadioPlayer.css';

const RadioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [customTracks, setCustomTracks] = useState([]);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    const fetchTracks = async () => {
      const result = await axios.get('http://localhost:5000/tracks');
      setCustomTracks(result.data);
    };

    fetchTracks();

    const checkTracks = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      customTracks.forEach(track => {
        if (track.timestamp === currentTime) {
          playCustomTrack(track.trackName);
        }
      });
    }, 1000);

    return () => clearInterval(checkTracks);
  }, [customTracks]);

  const playCustomTrack = trackName => {
    const audio = new Audio(`/uploads/${trackName}`);
    audio.play();
    audioPlayerRef.current.audioEl.current.pause();
    audio.addEventListener('ended', () => {
      audioPlayerRef.current.audioEl.current.play();
    });
  };

  return (
    <div className="radio-player">
      <ReactAudioPlayer
        src="https://altair.streamerr.co/stream/8014"
        autoPlay
        controls
        ref={audioPlayerRef}
      />
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Mute' : 'Unmute'}
      </button>
    </div>
  );
};

export default RadioPlayer;
