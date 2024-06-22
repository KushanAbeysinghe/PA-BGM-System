import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { Link } from 'react-router-dom';

const History = () => {
  const [history, setHistory] = useState([]);
  const [expandedStreamIds, setExpandedStreamIds] = useState({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    axios.get('/history')
      .then(response => {
        setHistory(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the history!', error);
      });
  };

  const groupHistoryById = (history) => {
    return history.reduce((acc, item) => {
      if (!acc[item.id]) {
        acc[item.id] = { details: [], companyName: item.companyName, name: item.name };
      }
      acc[item.id].details.push(item);
      return acc;
    }, {});
  };

  const toggleExpand = (streamId) => {
    setExpandedStreamIds((prev) => ({ ...prev, [streamId]: !prev[streamId] }));
  };

  const groupedHistory = groupHistoryById(history);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <div className="container mt-4 flex-grow-1">
        <h2 className="text-primary mb-4">History</h2>
        <Link to="/dashboard" className="btn btn-primary mb-4">Go to Dashboard</Link>
        <style jsx>{`
          .card {
            border: none;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(135deg, #f3f4f6, #f9fafb);
          }
          .card-header {
            background-color: #007bff;
            color: #ffffff;
            border-radius: 8px 8px 0 0;
            padding: 10px;
            cursor: pointer;
          }
          .card-body {
            padding: 10px;
          }
          .card-title {
            margin-bottom: 0;
          }
          .list-group-item {
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 10px;
            padding: 10px;
          }
          .text-secondary {
            color: #6c757d !important;
          }
        `}</style>
        {Object.keys(groupedHistory).map(streamId => {
          const { companyName, name, details } = groupedHistory[streamId];
          const sortedDetails = details.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          return (
            <div key={streamId} className="card">
              <div className="card-header" onClick={() => toggleExpand(streamId)}>
                <h5 className="card-title">{`Stream ID: ${streamId}`}</h5>
                <p>{`Company Name: ${companyName}`}<br></br>
                  {`Name: ${name}`}</p>
              </div>
              {expandedStreamIds[streamId] && (
                <div className="card-body">
                  {sortedDetails.map((item, index) => (
                    <div key={index} className="list-group-item">
                      <p><strong>Action:</strong> {item.action}</p>
                      <p><strong>Timestamp:</strong> {new Date(item.timestamp).toLocaleString()}</p>
                      <p><strong>Details:</strong> {item.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Footer />
    </div>
  );
};

export default History;
