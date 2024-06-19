import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddProfile = () => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/radiostreams', { name, url })
      .then(response => {
        console.log(response.data);
        navigate('/');
      })
      .catch(error => {
        console.error('There was an error creating the radio stream!', error);
      });
  };

  return (
    <div>
      <h2>Add New Radio Profile</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>URL</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <button type="submit">Add</button>
      </form>
    </div>
  );
};

export default AddProfile;
