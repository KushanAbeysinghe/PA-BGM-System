import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UploadTrack = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetchSchedule();
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

  return (
    <div className="upload-track">
      <h2>Upload Track</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{message}</p>

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
