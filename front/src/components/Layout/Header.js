import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = ({ title }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        <div className="user-info">
          <div className="user-details">
            <span className="user-name">
              👋 Hola, {user?.firstName || 'Usuario'}
            </span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="logout-button"
            title="Cerrar sesión"
          >
            🚪 Salir
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
