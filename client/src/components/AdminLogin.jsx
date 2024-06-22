import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // const handleLogin = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const response = await axios.post('/admin/login', { username, password });
  //     if (response.data.token) {
  //       localStorage.setItem('adminToken', response.data.token);
  //       navigate('/dashboard');
  //     } else {
  //       setMessage('Invalid username or password');
  //     }
  //   } catch (error) {
  //     setMessage('Error logging in. Please try again.');
  //   }
  // };


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/admin/login', { username, password });
      localStorage.setItem('adminToken', response.data.token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
    }
  };
  

  return (
    <div>
       
         <Header />
    <div className="vh-100 d-flex align-items-center justify-content-center">
      <div className="col-md-4">
        <div className="card p-4 shadow-sm">
          <h2 className="text-center text-primary mb-4">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block mt-3">Login</button>
          </form>
          {message && <p className="mt-3 text-center text-danger">{message}</p>}
        </div>
      </div>
    </div>
     <Footer />
    
     </div>
  );
};

const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      margin: '0 auto'
    },
    heading: {
      color: '#007bff',
      marginBottom: '20px',
      textAlign: 'center'
    },
    inputGroup: {
      marginBottom: '15px'
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      borderRadius: '4px',
      border: '1px solid #ccc'
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
      color: 'red'
    }
  };
  

export default AdminLogin;
