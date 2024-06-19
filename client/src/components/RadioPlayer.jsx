import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

const RadioPlayer = () => {
  const { id } = useParams();
  const audioRef = useRef(null);
  const trackRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchRadioProfile();
    fetchTracks();
    fetchSchedule();
  }, []);

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
    if (!profile.blocked) {
      audioRef.current.play();
    }
  };

  const handleMute = () => {
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(!isMuted);
  };

  const playScheduledTrack = (track) => {
    if (profile.alarmBlocked) {
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

  const getDaysLeft = (expirationDate) => {
    const now = new Date();
    const expiration = new Date(expirationDate);
    return differenceInDays(expiration, now);
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
      <audio ref={audioRef} src={profile.url} preload="none"></audio>
      <audio ref={trackRef} preload="none"></audio>
      <button onClick={handlePlay}>Live</button>
      <button onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>

      <h2>Current Time: {currentTime}</h2>

      <div className="profile-info">
        <h2>{profile.companyName}</h2>
        {profile.logo && <img src={`http://localhost:5000/uploads/${profile.logo}`} alt="Company Logo" />}
        <p>Subscription Plan: {profile.subscriptionPlan}</p>
        <p>Days left to expire: {getDaysLeft(profile.expirationDate)}</p>
      </div>

      <Link to={`/radio/${id}/profile`}>
        <button disabled={profile.alarmBlocked}>Go to Profile</button>
      </Link>

      {profile.alarmBlocked ? (
        <p>The alarm system for this profile is currently blocked.</p>
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
    </div>
  );
};

export default RadioPlayer;
