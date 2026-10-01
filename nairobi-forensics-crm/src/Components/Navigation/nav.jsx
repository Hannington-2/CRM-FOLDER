import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./nav.css";
import logo from "../../assets/Nairobi-Forensics-LLP-Logo.webp";
import { CiLogin } from "react-icons/ci";
import { FaBars, FaTimes } from "react-icons/fa";

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLoginClick = () => {
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="primary-nav">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="Nairobi Forensics LLP Logo" />
        </div>

        <div className="menu-icon" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <nav className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
            <ul>
                <li>
                    <button onClick={handleLoginClick} className="nav-link">
                        Login <CiLogin size={20}/>
                    </button>
                </li>
            </ul>
        </nav>
    </header>
  );
}

export default Nav;