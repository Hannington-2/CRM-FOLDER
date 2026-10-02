import { Link, useNavigate } from 'react-router-dom';
import "./nav.css";
import logo from "../../assets/Nairobi-Forensics-LLP-Logo.webp";
import { CiLogin } from "react-icons/ci";

const Nav = () => {
  const navigate = useNavigate();

  return (
    <header className="primary-nav">
    <Link className="logo" to="/" aria-label="Nairobi Forensics home">
      <img src={logo} alt="Nairobi Forensics LLP Logo" />
    </Link>
    <nav aria-label="Main navigation" className="nav-menu">
      <button type="button" onClick={() => navigate('/login')} className="nav-link nav-link-primary">
        Login <CiLogin size={20} aria-hidden="true" />
      </button>
    </nav>
  </header>
  );
};

export default Nav;