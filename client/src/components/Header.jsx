import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 20px;
  background-color: #1825AA;
  color: white;
  height: 60px;

  .logo {
    display: flex;
    align-items: center;

    img {
      margin-left: 10px;
      max-width: 50px;
      height: auto;
    }
  }

  .navigation {
    display: flex;
    align-items: center;
    
    a {
      color: white;
      text-decoration: none;
      margin: 0 10px;
      font-size: 16px;
    }

    button {
      color: white;
      background-color: transparent;
      border: none;
      cursor: pointer;
      font-size: 16px;
      margin-left: 20px;
    }
  }

 
  
`;

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <HeaderContainer>
      <div className="logo">
        {/* <span>Radio Player</span>
        <img src={`${process.env.PUBLIC_URL}/images/logo.jpg`} alt="Planet Entertainment Logo" /> */}
      </div>
      {/* <div className="navigation">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <button onClick={handleLogout}>Logout</button>
      </div> */}
    </HeaderContainer>
  );
};

export default Header;
