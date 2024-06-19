import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://localhost:5000/radiostreams/${id}`)
      .then(response => {
        setName(response.data.name);
        setUrl(response.data.url);
      })
      .catch(error => {
        console.error('There was an error fetching the radio stream!', error);
      });
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/radiostreams/${id}`, { name, url })
      .then(response => {
        navigate('/');
      })
      .catch(error => {
        console.error('There was an error updating the radio stream!', error);
      });
  };

  return (
    <div>
      <h2>Edit Radio Profile</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>URL</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default EditProfile;
