// src/Components/Topbar/Topbar.jsx
import { FaBars, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import PushPermissionPrompt from '../Notifications/PushPermissionPrompt';
import InstallAppPrompt from '../Notifications/InstallAppPrompt';
import './topbar.css';

const Topbar = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <>
            <header className="topbar">
                <button className="menu-toggle" onClick={onMenuClick} aria-label="Open navigation" data-tooltip="Open navigation">
                    <FaBars />
                </button>

                <div className="topbar-search">
                    <FaSearch />
                    <input type="text" placeholder="Search..." />
                </div>

                <div className="topbar-right">
                    <NotificationBell />
                    <div className="topbar-user">
                        <div className="user-avatar-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{user?.name}</span>
                    </div>
                </div>
            </header>

            <InstallAppPrompt />
            <PushPermissionPrompt />
        </>
    );
};

export default Topbar;