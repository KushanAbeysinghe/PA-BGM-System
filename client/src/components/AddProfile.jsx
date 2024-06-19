import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddProfile = () => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('1 Day'); // Default to 1 Day
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState(null);
  const navigate = useNavigate();

  const handleLogoChange = (e) => {
    setLogo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('url', url);
    formData.append('subscriptionPlan', subscriptionPlan);
    formData.append('companyName', companyName);
    formData.append('email', email);
    if (logo) {
      formData.append('logo', logo);
    }

    try {
      await axios.post('http://localhost:5000/radiostreams', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/');
    } catch (error) {
      console.error('There was an error creating the radio stream!', error);
    }
  };

  return (
    <div>
      <h2>Add New Radio Profile</h2>
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
          <label>Company Name:</label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Company Logo:</label>
          <input type="file" onChange={handleLogoChange} />
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
        <button type="submit">Add Profile</button>
      </form>
    </div>
  );
};

export default AddProfile;
