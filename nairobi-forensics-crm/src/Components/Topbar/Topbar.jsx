// src/Components/Topbar/Topbar.jsx
import { FaBars, FaBell, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './topbar.css';

const Topbar = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <header className="topbar">
            <button className="menu-toggle" onClick={onMenuClick}>
                <FaBars />
            </button>

            <div className="topbar-search">
                <FaSearch />
                <input type="text" placeholder="Search..." />
            </div>

            <div className="topbar-right">
                <button className="icon-btn">
                    <FaBell />
                    <span className="notification-dot"></span>
                </button>
                <div className="topbar-user">
                    <div className="user-avatar-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span>{user?.name}</span>
                </div>
            </div>
        </header>
    );
};

export default Topbar;