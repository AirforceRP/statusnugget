import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            Powered by{' '}
            <a 
              href="https://statusnugget.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              StatusNugget
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

