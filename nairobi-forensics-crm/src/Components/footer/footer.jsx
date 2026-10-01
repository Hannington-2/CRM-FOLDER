// import React from 'react';
import './footer.css';
// Using some icons for a professional look. Make sure you have react-icons installed.
import { FaGlobe, FaEnvelope, FaPhoneAlt, FaCode } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hero-footer">
      <div className="footer-content">
        
        {/* Left Side: Copyright */}
        <div className="footer-left">
          <p>&copy; {currentYear} Nairobi Forensics LLP. All rights reserved.</p>
        </div>

        {/* Right Side: Developer Info */}
        <div className="footer-right">
          <span className="developed-by">
            <FaCode className="icon" /> Product developed & managed by 
            <a href="https://vectalogixsoftwares.vercel.app/" target="_blank" rel="noopener noreferrer" className="brand-link">
              Vectalogix Softwares
            </a>
          </span>
          
          <div className="contact-links">
            <a href="mailto:support@vectalogix.com" title="Email Support">
              <FaEnvelope /> support@vectalogix.com
            </a>
            <a href="tel:0742091562" title="Call Support">
              <FaPhoneAlt /> 0742091562
            </a>
            <a href="https://vectalogixsoftwares.vercel.app/" target="_blank" rel="noopener noreferrer" title="Visit Website">
              <FaGlobe /> Website
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;