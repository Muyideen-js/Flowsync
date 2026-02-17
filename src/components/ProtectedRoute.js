import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0a0a0a',
            }}>
                <div style={{
                    width: 28,
                    height: 28,
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#00c93a',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                }} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
