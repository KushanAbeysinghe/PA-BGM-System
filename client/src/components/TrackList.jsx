import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ListGroup } from 'react-bootstrap';

const TrackList = () => {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const fetchTracks = async () => {
      const result = await axios.get('http://localhost:5000/tracks');
      setTracks(result.data);
    };

    fetchTracks();
  }, []);

  return (
    <ListGroup>
      {tracks.map(track => (
        <ListGroup.Item key={track.id}>
          {track.trackName} - {track.timestamp}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default TrackList;
