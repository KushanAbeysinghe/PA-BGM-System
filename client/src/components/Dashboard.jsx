import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';

const Dashboard = () => {
  const [radioStreams, setRadioStreams] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchRadioStreams();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on unmount
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

  const getSubscriptionDays = (plan) => {
    switch (plan) {
      case '1 Day':
        return 1;
      case '1 Month':
        return 30;
      case '3 Months':
        return 90;
      case '6 Months':
        return 180;
      case '1 Year':
        return 365;
      default:
        return 0;
    }
  };

  const getDaysLeft = (createdDate, subscriptionPlan) => {
    const now = new Date();
    const created = new Date(createdDate);
    const elapsedDays = differenceInDays(now, created);
    const subscriptionDays = getSubscriptionDays(subscriptionPlan);
    return subscriptionDays - elapsedDays;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="dashboard">
      <h2>Radio Streams Dashboard</h2>
      <p>Current Date: {currentTime.toLocaleDateString()}</p>
      <p>Current Time: {currentTime.toLocaleTimeString()}</p>
      <button onClick={handleLogout}>Logout</button>
      <Link to="/add">Add New Radio Profile</Link>
      <ul>
        {radioStreams.map((stream, index) => (
          <li key={index}>
            <h3>{stream.companyName}</h3>
            {stream.name} (Created: {new Date(stream.createdDate).toLocaleDateString()})
            <br />
            Email: {stream.email}
            <br />
            Subscription Plan: {stream.subscriptionPlan}
            <br />
            Days left: {getDaysLeft(new Date(stream.createdDate), stream.subscriptionPlan)}
            <Link to={`/radio/${stream.id}/edit`}>Edit</Link>
            <Link to={`/radio/${stream.id}`}>Play</Link>
            <Link to={`/radio/${stream.id}/profile`}>Manage</Link>
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
