import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    console.log('Toggle sidebar:', !sidebarOpen); // Debug
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    console.log('Close sidebar'); // Debug
    setSidebarOpen(false);
  };

  // Cerrar sidebar al hacer clic fuera de ella
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Solo cerrar si está abierto y el clic no es en la sidebar o el botón toggle
      if (sidebarOpen && 
          !event.target.closest('.sidebar') && 
          !event.target.closest('.sidebar-toggle-btn')) {
        console.log('Outside click detected'); // Debug
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('click', handleOutsideClick);
      document.body.style.overflow = 'hidden'; // Prevenir scroll en mobile
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Cerrar sidebar al cambiar de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout">
      {/* Botón hamburguesa */}
      <button 
        className="sidebar-toggle-btn" 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
        type="button"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Contenido principal */}
      <div className="layout-content">
        <div className="container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
