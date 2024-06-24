import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';

const RadioProfile = () => {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [playingTrack, setPlayingTrack] = useState(null);
  const [playingScheduledTrack, setPlayingScheduledTrack] = useState(null);
  const audioRefs = useRef([]);
  const scheduledAudioRefs = useRef([]);

  useEffect(() => {
    fetchSchedule();
    fetchTracks();
  }, []);

  const fetchSchedule = () => {
    axios.get(`/radio/${id}/schedule`)
      .then(response => {
        setSchedule(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the schedule!', error);
      });
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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', file);

    axios.post(`/radio/${id}/upload`, formData)
      .then(response => {
        setMessage('File uploaded successfully');
        fetchTracks(); // Refresh tracks after upload
      })
      .catch(error => {
        setMessage('File upload failed');
      });
  };

  const handleDeleteScheduleItem = (index) => {
    const updatedSchedule = schedule.filter((_, i) => i !== index);
    axios.post(`/radio/${id}/schedule`, updatedSchedule)
      .then(response => {
        setSchedule(updatedSchedule);
        setMessage('Schedule updated successfully');
      })
      .catch(error => {
        setMessage('Failed to update schedule');
        console.error('Error updating schedule:', error);
      });
  };

  const handleDeleteTrack = (track) => {
    const trackName = track.split('-').slice(1).join('-'); // Extract the track name after the first hyphen
    axios.delete(`/radio/${id}/tracks/${trackName}`)
      .then(response => {
        setMessage('Track deleted successfully');
        fetchTracks(); // Refresh tracks after deletion
      })
      .catch(error => {
        setMessage('Failed to delete track');
        console.error('Error deleting track:', error);
      });
  };

  const handleAddTrack = () => {
    const newSchedule = { track: newTrack, time: newTime };
    const updatedSchedule = [...schedule, newSchedule];
    setSchedule(updatedSchedule);
    axios.post(`/radio/${id}/schedule`, updatedSchedule)
      .then(response => {
        console.log('Schedule saved to server');
        fetchSchedule(); // Refresh schedule after adding new track
      })
      .catch(error => {
        console.error('Error saving schedule to server', error);
      });
    setNewTrack('');
    setNewTime('');
  };

  const handlePlayPause = (index) => {
    const audio = audioRefs.current[index];
    if (audio.paused) {
      audio.play();
      setPlayingTrack(index);
    } else {
      audio.pause();
      setPlayingTrack(null);
    }
  };

  const handlePlayPauseScheduled = (index) => {
    const audio = scheduledAudioRefs.current[index];
    if (audio.paused) {
      audio.play();
      setPlayingScheduledTrack(index);
    } else {
      audio.pause();
      setPlayingScheduledTrack(null);
    }
  };

  return (
    <div>
      <div className="profilePage">
        <Header />
        <div className="container mt-4" style={styles.container}>
          <h2 className="text-center text-primary mb-4" style={styles.heading}>Manage Radio Stream</h2>
          <div className="card mb-4 p-4 shadow-sm" style={styles.card}>
            <div className="mb-3" style={styles.inputGroup}>
              <input type="file" className="form-control-file" style={styles.fileInput} onChange={handleFileChange} />
              <button className="btn btn-primary mt-2 btn-block" style={styles.uploadButton} onClick={handleUpload}>Upload</button>
              <p className="mt-2 text-center" style={styles.message}>{message}</p>
            </div>

            <h3 className="text-primary mb-3" style={styles.subHeading}>Schedule Tracks</h3>
            <div className="input-group mb-3" style={styles.inputGroup}>
              <input
                type="text"
                className="form-control"
                style={styles.input}
                placeholder="Enter time (HH:MM:SS)"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <select
                className="form-control"
                style={styles.select}
                value={newTrack}
                onChange={(e) => setNewTrack(e.target.value)}
              >
                <option value="">Select Track</option>
                {tracks.map((track, index) => (
                  <option key={index} value={track}>{track.split('-').slice(1).join('-')}</option>
                ))}
              </select>
              <div className="input-group-append">
                <button className="btn btn-primary" style={styles.addButton} onClick={handleAddTrack}>Add</button>
              </div>
            </div>

            <h3 className="text-primary mb-3" style={styles.subHeading}>Scheduled Tracks</h3>
            <ul className="list-group mb-3" style={styles.listGroup}>
              {schedule.map((item, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center" style={styles.listItem}>
                  <span style={styles.trackName}>{item.time} - {item.track}</span>
                  <div style={styles.buttonGroup}>
                    <audio ref={el => scheduledAudioRefs.current[index] = el} src={`/uploads/tracks/${item.track}`} />
                    <button
                      className="btn btn-success btn-sm"
                      style={styles.playPauseButton}
                      onClick={() => handlePlayPauseScheduled(index)}
                    >
                      {playingScheduledTrack === index ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
                    </button>
                    <button className="btn btn-danger btn-sm" style={styles.deleteButton} onClick={() => handleDeleteScheduleItem(index)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="text-primary mb-3" style={styles.subHeading}>Uploaded Tracks</h3>
            <ul className="list-group mb-3" style={styles.listGroup}>
              {tracks.map((track, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center" style={styles.listItem}>
                  <span style={styles.trackName}>{track.split('-').slice(1).join('-')}</span>
                  <div style={styles.buttonGroup}>
                    <audio ref={el => audioRefs.current[index] = el} src={`/uploads/tracks/${track}`} />
                    <button
                      className="btn btn-success btn-sm"
                      style={styles.playPauseButton}
                      onClick={() => handlePlayPause(index)}
                    >
                      {playingTrack === index ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
                    </button>
                    <button className="btn btn-danger btn-sm" style={styles.deleteButton} onClick={() => handleDeleteTrack(track)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <br></br><br></br> <br></br> <br></br><br></br> <br></br> <br></br>
      <Footer />
    </div>
  );
};

const styles = {
  profilePage: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  container: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
    maxWidth: '800px',
    margin: '0 auto',
    flexGrow: 1
  },
  heading: {
    color: '#007bff',
    marginBottom: '20px',
    textAlign: 'center'
  },
  subHeading: {
    color: '#007bff',
    marginBottom: '20px'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  select: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  fileInput: {
    display: 'block',
    marginBottom: '10px'
  },
  uploadButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  addButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    marginLeft: '5px'
  },
  playPauseButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    marginRight: '5px'
  },
  listGroup: {
    listStyleType: 'none',
    padding: '0'
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center'
  },
  trackName: {
    flexGrow: 1,
    marginRight: '10px'
  },
  message: {
    textAlign: 'center'
  }
};

export default RadioProfile;
