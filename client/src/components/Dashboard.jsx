import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, differenceInHours } from 'date-fns';
import Footer from './Footer';
import Header from './Header';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Oval } from 'react-loader-spinner';

const Dashboard = () => {
  const [radioStreams, setRadioStreams] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [alarmLoading, setAlarmLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken'); // Retrieve token from localStorage

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    } else {
      fetchRadioStreams();
    }
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup interval on unmount
  }, [token]);

  const fetchRadioStreams = () => {
    setLoading(true);
    axios.get('/radiostreams', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        setRadioStreams(response.data);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          toast.error('There was an error fetching the radio streams!');
        }
      });
  };

  const handleBlock = (id) => {
    setLoading(true);
    axios.put(`/radiostreams/${id}/block`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        fetchRadioStreams(); // Refresh the list after blocking
      })
      .catch(error => {
        setLoading(false);
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          toast.error('There was an error blocking the radio stream!');
        }
      });
  };

  const handleUnblock = (id) => {
    setLoading(true);
    axios.put(`/radiostreams/${id}/unblock`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        fetchRadioStreams(); // Refresh the list after unblocking
      })
      .catch(error => {
        setLoading(false);
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          toast.error('There was an error unblocking the radio stream!');
        }
      });
  };

  const handleBlockAlarm = (id) => {
    setAlarmLoading(true);
    axios.put(`/radiostreams/${id}/block-alarm`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        fetchRadioStreams(); // Refresh the list after blocking alarm system
        setAlarmLoading(false);
        toast.success('Alarm blocked successfully');
      })
      .catch(error => {
        setAlarmLoading(false);
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          toast.error('There was an error blocking the alarm system!');
        }
      });
  };

  const handleUnblockAlarm = (id) => {
    setAlarmLoading(true);
    axios.put(`/radiostreams/${id}/unblock-alarm`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        fetchRadioStreams(); // Refresh the list after unblocking alarm system
        setAlarmLoading(false);
        toast.success('Alarm unblocked successfully');
      })
      .catch(error => {
        setAlarmLoading(false);
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          toast.error('There was an error unblocking the alarm system!');
        }
      });
  };

  const handleRenewSubscription = (stream) => {
    setLoading(true);
    axios.put(`/radiostreams/${stream.id}/paid`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        fetchRadioStreams(); // Refresh the list after renewing subscription
      })
      .catch(error => {
        setLoading(false);
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          toast.error('There was an error renewing the subscription!');
        }
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

    // Calculate the exact hours difference
    const hoursDifference = differenceInHours(now, created);

    // Calculate elapsed days considering partial days as full days
    const elapsedDays = Math.ceil(hoursDifference / 24);

    const subscriptionDays = getSubscriptionDays(subscriptionPlan);
    let daysLeft = subscriptionDays - elapsedDays;

    if (daysLeft < 0) {
      daysLeft -= 1; // Adjust to start from -1 instead of 0
    }

    return daysLeft;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // Sort radio streams by days left
  const sortedRadioStreams = radioStreams.sort((a, b) => {
    const daysLeftA = getDaysLeft(new Date(a.createdDate), a.subscriptionPlan);
    const daysLeftB = getDaysLeft(new Date(b.createdDate), b.subscriptionPlan);
    return daysLeftA - daysLeftB;
  });

  return (
    <div>
      <Header />
      <div className="container mt-4 dashboard-container">
        <style jsx>{`
          .dashboard-container {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, #f3f4f6, #f9fafb);
          }
          .dashboard-container h2 {
            color: #007bff;
            margin-bottom: 20px;
            font-weight: 700;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
          }
          .card {
            border: none;
            border-radius: 8px;
          }
          .dashboard-card {
            background: linear-gradient(145deg, #e2ebf0, #f9f9f9);
            border-radius: 12px;
            box-shadow: 7px 7px 14px #c5c5c5, -7px -7px 14px #ffffff;
          }
          .list-group-item {
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            transition: transform 0.3s, box-shadow 0.3s;
            margin-bottom: 20px;
          }
          .list-group-item:hover {
            transform: scale(1.03);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          }
          .btn-group {
            display: flex;
            flex-wrap: wrap;
          }
          .btn-group .btn {
            margin: 5px;
            transition: background-color 0.3s, box-shadow 0.3s;
          }
          .btn-group .btn:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .text-primary {
            color: #007bff !important;
          }
          .text-secondary {
            color: #6c757d !important;
          }
          .card .card-header {
            background-color: #007bff;
            color: #ffffff;
            border-bottom: 1px solid #dee2e6;
            border-radius: 12px 12px 0 0;
          }
          .card .card-header h2 {
            margin: 0;
            font-size: 1.25rem;
          }
          .list-group-item .btn-group .btn {
            margin-right: 0.5rem;
          }
          .list-group-item .btn-group .btn:last-child {
            margin-right: 0;
          }
          .list-group-item .btn-group .btn-warning {
            background-color: #ffc107;
            border-color: #ffc107;
          }
          .list-group-item .btn-group .btn-info {
            background-color: #17a2b8;
            border-color: #17a2b8;
          }
          .list-group-item .btn-group .btn-secondary {
            background-color: #6c757d;
            border-color: #6c757d;
          }
          .btn:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }
          .btn-history {
            margin-right: 10px;
          }
          .spinnerContainer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
        `}</style>
        {loading && (
          <div className="spinnerContainer">
            <Oval
              height={50}
              width={50}
              color="#007bff"
              wrapperStyle={{}}
              wrapperClass=""
              visible={true}
              ariaLabel="oval-loading"
              secondaryColor="#007bff"
              strokeWidth={2}
              strokeWidthSecondary={2}
            />
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-primary">Radio Streams Dashboard</h2>
          <div>
            <Link to="/history" className="btn btn-secondary btn-history">History</Link>
            <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="card mb-4 p-3 shadow-sm dashboard-card">
          <div className="d-flex justify-content-between">
            <div>
              <p className="mb-1"><strong>Current Date:</strong> {currentTime.toLocaleDateString()}</p>
              <p className="mb-1"><strong>Current Time:</strong> {currentTime.toLocaleTimeString()}</p>
            </div>
            <Link to="/add" className="btn btn-primary align-self-center">Add New Radio Profile</Link>
          </div>
        </div>
        <div className="list-group">
          {sortedRadioStreams.map((stream, index) => {
            const daysLeft = getDaysLeft(new Date(stream.createdDate), stream.subscriptionPlan);

            if (daysLeft <= -5 && !stream.alarmBlocked) {
              handleBlockAlarm(stream.id);
            }

            return (
              <div key={index} className="list-group-item list-group-item-action mb-3 shadow-sm">
                <h4 className="text-secondary">{stream.companyName}</h4>
                <p><strong>{stream.name}</strong> (Created: {new Date(stream.createdDate).toLocaleDateString()})</p>
                <p><strong>Email:</strong> {stream.email}</p>
                <p><strong>Subscription Plan:</strong> {stream.subscriptionPlan}</p>
                <p><strong>Days left:</strong> {daysLeft}</p>
                <div className="d-flex justify-content-between mt-3">
                  <div className="btn-group">
                    <Link to={`/radio/${stream.id}/edit`} className="btn btn-warning btn-sm mr-2">Edit</Link>
                    <Link to={`/radio/${stream.id}`} className="btn btn-info btn-sm mr-2">Play</Link>
                    <Link to={`/radio/${stream.id}/profile`} className="btn btn-secondary btn-sm mr-2">Manage</Link>
                  </div>
                  <div className="btn-group">
                    {stream.blocked ? (
                      <button className="btn btn-success btn-sm mr-2" onClick={() => handleUnblock(stream.id)}>Unblock</button>
                    ) : (
                      <button className="btn btn-danger btn-sm mr-2" onClick={() => handleBlock(stream.id)}>Block</button>
                    )}
                    {stream.alarmBlocked ? (
                      <button className="btn btn-success btn-sm" onClick={() => handleUnblockAlarm(stream.id)}>Unblock Alarm</button>
                    ) : (
                      <button className="btn btn-danger btn-sm" onClick={() => handleBlockAlarm(stream.id)}>Block Alarm</button>
                    )}
                    {daysLeft <= 5 && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleRenewSubscription(stream)}>Paid</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <br></br>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default Dashboard;
