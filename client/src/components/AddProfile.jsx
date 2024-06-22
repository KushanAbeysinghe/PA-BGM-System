import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';

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
      const response = await axios.post('/radiostreams', formData, {
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
    <div>
    <Header />
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Add Radio Profile</h2>
        <form onSubmit={handleAddProfile} style={styles.form}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              className="form-control"
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="url">URL</label>
            <input
              type="text"
              id="url"
              className="form-control"
              style={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              className="form-control"
              style={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="subscriptionPlan">Subscription Plan</label>
            <select
              id="subscriptionPlan"
              className="form-control"
              style={styles.input}
              value={subscriptionPlan}
              onChange={(e) => setSubscriptionPlan(e.target.value)}
              required
            >
              <option value="">Select Plan</option>
              <option value="1 Day">1 Day</option>
              <option value="1 Month">1 Month</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="logo">Company Logo</label>
            <input
              type="file"
              id="logo"
              className="form-control-file"
              style={styles.fileInput}
              onChange={handleLogoChange}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={styles.button}>Add Profile</button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
      </div>
      <Footer />
    </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  container: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    margin: '0 auto',
    flexGrow: 1
  },
  heading: {
    color: '#007bff',
    marginBottom: '20px',
    textAlign: 'center'
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    padding: '20px'
  },
  input: {
    marginBottom: '15px',
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  fileInput: {
    marginBottom: '15px'
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  message: {
    textAlign: 'center',
    color: '#007bff'
  }
};

export default AddProfile;
