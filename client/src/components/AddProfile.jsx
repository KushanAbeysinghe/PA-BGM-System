import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddProfile = () => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [logo, setLogo] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogoChange = (e) => {
    setLogo(e.target.files[0]);
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('url', url);
    formData.append('companyName', companyName);
    formData.append('subscriptionPlan', subscriptionPlan);
    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    if (logo) {
      formData.append('logo', logo);
    }

    try {
      const response = await axios.post('http://localhost:5000/radiostreams', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Profile added successfully');
      navigate('/dashboard');  // Redirect to the dashboard
    } catch (error) {
      setMessage('Error adding profile. Please try again.');
    }
  };

  return (
    <div className="add-profile">
      <h2>Add Radio Profile</h2>
      <form onSubmit={handleAddProfile}>
        <div>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>URL</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <div>
          <label>Company Name</label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div>
          <label>Subscription Plan</label>
          <select value={subscriptionPlan} onChange={(e) => setSubscriptionPlan(e.target.value)} required>
            <option value="">Select Plan</option>
            <option value="1 Day">1 Day</option>
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Year">1 Year</option>
          </select>
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Company Logo</label>
          <input type="file" onChange={handleLogoChange} />
        </div>
        <button type="submit">Add Profile</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddProfile;
