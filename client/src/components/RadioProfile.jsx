import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Oval } from 'react-loader-spinner';

const RadioProfile = () => {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [playingTrack, setPlayingTrack] = useState(null);
  const [playingScheduledTrack, setPlayingScheduledTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioRefs = useRef([]);
  const scheduledAudioRefs = useRef([]);

  useEffect(() => {
    fetchSchedule();
    fetchTracks();
  }, []);

  const fetchSchedule = () => {
    setLoading(true);
    axios.get(`/radio/${id}/schedule`)
      .then(response => {
        setSchedule(response.data);
        setLoading(false);
      })
      .catch(error => {
        toast.error('Error fetching schedule');
        setLoading(false);
      });
  };

  const fetchTracks = () => {
    setLoading(true);
    axios.get(`/radio/${id}/tracks`)
      .then(response => {
        setTracks(response.data);
        setLoading(false);
      })
      .catch(error => {
        toast.error('Error fetching tracks');
        setLoading(false);
      });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    axios.post(`/radio/${id}/upload`, formData)
      .then(response => {
        toast.success('File uploaded successfully');
        fetchTracks(); // Refresh tracks after upload
        setLoading(false);
      })
      .catch(error => {
        toast.error('File upload failed');
        setLoading(false);
      });
  };

  const handleDeleteScheduleItem = (index) => {
    setLoading(true);
    const updatedSchedule = schedule.filter((_, i) => i !== index);
    axios.post(`/radio/${id}/schedule`, updatedSchedule)
      .then(response => {
        setSchedule(updatedSchedule);
        toast.success('Schedule updated successfully');
        setLoading(false);
      })
      .catch(error => {
        toast.error('Failed to update schedule');
        setLoading(false);
      });
  };

  const handleDeleteTrack = (track) => {
    const trackName = track.split('-').slice(1).join('-'); // Extract the track name after the first hyphen
    setLoading(true);
    axios.delete(`/radio/${id}/tracks/${trackName}`)
      .then(response => {
        toast.success('Track deleted successfully');
        fetchTracks(); // Refresh tracks after deletion
        setLoading(false);
      })
      .catch(error => {
        toast.error('Failed to delete track');
        setLoading(false);
      });
  };

  const handleAddTrack = () => {
    if (!newTrack || !newTime) {
      toast.error('Please select a track and time');
      return;
    }

    setLoading(true);
    const newSchedule = { track: newTrack, time: newTime };
    const updatedSchedule = [...schedule, newSchedule];
    axios.post(`/radio/${id}/schedule`, updatedSchedule)
      .then(response => {
        setSchedule(updatedSchedule);
        toast.success('Track added to schedule');
        setLoading(false);
      })
      .catch(error => {
        toast.error('Error saving schedule');
        setLoading(false);
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
          {loading && (
            <div style={styles.spinnerContainer}>
              <Oval
                height={50}
                width={50}
                color="#007bff"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                ariaLabel='oval-loading'
                secondaryColor="#007bff"
                strokeWidth={2}
                strokeWidthSecondary={2}
              />
            </div>
          )}
          <div className="card mb-4 p-4 shadow-sm" style={styles.card}>
            <div className="mb-3" style={styles.inputGroup}>
              <input type="file" className="form-control-file" style={styles.fileInput} onChange={handleFileChange} />
              <button className="btn btn-primary mt-2 btn-block" style={styles.uploadButton} onClick={handleUpload}>Upload</button>
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
      <ToastContainer />
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
  spinnerContainer: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000'
  }
};

export default RadioProfile;
