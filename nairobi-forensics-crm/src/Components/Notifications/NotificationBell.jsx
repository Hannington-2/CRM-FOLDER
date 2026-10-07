// src/Components/Notifications/NotificationBell.jsx
import { useState, useRef, useEffect } from 'react';
import {
    FaBell, FaCheck, FaTrash, FaFileInvoiceDollar,
    FaMoneyBillWave, FaReceipt, FaUserPlus, FaExclamationTriangle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationBell.css';

const iconForType = (type) => {
    switch (type) {
        case 'invoice_created': return <FaFileInvoiceDollar />;
        case 'payment_received': return <FaMoneyBillWave />;
        case 'receipt_generated': return <FaReceipt />;
        case 'client_added': return <FaUserPlus />;
        case 'invoice_overdue': return <FaExclamationTriangle />;
        default: return <FaBell />;
    }
};

const colorForType = (type) => {
    switch (type) {
        case 'invoice_created': return 'purple';
        case 'payment_received': return 'green';
        case 'receipt_generated': return 'blue';
        case 'client_added': return 'orange';
        case 'invoice_overdue': return 'red';
        default: return 'gray';
    }
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-GB');
};

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotifications();

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotificationClick = async (n) => {
        if (!n.isRead) await markAsRead(n._id);
        if (n.link) {
            navigate(n.link);
            setOpen(false);
        }
    };

    return (
        <div className="notification-bell" ref={dropdownRef}>
            <button className="bell-btn" onClick={() => setOpen(!open)} title="Notifications">
                <FaBell />
                {unreadCount > 0 && (
                    <span className="bell-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <div>
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="header-count">{unreadCount} unread</span>
                            )}
                        </div>
                        <div className="header-actions">
                            {unreadCount > 0 && (
                                <button className="header-btn" onClick={markAllAsRead} title="Mark all as read">
                                    <FaCheck />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button className="header-btn danger" onClick={clearAll} title="Clear all">
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="empty-notifications">
                                <FaBell />
                                <p>You're all caught up</p>
                                <span>Notifications appear here when things happen</span>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n._id}
                                    className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className={`notif-icon ${colorForType(n.type)}`}>
                                        {iconForType(n.type)}
                                    </div>
                                    <div className="notif-body">
                                        <div className="notif-title">{n.title}</div>
                                        <div className="notif-message">{n.message}</div>
                                        <div className="notif-time">{timeAgo(n.createdAt)}</div>
                                    </div>
                                    {!n.isRead && <span className="unread-dot" />}
                                    <button
                                        className="notif-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(n._id);
                                        }}
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;