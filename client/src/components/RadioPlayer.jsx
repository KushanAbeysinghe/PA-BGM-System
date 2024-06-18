import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const RadioPlayer = () => {
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));

  useEffect(() => {
    axios.get('http://localhost:5000/tracks')
      .then(response => {
        setTracks(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the tracks!', error);
      });

    axios.get('http://localhost:5000/schedule')
      .then(response => {
        setSchedule(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the schedule!', error);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setCurrentTime(now);
      const scheduledTrack = schedule.find(track => track.time === now);
      if (scheduledTrack) {
        playScheduledTrack(scheduledTrack.track);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  const handlePlay = () => {
    audioRef.current.play();
  };

  const handleMute = () => {
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(!isMuted);
  };

  const playScheduledTrack = (track) => {
    console.log('Attempting to play track:', track);
    fadeOut(audioRef.current, () => {
      trackRef.current.src = `http://localhost:5000/upload/${track}`;
      console.log('Track source set to:', trackRef.current.src);
      trackRef.current.load();
      trackRef.current.oncanplaythrough = () => {
        trackRef.current.play().catch(error => {
          console.error('Error playing track:', error);
        });
      };
      trackRef.current.onended = () => {
        fadeIn(audioRef.current);
        audioRef.current.play();
      };
    });
  };

  const fadeOut = (audio, callback) => {
    let volume = 1.0;
    const fadeAudio = setInterval(() => {
      if (volume > 0.1) {
        volume -= 0.1;
        audio.volume = volume;
      } else {
        clearInterval(fadeAudio);
        audio.volume = 0;
        callback();
      }
    }, 200);
  };

  const fadeIn = (audio) => {
    let volume = 0;
    const fadeAudio = setInterval(() => {
      if (volume < 0.9) {
        volume += 0.1;
        audio.volume = volume;
      } else {
        clearInterval(fadeAudio);
        audio.volume = 1.0;
      }
    }, 200);
  };

  const handleAddTrack = () => {
    const newSchedule = { track: newTrack, time: newTime };
    const updatedSchedule = [...schedule, newSchedule];
    setSchedule(updatedSchedule);
    axios.post('http://localhost:5000/schedule', updatedSchedule)
      .then(response => {
        console.log('Schedule saved to server');
      })
      .catch(error => {
        console.error('Error saving schedule to server', error);
      });
    setNewTrack('');
    setNewTime('');
  };

  return (
    <div className="radio-player">
      <h1>Online Radio Player</h1>
      <audio ref={audioRef} src="https://altair.streamerr.co/stream/8014" preload="none"></audio>
      <audio ref={trackRef} preload="none"></audio>
      <button onClick={handlePlay}>Live</button>
      <button onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>

      <h2>Current Time: {currentTime}</h2>

      <h2>Schedule Tracks</h2>
      <input 
        type="text" 
        placeholder="Enter time (HH:MM:SS)" 
        value={newTime} 
        onChange={(e) => setNewTime(e.target.value)} 
      />
      <select value={newTrack} onChange={(e) => setNewTrack(e.target.value)}>
        <option value="">Select Track</option>
        {tracks.map((track, index) => (
          <option key={index} value={track}>{track}</option>
        ))}
      </select>
      <button onClick={handleAddTrack}>Add</button>

      <h2>Scheduled Tracks</h2>
      <ul>
        {schedule.map((item, index) => (
          <li key={index}>{item.time} - {item.track}</li>
        ))}
      </ul>
    </div>
  );
};

export default RadioPlayer;
