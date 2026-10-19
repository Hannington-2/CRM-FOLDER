// src/Components/Sidebar/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt, FaUsers, FaFileInvoiceDollar, FaMoneyBillWave,
    FaReceipt, FaChartBar, FaCog, FaSignOutAlt, 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { section: 'MAIN', 
            items: [
            {
                 to: '/dashboard', icon: <FaTachometerAlt />, 
                 label: 'Dashboard' 
            }
                ]},
        { section: 'SALES', items: [
            { to: '/dashboard/clients', icon: <FaUsers />, label: 'Clients' }
        ]},
        { section: 'FINANCE', items: [
            { to: '/dashboard/invoices', icon: <FaFileInvoiceDollar />, label: 'Invoices' },
            { to: '/dashboard/payments', icon: <FaMoneyBillWave />, label: 'Payments' },
            { to: '/dashboard/receipts', icon: <FaReceipt />, label: 'Receipts' }
        ]},
        { section: 'REPORTING', items: [
            { to: '/dashboard/reports', icon: <FaChartBar />, label: 'Reports' }
        ]},
        // { section: 'COMMUNICATIONS', items: [
        //     { to: '/dashboard/communications', icon: <FaEnvelope />, label: 'Communications' }
        // ]},
        { section: 'SYSTEM', items: [
            { to: '/dashboard/settings', icon: <FaCog />, label: 'Settings' }
        ]}
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>NF <span>LLP</span></h2>
                    <small>Forensic CRM</small>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((group, idx) => (
                        <div key={idx} className="nav-group">
                            <p className="nav-section">{group.section}</p>
                            {group.items.map((item, i) => (
                                <NavLink
                                    key={i}
                                    to={item.to}
                                    end
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                    onClick={onClose}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="user-name">{user?.name}</p>
                            <p className="user-role">{user?.role}</p>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;