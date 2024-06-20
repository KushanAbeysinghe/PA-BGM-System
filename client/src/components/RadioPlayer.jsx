import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

const RadioPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tracks, setTracks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchRadioProfile();
    fetchTracks();
    fetchSchedule();
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
  }, [schedule, profile]);

  useEffect(() => {
    if (!profile) return;

    const audioElement = audioRef.current;

    const playStream = () => {
      if (!audioElement) return;

      setIsLoading(true);
      audioElement.src = profile.url;
      audioElement.load();
      audioElement.play().then(() => {
        setIsLoading(false);
      }).catch(error => {
        console.error('Error attempting to play the stream:', error);
        setIsLoading(true);
        setErrorMessage('Radio is not found');
        setTimeout(playStream, 5000);
      });
    };

    const handleAudioError = () => {
      console.error('Stream error, attempting to reload the stream...');
      setErrorMessage('Radio is not found');
      playStream();
    };

    const handleOnline = () => {
      console.log('Internet connection restored, refreshing the page...');
      setIsOnline(true);
      window.location.reload(true);
    };

    const handleOffline = () => {
      console.log('Internet connection lost.');
      setIsOnline(false);
    };

    playStream();

    audioElement.addEventListener('error', handleAudioError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    audioElement.muted = false;
    setIsMuted(false);

    return () => {
      audioElement.removeEventListener('error', handleAudioError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [profile]);

  const fetchRadioProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/radiostreams/${id}`);
      setProfile(response.data);
    } catch (error) {
      console.error('There was an error fetching the radio profile!', error);
    }
  };

  const fetchTracks = () => {
    axios.get(`http://localhost:5000/radio/${id}/tracks`)
      .then(response => {
        setTracks(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the tracks!', error);
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

  const handlePlay = () => {
    if (!profile.blocked) {
      audioRef.current.play().catch(error => {
        console.error('Error playing the stream:', error);
        setErrorMessage('Radio is not found');
      });
    }
  };

  const handleMute = () => {
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (event) => {
    const newVolume = event.target.value;
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const playScheduledTrack = (track) => {
    if (!profile || profile.alarmBlocked) {
      return;
    }

    console.log('Attempting to play track:', track);
    fadeOut(audioRef.current, () => {
      trackRef.current.src = `http://localhost:5000/uploads/tracks/${track}`;
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
    axios.post(`http://localhost:5000/radio/${id}/schedule`, updatedSchedule)
      .then(response => {
        console.log('Schedule saved to server');
      })
      .catch(error => {
        console.error('Error saving schedule to server', error);
      });
    setNewTrack('');
    setNewTime('');
  };

  const getDaysLeft = (expirationDate, createdDate, subscriptionPlan) => {
    const now = new Date();
    const created = new Date(createdDate);
    const expiration = new Date(expirationDate);

    let subscriptionDays = 0;
    switch (subscriptionPlan) {
      case '1 Day':
        subscriptionDays = 1;
        break;
      case '1 Month':
        subscriptionDays = 30;
        break;
      case '3 Months':
        subscriptionDays = 90;
        break;
      case '6 Months':
        subscriptionDays = 180;
        break;
      case '1 Year':
        subscriptionDays = 365;
        break;
      default:
        subscriptionDays = 0;
    }

    const daysPassed = differenceInDays(now, created);
    return subscriptionDays - daysPassed;
  };

  const isNextToPlay = (scheduledTime) => {
    const now = new Date();
    const scheduledDate = new Date();
    const [hours, minutes, seconds] = scheduledTime.split(':').map(Number);
    scheduledDate.setHours(hours, minutes, seconds);
    const differenceInMinutes = (scheduledDate - now) / 60000;
    return differenceInMinutes >= 0 && differenceInMinutes <= 1;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  if (profile.blocked) {
    return <div>This radio stream is currently blocked.</div>;
  }

  return (
    <div className="radio-player">
      <h1>Online Radio Player</h1>
      <audio ref={audioRef} preload="none" style={{ display: 'none' }}></audio>
      <audio ref={trackRef} preload="none" style={{ display: 'none' }}></audio>
      <button onClick={handlePlay}>Live</button>
      <button onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
      />
      {isLoading && <p>Connecting...</p>}
      {!isOnline && <p>No connection.</p>}
      {errorMessage && <p>{errorMessage}</p>}

      <h2>Current Time: {currentTime}</h2>

      <div className="profile-info">
        <h2>{profile.name}</h2>
        <h3>{profile.companyName}</h3>
        {profile.logo && <img src={`http://localhost:5000/uploads/${profile.logo}`} alt="Company Logo" />}
        <p>Subscription Plan: {profile.subscriptionPlan}</p>
        <p>Days left to expire: {getDaysLeft(profile.expirationDate, profile.createdDate, profile.subscriptionPlan)}</p>
      </div>

      <Link to={`/radio/${id}/profile`}>
        <button disabled={profile.alarmBlocked}>Go to Profile</button>
      </Link>

      <button onClick={handleLogout}>Logout</button>

      {profile.alarmBlocked ? (
        <p>The alarm system for this profile is currently blocked.</p>
      ) : (
        <>
          <h2>Scheduled Tracks</h2>
          <ul>
            {schedule.map((item, index) => (
              <li key={index} style={isNextToPlay(item.time) ? { fontWeight: 'bold' } : {}}>
                {item.time} - {item.track.split('-').slice(1).join('-')}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default RadioPlayer;
