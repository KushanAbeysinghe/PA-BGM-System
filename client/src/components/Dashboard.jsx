import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [radioStreams, setRadioStreams] = useState([]);

  useEffect(() => {
    fetchRadioStreams();
  }, []);

  const fetchRadioStreams = () => {
    axios.get('http://localhost:5000/radiostreams')
      .then(response => {
        setRadioStreams(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the radio streams!', error);
      });
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:5000/radiostreams/${id}`)
      .then(response => {
        fetchRadioStreams(); // Refresh the list after deletion
      })
      .catch(error => {
        console.error('There was an error deleting the radio stream!', error);
      });
  };

  const handleBlock = (id) => {
    axios.put(`http://localhost:5000/radiostreams/${id}/block`)
      .then(response => {
        fetchRadioStreams(); // Refresh the list after blocking
      })
      .catch(error => {
        console.error('There was an error blocking the radio stream!', error);
      });
  };

  const handleUnblock = (id) => {
    axios.put(`http://localhost:5000/radiostreams/${id}/unblock`)
      .then(response => {
        fetchRadioStreams(); // Refresh the list after unblocking
      })
      .catch(error => {
        console.error('There was an error unblocking the radio stream!', error);
      });
  };

  const handleBlockAlarm = (id) => {
    axios.put(`http://localhost:5000/radiostreams/${id}/block-alarm`)
      .then(response => {
        fetchRadioStreams(); // Refresh the list after blocking alarm system
      })
      .catch(error => {
        console.error('There was an error blocking the alarm system!', error);
      });
  };

  const handleUnblockAlarm = (id) => {
    axios.put(`http://localhost:5000/radiostreams/${id}/unblock-alarm`)
      .then(response => {
        fetchRadioStreams(); // Refresh the list after unblocking alarm system
      })
      .catch(error => {
        console.error('There was an error unblocking the alarm system!', error);
      });
  };

  return (
    <div className="dashboard">
      <h2>Radio Streams Dashboard</h2>
      <Link to="/add">Add New Radio Profile</Link>
      <ul>
        {radioStreams.map((stream, index) => (
          <li key={index}>
            {stream.name}
            <Link to={`/radio/${stream.id}/edit`}>Edit</Link>
            <Link to={`/radio/${stream.id}`}>Play</Link>
            <Link to={`/radio/${stream.id}/profile`}>Manage</Link>
            <button onClick={() => handleDelete(stream.id)}>Delete</button>
            {stream.blocked ? (
              <button onClick={() => handleUnblock(stream.id)}>Unblock</button>
            ) : (
              <button onClick={() => handleBlock(stream.id)}>Block</button>
            )}
            {stream.alarmBlocked ? (
              <button onClick={() => handleUnblockAlarm(stream.id)}>Unblock Alarm</button>
            ) : (
              <button onClick={() => handleBlockAlarm(stream.id)}>Block Alarm</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
