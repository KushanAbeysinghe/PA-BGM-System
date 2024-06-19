import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RadioPlayer = () => {
  const { id } = useParams();
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [radioUrl, setRadioUrl] = useState('');
  const [radioName, setRadioName] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [isAlarmBlocked, setIsAlarmBlocked] = useState(false);

  useEffect(() => {
    fetchRadioProfile();
    fetchSchedule();
  }, []);

  const fetchRadioProfile = () => {
    axios.get(`http://localhost:5000/radiostreams/${id}`)
      .then(response => {
        const radioProfile = response.data;
        if (radioProfile) {
          setRadioUrl(radioProfile.url);
          setRadioName(radioProfile.name);
          setIsBlocked(radioProfile.blocked);
          setIsAlarmBlocked(radioProfile.alarmBlocked);
        }
      })
      .catch(error => {
        console.error('There was an error fetching the radio profile!', error);
      });
  };

  const fetchSchedule = () => {
    axios.get(`http://localhost:5000/radio/${id}/schedule`)
      .then(response => {
        setSchedule(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the schedule!', error);
      });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
      setCurrentTime(now);
      if (!isAlarmBlocked) {
        const scheduledTrack = schedule.find(track => track.time === now);
        if (scheduledTrack) {
          playScheduledTrack(scheduledTrack.track);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [schedule, isAlarmBlocked]);

  const handlePlay = () => {
    if (!isBlocked) {
      audioRef.current.play();
    }
  };

  const handleMute = () => {
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(!isMuted);
  };

  const playScheduledTrack = (track) => {
    if (isBlocked || isAlarmBlocked) return;

    console.log('Attempting to play track:', track);
    fadeOut(audioRef.current, () => {
      trackRef.current.src = `http://localhost:5000/uploads/${track}`;
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

  return (
    <div className="radio-player">
      <h1>{radioName}</h1>
      {isBlocked ? (
        <p>This radio profile is blocked.</p>
      ) : (
        <>
          <audio ref={audioRef} src={radioUrl} preload="none"></audio>
          <audio ref={trackRef} preload="none"></audio>
          <button onClick={handlePlay}>Live</button>
          <button onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>

          <h2>Current Time: {currentTime}</h2>

          {isAlarmBlocked ? (
            <p>The alarm system is blocked.</p>
          ) : (
            <>
              <h2>Scheduled Tracks</h2>
              <ul>
                {schedule.map((item, index) => (
                  <li key={index}>{item.time} - {item.track}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RadioPlayer;
