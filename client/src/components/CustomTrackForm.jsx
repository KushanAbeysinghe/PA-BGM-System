import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Alert } from 'react-bootstrap';

const CustomTrackForm = () => {
  const [file, setFile] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const [message, setMessage] = useState('');

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

      const { fileName } = res.data;

      await axios.post('http://localhost:5000/addTrack', {
        trackName: fileName,
        timestamp
      });

      setMessage('Track uploaded and scheduled successfully');
    } catch (err) {
      console.error(err);
      setMessage('Error uploading track');
    }
  };

  return (
    <Form onSubmit={onSubmit}>
      {message && <Alert variant="info">{message}</Alert>}
      <Form.Group>
        <Form.File id="customFile" label="Choose MP3 file" onChange={onFileChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Timestamp (HH:MM:SS)</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter timestamp"
          value={timestamp}
          onChange={e => setTimestamp(e.target.value)}
        />
      </Form.Group>
      <Button type="submit">Upload</Button>
    </Form>
  );
};

export default CustomTrackForm;
