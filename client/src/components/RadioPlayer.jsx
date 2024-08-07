import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { differenceInHours } from 'date-fns';
import Footer from './Footer';
import Header from './Header';

const RadioPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const scheduledTrackRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tracks, setTracks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [alarmName, setAlarmName] = useState(''); // New state for alarm name
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [userInteracted, setUserInteracted] = useState(false);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [highlightEndTime, setHighlightEndTime] = useState(null);

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
  }, [schedule, profile, currentTime]);

  useEffect(() => {
    if (!profile) return;

    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleAudioError = () => {
      console.error('Stream error, attempting to reload the stream...');
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

  useEffect(() => {
    const interval = setInterval(() => {
      preloadNextTrack();
    }, 5000); // Check every 5 seconds to preload the next track
    return () => clearInterval(interval);
  }, [schedule, currentTime]);

  const fetchRadioProfile = async () => {
    try {
      const response = await axios.get(`/radiostreams/${id}`);
      setProfile(response.data);
    } catch (error) {
      console.error('There was an error fetching the radio profile!', error);
    }
  };

  const fetchTracks = () => {
    axios.get(`/radio/${id}/tracks`)
      .then(response => {
        setTracks(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the tracks!', error);
      });
  };

  const fetchSchedule = () => {
    axios.get(`/radio/${id}/schedule`)
      .then(response => {
        setSchedule(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the schedule!', error);
      });
  };

  const handlePlay = () => {
    if (!profile || profile.blocked) return;

    const audioElement = audioRef.current;
    setIsLoading(true);
    audioElement.src = profile.url;
    audioElement.load();
    audioElement.play().then(() => {
      setIsLoading(false);
    }).catch(error => {
      console.error('Error attempting to play the stream:', error);
      setIsLoading(true);
    });
  };

  const handleUserInteraction = () => {
    setUserInteracted(true);
    handlePlay(); // Automatically play when the user interacts
  };

  const handleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (event) => {
    const newVolume = event.target.value;
    if (!audioRef.current) return;
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const playScheduledTrack = (track) => {
    if (!profile || profile.alarmBlocked || !audioRef.current || !scheduledTrackRef.current) return;

    setPlayingTrack(track);
    fadeOut(audioRef.current, () => {
      scheduledTrackRef.current.src = `/uploads/tracks/${track}`;
      console.log('Track source set to:', scheduledTrackRef.current.src);
      scheduledTrackRef.current.load();
      scheduledTrackRef.current.oncanplaythrough = () => {
        scheduledTrackRef.current.play().catch(error => {
          console.error('Error playing track:', error);
        });
      };
      scheduledTrackRef.current.onended = () => {
        setPlayingTrack(null);
        fadeIn(audioRef.current);
        audioRef.current.play();
      };

      // Calculate the end time for highlighting
      const trackDuration = scheduledTrackRef.current.duration * 1000; // duration in milliseconds
      const endTime = new Date().getTime() + trackDuration + 20000; // add 20 seconds
      setHighlightEndTime(endTime);
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
      if (nextTrackTime - now <= 60000 && scheduledTrackRef.current.src !== `/uploads/tracks/${nextTrack.track}`) {
        scheduledTrackRef.current.src = `/uploads/tracks/${nextTrack.track}`;
        scheduledTrackRef.current.load();
      }
    }
  };

  const handleAddTrack = () => {
    const newSchedule = { track: newTrack, time: newTime, alarmName }; // Include alarm name
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
    setAlarmName(''); // Clear alarm name input
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

  const sortedSchedule = [...schedule].sort((a, b) => {
    const [aHours, aMinutes] = a.time.split(':').map(Number);
    const [bHours, bMinutes] = b.time.split(':').map(Number);
    return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
  });

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
            .radio-player {
              background-color: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
              width: 450px;
            }
            .radio-player h1 {
              font-size: 24px;
              font-weight: bold;
            }
            .radio-player img {
              max-width: 100%;
              height: auto;
              padding: 10px;
              box-sizing: border-box;
            }
            .radio-player .form-control-range {
              width: 100%;
            }
            .radio-player .btn {
              width: 100%;
            }
            .radio-player .profile-info h2 {
              margin-top: 20px;
              font-size: 18px;
              font-weight: bold;
            }
            .radio-player .profile-info p {
              font-size: 16px;
            }
            .radio-player .list-group-item {
              margin-top: 10px;
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              transition: background-color 0.3s, transform 0.3s;
            }
            .radio-player .list-group-item:hover {
              background-color: #e9ecef;
              transform: scale(1.02);
            }
            .radio-player .list-group-item.active {
              background-color: #007bff;
              color: white;
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
              margin-bottom: 10px;
            }
            .header h1 {
              font-size: 2rem;
              margin-top: 20px;
            }
            .header h2 {
              font-size: 1rem;
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
            {profile.alarmBlocked ? (
              <button className="btn btn-primary" disabled>Go to Profile</button>
            ) : (
              <Link to={`/radio/${id}/profile`}>
                <button className="btn btn-primary">Go to Profile</button>
              </Link>
            )}
            <Link to={`/localplayer/${id}`}>
              <button className="btn btn-info">Go to Local Player</button>
            </Link>
            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
          </div>
          <div className="header">
          <h1>{profile.name} - {profile.companyName}</h1>
            <div className="subscription-info">
              <p>Subscription Plan: {profile.subscriptionPlan}<br />
              Days left to expire: {getDaysLeft(profile.expirationDate, profile.createdDate, profile.subscriptionPlan)}</p>
            </div>
          </div>
          <div className="row flex-grow-1 align-items-start">
            <div className="col-md-6 d-flex justify-content-center">
              <div className="radio-player text-center" onClick={handleUserInteraction}>
                {profile.logo && <img src={`/uploads/${profile.logo}`} alt="Company Logo" className="img-fluid mb-3" />}
                <audio ref={audioRef} preload="none" style={{ display: 'none' }}></audio>
                <div className="mb-3">
                  <button className="btn btn-danger btn-block mb-2" onClick={handlePlay}>Live</button>
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
                {isLoading && <p>Connecting...</p>}
                {!isOnline && <p>No connection.</p>}
                {errorMessage && <p>{errorMessage}</p>}
              </div>
            </div>
            <div className="col-md-6 d-flex justify-content-center">
              {profile.alarmBlocked ? (
                <div className="card text-center p-4">
                  <div className="card-header">
                    <h2>Alarm System is blocked</h2>
                  </div>
                  <p style={{ color: 'red', fontWeight: 'bold' }}>The alarm system for this profile is currently blocked.</p>
                </div>
              ) : (
                <div className="card text-center p-4">
                  <div className="card-header">
                  <h2>Scheduled Tracks</h2>
                    <div className="scheduled-player">
                      <br />
                      <audio ref={scheduledTrackRef} controls preload="none" style={{ width: '100%' }}></audio>
                    </div>
                  </div>
                  <ul className="list-group list-group-flush">
                    {sortedSchedule.map((item, index) => {
                      const isPlaying = item.track === playingTrack;
                      const isHighlighted = highlightEndTime && new Date().getTime() < highlightEndTime;
                      return (
                        <li
                          key={index}
                          className={`list-group-item d-flex justify-content-between align-items-center ${isPlaying || isHighlighted ? 'bg-warning' : ''}`}
                          style={isNextToPlay(item.time) ? { fontWeight: 'bold', backgroundColor: '#ffecb3' } : {}}
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
                          {item.time}  - {item.alarmName} {/* Display alarm name */}
                          {/* {item.track.split('-').slice(1).join('-')} */}
                        </li>
                      );
                    })}
                  </ul>
                 
                </div>
              )}
            </div>
          </div>
        </div>
        <br />
        <Footer />
      </div>
    </div>
  );
};

export default RadioPlayer;
