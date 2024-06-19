import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('1 Day'); // Default to 1 Day
  const navigate = useNavigate();

  useEffect(() => {
    fetchRadioProfile();
  }, []);

  const fetchRadioProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/radiostreams/${id}`);
      const { name, url, subscriptionPlan } = response.data;
      setName(name);
      setUrl(url);
      setSubscriptionPlan(subscriptionPlan);
    } catch (error) {
      console.error('There was an error fetching the radio profile!', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/radiostreams/${id}`, { name, url, subscriptionPlan });
      navigate('/');
    } catch (error) {
      console.error('There was an error updating the radio stream!', error);
    }
  };

  return (
    <div>
      <h2>Edit Radio Profile</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>URL:</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <div>
          <label>Subscription Plan:</label>
          <select value={subscriptionPlan} onChange={(e) => setSubscriptionPlan(e.target.value)}>
            <option value="1 Day">1 Day</option>
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Year">1 Year</option>
          </select>
        </div>
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default EditProfile;
