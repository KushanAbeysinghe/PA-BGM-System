import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { differenceInHours } from 'date-fns';
import Footer from './Footer';
import Header from './Header';

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
  const [playingTrack, setPlayingTrack] = useState(null);
  const [highlightEndTime, setHighlightEndTime] = useState(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      preloadNextTrack();
    }, 5000); // Check every 5 seconds to preload the next track
    return () => clearInterval(interval);
  }, [schedule, currentTime]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/radiostreams/${id}`);
      setProfile(response.data);
    } catch (error) {
      console.error('There was an error fetching the profile!', error);
      setErrorMessage('Failed to fetch profile');
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`/radio/${id}/schedule`);
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

    setPlayingTrack(track);
    fadeOut(localAudioRef.current, () => {
      alarmAudioRef.current.src = `/uploads/tracks/${track}`;
      console.log('Track source set to:', alarmAudioRef.current.src);
      alarmAudioRef.current.load();
      alarmAudioRef.current.oncanplaythrough = () => {
        alarmAudioRef.current.play().catch(error => {
          console.error('Error playing track:', error);
        });
      };
      alarmAudioRef.current.onended = () => {
        setPlayingTrack(null);
        fadeIn(localAudioRef.current);
        localAudioRef.current.play();
      };

      // Calculate the end time for highlighting
      const trackDuration = alarmAudioRef.current.duration * 1000; // duration in milliseconds
      const endTime = new Date().getTime() + trackDuration + 20000; // add 20 seconds
      setHighlightEndTime(endTime);
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

  const preloadNextTrack = () => {
    const now = new Date();
    const futureTracks = schedule.filter(track => {
      const [hours, minutes, seconds] = track.time.split(':').map(Number);
      const trackTime = new Date();
      trackTime.setHours(hours, minutes, seconds);
      return trackTime > now;
    });

    if (futureTracks.length > 0) {
      const nextTrack = futureTracks[0];
      const nextTrackTime = new Date();
      const [hours, minutes, seconds] = nextTrack.time.split(':').map(Number);
      nextTrackTime.setHours(hours, minutes, seconds);

      // Preload the track 60 seconds before the scheduled time
      if (nextTrackTime - now <= 60000 && alarmAudioRef.current.src !== `/uploads/tracks/${nextTrack.track}`) {
        alarmAudioRef.current.src = `/uploads/tracks/${nextTrack.track}`;
        alarmAudioRef.current.load();
      }
    }
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
    axios.post(`/radio/${id}/schedule`, updatedSchedule)
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

    const hoursPassed = differenceInHours(now, created);
    const daysPassed = Math.ceil(hoursPassed / 24);
    const daysLeft = subscriptionDays - daysPassed;

    // console.log(`Current Date: ${now}`);
    // console.log(`Created Date: ${created}`);
    // console.log(`Expiration Date: ${expiration}`);
    // console.log(`Hours Passed: ${hoursPassed}`);
    // console.log(`Days Passed (ceil): ${daysPassed}`);
    // console.log(`Subscription Days: ${subscriptionDays}`);
    // console.log(`Days Left: ${daysLeft}`);

    return daysLeft;
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
    return (
      <div className="container vh-100 d-flex flex-column align-items-center justify-content-center">
        <style>{`
          .blocked-message {
            color: red;
            font-weight: bold;
            font-size: 24px;
          }
        `}</style>
        <div className="blocked-message">Your profile is blocked.</div>
        <div>{profile.companyName}</div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="d-flex flex-column vh-100">
        <div className="container flex-grow-1 d-flex flex-column">
          <style>{`
            .local-player {
              background-color: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
              width: 450px;
            }
            .local-player h1 {
              font-size: 24px;
              font-weight: bold;
            }
            .local-player img {
              max-width: 100%;
              height: auto;
              padding: 10px;
              box-sizing: border-box;
            }
            .local-player .form-control-range {
              width: 100%;
            }
            .local-player .btn {
              width: 100%;
            }
            .local-player .profile-info h2 {
              margin-top: 20px;
              font-size: 18px;
              font-weight: bold;
            }
            .local-player .profile-info p {
              font-size: 16px;
            }
            .local-player .list-group-item {
              margin-top: 10px;
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              transition: background-color 0.3s, transform 0.3s;
            }
            .local-player .list-group-item:hover {
              background-color: #e9ecef;
              transform: scale(1.02);
            }
            .local-player .list-group-item.active {
              background-color: #007bff;
              color: white;
            }
            .local-player .list-group-item:last-child {
              margin-bottom: 20px;
            }
            .action-buttons {
              position: absolute;
              top: 10px;
              right: 10px;
              display: flex;
              gap: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 3rem;
              margin-top: 50px;
            }
            .header h2 {
              font-size: 1.5rem;
              margin: 0;
            }
            .subscription-info {
              text-align: center;
              font-size: 1rem;
              margin-top: 10px;
            }
            .card {
              width: 100%;
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            }
          `}</style>
          <div className="action-buttons">
            <Link to={`/radio/${id}/profile`}>
              <button className="btn btn-primary">Go to Profile</button>
            </Link>
            <Link to={`/radio/${id}`}>
              <button className="btn btn-info">Go to Radio Player</button>
            </Link>
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </div>
          <div className="header">
            <h1>{profile.name}</h1>
            <h2>{profile.companyName}</h2>
            <div className="subscription-info">
              <p>Subscription Plan: {profile.subscriptionPlan}<br></br>
              Days left to expire: {getDaysLeft(profile.expirationDate, profile.createdDate, profile.subscriptionPlan)}</p>
            </div>
          </div>
          <div className="row flex-grow-1 align-items-start">
            <div className="col-md-4 d-flex justify-content-center">
              <div className="local-player text-center">
                {profile.logo && <img src={`/uploads/${profile.logo}`} alt="Company Logo" className="img-fluid mb-3" />}
                <audio ref={localAudioRef} preload="none" style={{ display: 'block' }}></audio>
                <audio ref={alarmAudioRef} preload="none" style={{ display: 'none' }}></audio>
                <div className="mb-3">
                  <button className="btn btn-danger btn-block mb-2" onClick={handlePlay}>Play</button>
                  <button className="btn btn-danger btn-block mb-2" onClick={handlePause}>Pause</button>
                  <button className="btn btn-danger btn-block mb-2" onClick={handleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
                </div>
                <div className="mb-3">
                  <input
                    type="range"
                    className="form-control-range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                  />
                </div>
                <input
                  type="file"
                  webkitdirectory="true"
                  multiple
                  onChange={handleLocalFiles}
                  accept=".mp3"
                  className="form-control"
                />
                {errorMessage && <p>{errorMessage}</p>}
              </div>
            </div>
            <div className="col-md-4 d-flex justify-content-center">
              {profile.alarmBlocked ? (
                <div className="card text-center p-4">
                  <div className="card-header">
                    <h2>Scheduled Tracks</h2>
                  </div>
                  <p style={{ color: 'red', fontWeight: 'bold' }}>The alarm system for this profile is currently blocked.</p>
                </div>
              ) : (
                <div className="card text-center p-4">
                  <div className="card-header">
                    <h2>Scheduled Tracks</h2>
                    <div className="scheduled-player">
                      <br />
                      <audio ref={alarmAudioRef} controls preload="none" style={{ width: '100%' }}></audio>
                    </div>
                  </div>
                  <ul className="list-group list-group-flush">
                    {schedule.map((item, index) => {
                      const isPlaying = item.track === playingTrack;
                      const isHighlighted = highlightEndTime && new Date().getTime() < highlightEndTime;
                      return (
                        <li
                          key={index}
                          className={`list-group-item d-flex justify-content-between align-items-center ${isPlaying || isHighlighted ? 'bg-warning' : ''}`}
                          style={isPlaying || isHighlighted ? { fontWeight: 'bold', backgroundColor: '#ffecb3' } : {}}
                        >
                          <span
                            className="dot"
                            style={{
                              height: '10px',
                              width: '10px',
                              backgroundColor: '#ff0000',
                              borderRadius: '50%',
                              display: 'inline-block',
                              marginRight: '10px'
                            }}
                          ></span>
                          {item.time} - {item.track.split('-').slice(1).join('-')}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="col-md-4 d-flex justify-content-center">
              <div className="card text-center p-4">
                <div className="card-header">
                  <h2>Local Tracks</h2>
                </div>
                <ul className="list-group list-group-flush">
                  {localTracks.map((track, index) => (
                    <li
                      key={index}
                      onClick={() => setCurrentLocalTrackIndex(index)}
                      className={`list-group-item ${index === currentLocalTrackIndex ? 'active' : ''}`}
                    >
                      {track.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <br></br>
        <Footer />
      </div>
    </div>
  );
};

export default LocalPlayer;
