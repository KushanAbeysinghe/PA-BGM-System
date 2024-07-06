import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
  color: white;
  padding: 10px 0;
  background-color: #1825AA;

  img {
    margin-left: 10px;
    max-width: 50px;
    height: auto;
  }

  @media (max-width: 768px) {
    font-size: 14px;

    img {
      max-width: 40px;
    }
  }

  @media (max-width: 480px) {
    font-size: 12px;

    img {
      max-width: 30px;
    }
  }
`;

const Footer = () => (
  <FooterContainer>
    Powered By: PLANET ENTERTAINMENT 
    <img src={`/logo.jpg`} alt="Planet Entertainment Logo" />
  </FooterContainer>
);

export default Footer;
