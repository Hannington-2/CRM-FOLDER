// import React from 'react';
import Hero from "../../Components/hero/hero";
import "./home.css";

const Home = () => {
  return (
    <div className="home-container">
        {/* REMOVED <Nav /> from here - it's in App.jsx now */}
        <Hero />
    </div>
  );
}

export default Home;