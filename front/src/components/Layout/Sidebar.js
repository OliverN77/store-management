import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuSections = [
    {
      title: 'Principal',
      items: [
        { path: '/dashboard', label: 'Panel', icon: '📊' },
      ]
    },
    {
      title: 'Movimientos',
      items: [
        { path: '/products', label: 'Productos', icon: '📦' },
        { path: '/customers', label: 'Clientes', icon: '👥' },
        { path: '/vendors', label: 'Proveedores', icon: '🏢' },
        { path: '/payment-terms', label: 'Términos de Pago', icon: '💳' },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { path: '/sales-headers', label: 'Órdenes de Venta', icon: '📋' },
        { path: '/sales-lines', label: 'Líneas de Venta', icon: '📝' },
        { path: '/purchase-headers', label: 'Órdenes de Compra', icon: '🛒' },
        { path: '/purchase-lines', label: 'Líneas de Compra', icon: '📄' },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { path: '/item-ledger-entries', label: 'Movimientos de Inventario', icon: '📈' },
      ]
    }
  ];

  const handleLinkClick = () => {
    // Cerrar sidebar en móvil al hacer clic en un enlace
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Close button clicked'); // Debug
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Gestión de tiendas</h2>
        {/* Botón X para cerrar en móvil */}
        <button 
          className="sidebar-close-btn"
          onClick={handleCloseClick}
          aria-label="Close menu"
          type="button"
        >
          ×
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
