import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('1 Day'); // Default to 1 Day
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState(null);
  const [currentLogo, setCurrentLogo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRadioProfile();
  }, []);

  const fetchRadioProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/radiostreams/${id}`);
      const { name, url, subscriptionPlan, companyName, email, logo } = response.data;
      setName(name);
      setUrl(url);
      setSubscriptionPlan(subscriptionPlan);
      setCompanyName(companyName);
      setEmail(email);
      setCurrentLogo(logo);
    } catch (error) {
      console.error('There was an error fetching the radio profile!', error);
    }
  };

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
      await axios.put(`http://localhost:5000/radiostreams/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/');
    } catch (error) {
      console.error('There was an error updating the radio stream!', error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/radiostreams/${id}`);
      navigate('/');
    } catch (error) {
      console.error('There was an error deleting the radio stream!', error);
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
          {/* {currentLogo && <img src={`http://localhost:5000/uploads/${currentLogo}`} alt="Company Logo" />} */}
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
        <button type="button" onClick={handleDelete}>Delete Profile</button>
      </form>
    </div>
  );
};

export default EditProfile;
