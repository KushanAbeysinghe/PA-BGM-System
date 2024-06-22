import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';

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
      const response = await axios.get(`/radiostreams/${id}`);
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
      const response = await axios.put(`/radiostreams/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Response:', response.data);
      navigate('/');
    } catch (error) {
      console.error('There was an error updating the radio stream!', error.response?.data || error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/radiostreams/${id}`);
      navigate('/');
    } catch (error) {
      console.error('There was an error deleting the radio stream!', error);
    }
  };

  return (
    <div>
      <Header />
      <div className="edit-profile-page">
        <style jsx>{`
          .edit-profile-page {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          .edit-profile-container {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: auto;
            flex-grow: 1;
          }
          .edit-profile-container h2 {
            color: #007bff;
            margin-bottom: 20px;
          }
          .form-control,
          .form-control-file {
            margin-bottom: 15px;
          }
          .btn-block {
            display: block;
            width: 100%;
          }
          .text-primary {
            color: #007bff !important;
          }
          .text-center {
            text-align: center;
          }
          .shadow {
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
          }
        `}</style>
        <div className="container mt-4 edit-profile-container">
          <h2 className="text-center text-primary mb-4">Edit Radio Profile</h2>
          <form onSubmit={handleSubmit} className="shadow p-4 rounded">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                className="form-control"
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
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="logo">Company Logo</label>
              <input
                type="file"
                id="logo"
                className="form-control-file"
                onChange={handleLogoChange}
              />
              {currentLogo && (
                <div className="mt-2">
                  <img
                    src={`/uploads/${currentLogo}`}
                    alt="Company Logo"
                    className="img-thumbnail"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="subscriptionPlan">Subscription Plan</label>
              <select
                id="subscriptionPlan"
                className="form-control"
                value={subscriptionPlan}
                onChange={(e) => setSubscriptionPlan(e.target.value)}
              >
                <option value="1 Day">1 Day</option>
                <option value="1 Month">1 Month</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block">Update Profile</button>
            <button type="button" className="btn btn-danger btn-block mt-2" onClick={handleDelete}>Delete Profile</button>
          </form>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default EditProfile;
