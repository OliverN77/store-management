import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Auth/Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.125rem'
      }}>
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute;
