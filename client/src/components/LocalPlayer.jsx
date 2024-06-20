import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { differenceInDays } from 'date-fns';

const LocalPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const localAudioRef = useRef(null);
  const alarmAudioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [localTracks, setLocalTracks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [currentLocalTrackIndex, setCurrentLocalTrackIndex] = useState(0);
  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchSchedule();
    loadLocalTracks();
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

  useEffect(() => {
    if (localAudioRef.current) {
      localAudioRef.current.addEventListener('ended', handleLocalTrackEnd);
    }
    return () => {
      if (localAudioRef.current) {
        localAudioRef.current.removeEventListener('ended', handleLocalTrackEnd);
      }
    };
  }, [currentLocalTrackIndex, localTracks]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/radiostreams/${id}`);
      setProfile(response.data);
    } catch (error) {
      console.error('There was an error fetching the profile!', error);
      setErrorMessage('Failed to fetch profile');
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/radio/${id}/schedule`);
      setSchedule(response.data);
    } catch (error) {
      console.error('There was an error fetching the schedule!', error);
      setErrorMessage('Failed to fetch schedule');
    }
  };

  const handlePlay = () => {
    playLocalTrack();
  };

  const handlePause = () => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
    }
  };

  const handleMute = () => {
    const audioElement = localAudioRef.current;
    audioElement.muted = !audioElement.muted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (event) => {
    const newVolume = event.target.value;
    localAudioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const handleLocalFiles = (event) => {
    const files = Array.from(event.target.files);
    setLocalTracks(files);
    if (files.length > 0) {
      setCurrentLocalTrackIndex(0);
      saveLocalTracksToStorage(files);
    }
  };

  const saveLocalTracksToStorage = (files) => {
    const trackData = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    localStorage.setItem('localTracks', JSON.stringify(trackData));
  };

  const loadLocalTracks = () => {
    const savedTracks = localStorage.getItem('localTracks');
    if (savedTracks) {
      const trackData = JSON.parse(savedTracks);
      const fileObjects = trackData.map(data => new File([new Blob([])], data.name));
      setLocalTracks(fileObjects);
    }
  };

  const playScheduledTrack = (track) => {
    if (!profile || profile.alarmBlocked || !localAudioRef.current || !alarmAudioRef.current) return;

    fadeOut(localAudioRef.current, () => {
      axios.get(`http://localhost:5000/uploads/tracks/${track}`, { responseType: 'blob' })
        .then(response => {
          const url = URL.createObjectURL(response.data);
          alarmAudioRef.current.src = url;
          alarmAudioRef.current.load();
          alarmAudioRef.current.oncanplaythrough = () => {
            alarmAudioRef.current.play().catch(error => {
              console.error('Error playing track:', error);
            });
          };
          alarmAudioRef.current.onended = () => {
            fadeIn(localAudioRef.current);
            localAudioRef.current.play();
          };
        })
        .catch(error => {
          console.error('Error fetching the track:', error);
        });
    });
  };

  const fadeOut = (audio, callback) => {
    let volume = audio.volume;
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

  const handleLocalTrackEnd = () => {
    const nextIndex = (currentLocalTrackIndex + 1) % localTracks.length;
    setCurrentLocalTrackIndex(nextIndex);
    playLocalTrack(nextIndex);
  };

  const playLocalTrack = (index = currentLocalTrackIndex) => {
    if (localTracks.length > 0 && localAudioRef.current) {
      const trackData = localStorage.getItem('localTracks');
      if (trackData) {
        const tracks = JSON.parse(trackData);
        localAudioRef.current.src = tracks[index].url;
        localAudioRef.current.play().catch(error => {
          console.error('Error playing local track:', error);
        });
      }
    }
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
    return <div>Your profile is blocked.</div>;
  }

  return (
    <div className="local-player">
      <h1>Local MP3 Player</h1>
      <input
        type="file"
        webkitdirectory="true"
        multiple
        onChange={handleLocalFiles}
        accept=".mp3"
      />
      <audio ref={localAudioRef} preload="none" style={{ display: 'block' }}></audio>
      <audio ref={alarmAudioRef} preload="none" style={{ display: 'none' }}></audio>
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
      />
      {errorMessage && <p>{errorMessage}</p>}

      <h2>Current Time: {currentTime}</h2>

      {profile && (
        <div className="profile-info">
          <h2>{profile.name}</h2>
          <h3>{profile.companyName}</h3>
          {profile.logo && <img src={`http://localhost:5000/uploads/${profile.logo}`} alt="Company Logo" />}
          <p>Subscription Plan: {profile.subscriptionPlan}</p>
         <p>Days left to expire: {getDaysLeft(profile.expirationDate, profile.createdDate, profile.subscriptionPlan)}</p>
        </div>
      )}

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
            {schedule.map((item, index) => {
              const trackName = item.track.replace(`${id}-`, ''); // Remove the profile ID from the track name
              return (
                <li key={index} style={isNextToPlay(item.time) ? { fontWeight: 'bold' } : {}}>
                  {item.time} - {trackName}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div>
        <h2>Local Tracks</h2>
        <ul>
          {localTracks.map((track, index) => (
            <li
              key={index}
              onClick={() => setCurrentLocalTrackIndex(index)}
              style={index === currentLocalTrackIndex ? { fontWeight: 'bold' } : {}}
            >
              {track.name}
            </li>
          ))}
        </ul>
      </div>

      <Link to={`/radio/${id}`}>
        <button>Go to Radio Player</button>
      </Link>
    </div>
  );
};

export default LocalPlayer;
