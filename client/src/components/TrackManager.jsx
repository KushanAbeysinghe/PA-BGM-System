import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, ListGroup, Alert } from 'react-bootstrap';

const TrackManager = () => {
  const [file, setFile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    const result = await axios.get('http://localhost:5000/tracks');
    setTracks(result.data);
  };

  const onFileChange = e => {
    setFile(e.target.files[0]);
  };

  const onSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Track uploaded successfully');
      fetchTracks();
    } catch (err) {
      console.error(err);
      setMessage('Error uploading track');
    }
  };

  const onDelete = async trackName => {
    try {
      await axios.delete(`http://localhost:5000/deleteTrack/${trackName}`);
      setMessage('Track deleted successfully');
      fetchTracks();
    } catch (err) {
      console.error(err);
      setMessage('Error deleting track');
    }
  };

  return (
    <div>
      <Form onSubmit={onSubmit}>
        {message && <Alert variant="info">{message}</Alert>}
        <Form.Group>
          <Form.File id="customFile" label="Choose MP3 file" onChange={onFileChange} />
        </Form.Group>
        <Button type="submit">Upload</Button>
      </Form>
      <h3>Available Tracks</h3>
      <ListGroup>
        {tracks.map(track => (
          <ListGroup.Item key={track.id}>
            {track.trackName}
            <Button
              variant="danger"
              size="sm"
              className="float-right"
              onClick={() => onDelete(track.trackName)}
            >
              Delete
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default TrackManager;
