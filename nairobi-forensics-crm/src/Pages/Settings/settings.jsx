// src/Pages/Settings/settings.jsx
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaUserTag } from 'react-icons/fa';
import './settings.css';

const Settings = () => {
    const { user } = useAuth();

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1>Settings</h1>
                <p>Manage your account and preferences</p>
            </div>

            <div className="panel">
                <div className="panel-header">
                    <h2>Profile</h2>
                </div>
                <div className="profile-section">
                    <div className="profile-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <div className="profile-row">
                            <FaUser className="row-icon" />
                            <div>
                                <span className="label">Name</span>
                                <span className="value">{user?.name}</span>
                            </div>
                        </div>
                        <div className="profile-row">
                            <FaEnvelope className="row-icon" />
                            <div>
                                <span className="label">Email</span>
                                <span className="value">{user?.email}</span>
                            </div>
                        </div>
                        <div className="profile-row">
                            <FaUserTag className="row-icon" />
                            <div>
                                <span className="label">Role</span>
                                <span className="value" style={{ textTransform: 'capitalize' }}>
                                    {user?.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
{/* 
            <div className="panel">
                <div className="panel-header">
                    <h2>Coming Soon</h2>
                </div>
                <div className="coming-soon">
                    <p>Additional settings are under development:</p>
                    <ul>
                        <li>Company information for invoice thet shall be generated  it shall be picking the company  pin from here  </li>
                        <li>User & role management</li>
                        <li>Payment method configuration link that they will choose what they need to   pay with  bank card and it goes to there account   and  any other method like mpesa   </li>
                        <li>Invoice & receipt numbering this numbering  should be  from the   kra invoice number and there is where thy get to the number </li>
                        <li>eTIMS integration</li>
                        <li>Email & whatApp templates</li>
                        <li>Rate limiter</li>
                        <li>Audit logs</li>
                        <li>WHatapp api & email</li>
                        <li>Create 1 account for one company then the rest are staff bey  defaualt not unless they are   assigned by  admin </li>
                        <li>Notification on  managersphone  in the web app</li>




                    </ul>
                </div>
            </div> */}
        </div>
    );
};

export default Settings;