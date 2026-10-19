// src/Components/Notifications/ToastContainer.jsx
import {
    FaTimes, FaFileInvoiceDollar, FaMoneyBillWave,
    FaReceipt, FaUserPlus, FaExclamationTriangle, FaBell
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import './ToastContainer.css';

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
        case 'ui_success': return 'green';
        case 'ui_error': return 'red';
        case 'ui_info': return 'blue';
        case 'invoice_created': return 'purple';
        case 'payment_received': return 'green';
        case 'receipt_generated': return 'blue';
        case 'client_added': return 'orange';
        case 'invoice_overdue': return 'red';
        default: return 'gray';
    }
};

const ToastContainer = () => {
    const { toasts, dismissToast } = useNotifications();
    const navigate = useNavigate();

    if (!toasts || toasts.length === 0) return null;

    const handleClick = (toast) => {
        if (toast.link) navigate(toast.link);
        dismissToast(toast.toastId);
    };

    return (
        <div className="toast-container" aria-live="polite" aria-atomic="false">
            {toasts.map(toast => (
                <div
                    key={toast.toastId}
                    className="toast-item"
                    onClick={() => handleClick(toast)}
                    role="status"
                >
                    <div className={`toast-icon ${colorForType(toast.type)}`}>
                        {iconForType(toast.type)}
                    </div>
                    <div className="toast-body">
                        <div className="toast-title">{toast.title}</div>
                        <div className="toast-message">{toast.message}</div>
                    </div>
                    <button
                        className="toast-close"
                        onClick={(e) => {
                            e.stopPropagation();
                            dismissToast(toast.toastId);
                        }}
                        aria-label="Close"
                    >
                        <FaTimes />
                    </button>
                    <div className="toast-progress"></div>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;