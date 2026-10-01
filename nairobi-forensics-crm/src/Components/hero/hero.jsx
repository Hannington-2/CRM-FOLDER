import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import "./hero.css";
import Footer from "../footer/footer";

// Import Assets
import bgVideoLandscape from "../../assets/forensicsNBI-background-1920x1080.mp4";
import bgVideoVertical from "../../assets/forensicsNBI-background-vertical-1080x1920.mp4";
import staffImage from "../../assets/company staff.webp";

const Hero = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate(); // <-- Initialize navigation hook

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => (prevSlide === 0 ? 1 : 0));
    }, 10000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
        
        {/* BACKGROUND MEDIA CONTAINER */}
        <div className="hero-bg-container">
            {/* SLIDE 1: VIDEOS */}
            <div className={`slide video-slide ${activeSlide === 0 ? 'active' : ''}`}>
                <video src={bgVideoLandscape} autoPlay loop muted playsInline className="bg-media desktop-video"/>
                <video src={bgVideoVertical} autoPlay loop muted playsInline className="bg-media mobile-video"/>
            </div>

            {/* SLIDE 2: STAFF IMAGE */}
            <div className={`slide image-slide ${activeSlide === 1 ? 'active' : ''}`}>
                <img src={staffImage} alt="Nairobi Forensics Staff" className="bg-media"/>
            </div>
            
            <div className="hero-overlay"></div>
        </div>

        {/* CONTENT */}
        <div className="hero-content">
            <h1 className="hero-title">
                Uncovering the Truth <br />
                <span className="highlight">Through Valuation</span>
            </h1>
            <p className="hero-subtitle">
                Nairobi Forensics LLP provides world class services in Business Recovery, 
                Restructuring and management diagnostic solutions to our customers via 
                the integration of people, technology, legal framework and forensic accounting skills.
            </p>
            
            <div className="hero-buttons">
                {/* Login Button - Redirects to Login Page */}
                <button 
                    className="btn-primary" 
                    onClick={() => navigate('/login')}
                >
                    Login
                </button>
            </div>
        </div>

        {/* ADD THE FOOTER HERE */}
        <Footer />
        
    </section>
  );
}

export default Hero;