import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UploadTrack = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    fetchSchedule();
    fetchTracks();
  }, []);

  const fetchSchedule = () => {
    axios.get('http://localhost:5000/schedule')
      .then(response => {
        setSchedule(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the schedule!', error);
      });
  };

  const fetchTracks = () => {
    axios.get('http://localhost:5000/tracks')
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

    axios.post('http://localhost:5000/upload', formData)
      .then(response => {
        setMessage('File uploaded successfully');
        fetchSchedule(); // Refresh schedule after upload
      })
      .catch(error => {
        setMessage('File upload failed');
      });
  };

  const handleDelete = (index) => {
    const updatedSchedule = schedule.filter((_, i) => i !== index);
    axios.post('http://localhost:5000/schedule', updatedSchedule)
      .then(response => {
        setSchedule(updatedSchedule);
        setMessage('Schedule updated successfully');
      })
      .catch(error => {
        setMessage('Failed to update schedule');
        console.error('Error updating schedule:', error);
      });
  };

  const handleAddTrack = () => {
    const newSchedule = { track: newTrack, time: newTime };
    const updatedSchedule = [...schedule, newSchedule];
    setSchedule(updatedSchedule);
    axios.post('http://localhost:5000/schedule', updatedSchedule)
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

  return (
    <div className="upload-track">
      <h2>Upload Track</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{message}</p>

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
          <li key={index}>
            {item.time} - {item.track}
            <button onClick={() => handleDelete(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UploadTrack;
