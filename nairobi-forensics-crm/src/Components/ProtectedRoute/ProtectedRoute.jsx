// src/Components/ProtectedRoute/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, logoutReason } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#050A30',
                color: '#fff',
                fontFamily: 'Montserrat, sans-serif'
            }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={logoutReason === 'timeout' ? '/' : '/login'} replace />;
    }

    return children;
};

export default ProtectedRoute;