import { useEffect } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Keep',
    onConfirm,
    onCancel
}) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return (
        <div className="confirm-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCancel();
        }}>
            <section
                className="confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <button
                    className="confirm-close"
                    type="button"
                    aria-label="Close confirmation"
                    onClick={onCancel}
                >
                    <FaTimes />
                </button>
                <div className="confirm-icon"><FaExclamationTriangle /></div>
                <h2 id="confirm-dialog-title">{title}</h2>
                <p id="confirm-dialog-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-cancel" type="button" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button className="confirm-submit" type="button" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ConfirmDialog;
