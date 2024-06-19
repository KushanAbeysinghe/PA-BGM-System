import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const UploadTrack = () => {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [newTrack, setNewTrack] = useState('');
  const [newTime, setNewTime] = useState('');
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    fetchSchedule();
    fetchTracks();
  }, [id]);

  const fetchSchedule = () => {
    axios.get(`http://localhost:5000/radio/${id}/schedule`)
      .then(response => {
        setSchedule(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the schedule!', error);
      });
  };

  const fetchTracks = () => {
    axios.get(`http://localhost:5000/radio/${id}/tracks`)
      .then(response => {
        const trackFiles = response.data.map(file => ({
          original: file,
          display: file.replace(`${id}-`, '')
        }));
        setTracks(trackFiles);
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

    axios.post(`http://localhost:5000/radio/${id}/upload`, formData)
      .then(response => {
        setMessage('File uploaded successfully');
        fetchTracks(); // Refresh tracks after upload
      })
      .catch(error => {
        setMessage('File upload failed');
      });
  };

  const handleDeleteTrack = (track) => {
    axios.delete(`http://localhost:5000/radio/${id}/tracks/${track}`)
      .then(response => {
        setMessage('Track deleted successfully');
        fetchTracks(); // Refresh tracks after deletion
      })
      .catch(error => {
        setMessage('Failed to delete track');
        console.error('Error deleting track:', error);
      });
  };

  const handleDeleteSchedule = (index) => {
    const updatedSchedule = schedule.filter((_, i) => i !== index);
    axios.post(`http://localhost:5000/radio/${id}/schedule`, updatedSchedule)
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

  return (
    <div className="upload-track">
      <h2>Upload Track</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{message}</p>

      <h2>Uploaded Tracks</h2>
      <ul>
        {tracks.map((track, index) => (
          <li key={index}>
            {track.display}
            <button onClick={() => handleDeleteTrack(track.original)}>Delete</button>
          </li>
        ))}
      </ul>

      <h2>Scheduled Tracks</h2>
      <ul>
        {schedule.map((item, index) => (
          <li key={index}>
            {item.time} - {item.track.replace(`${id}-`, '')}
            <button onClick={() => handleDeleteSchedule(index)}>Delete</button>
          </li>
        ))}
      </ul>

      <h2>Add Track to Schedule</h2>
      <input 
        type="text" 
        placeholder="Enter time (HH:MM:SS)" 
        value={newTime} 
        onChange={(e) => setNewTime(e.target.value)} 
      />
      <select value={newTrack} onChange={(e) => setNewTrack(e.target.value)}>
        <option value="">Select Track</option>
        {tracks.map((track, index) => (
          <option key={index} value={track.original}>{track.display}</option>
        ))}
      </select>
      <button onClick={handleAddTrack}>Add</button>
    </div>
  );
};

export default UploadTrack;
