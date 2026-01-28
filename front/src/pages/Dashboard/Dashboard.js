import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Layout/Header';
import PieChart from '../../components/Charts/PieChart';
import { dashboardService } from '../../services/dataService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCustomers: 0,
    totalVendors: 0,
    activePurchases: 0,
    activePurchaseCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [activePurchases, setActivePurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Agregar el ID del usuario a las peticiones
      const [statsResponse, activityResponse, lowStockResponse, activePurchasesResponse] = await Promise.all([
        dashboardService.getStats(user.id),
        dashboardService.getRecentActivity(user.id),
        dashboardService.getLowStock(user.id),
        dashboardService.getActivePurchaseOrders(user.id)
      ]);
      
      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
      setLowStock(lowStockResponse.data);
      setActivePurchases(activePurchasesResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos del panel:', err);
      setError('Error al cargar datos del panel');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Datos para las gráficas de pastel
  const entitiesChartData = [
    { label: 'Productos', value: stats.totalItems },
    { label: 'Clientes', value: stats.totalCustomers },
    { label: 'Proveedores', value: stats.totalVendors }
  ];

  const purchaseStatusChartData = [
    { 
      label: 'Órdenes Activas', 
      value: stats.activePurchaseCount 
    },
    { 
      label: 'Órdenes Completadas', 
      value: Math.floor(stats.activePurchaseCount * 0.7)
    },
    { 
      label: 'Órdenes Pendientes', 
      value: Math.floor(stats.activePurchaseCount * 0.3)
    }
  ];

  const statsCards = [
    { 
      title: 'Total Productos', 
      value: stats.totalItems.toLocaleString(), 
      icon: '📦', 
      color: 'blue' 
    },
    { 
      title: 'Clientes', 
      value: stats.totalCustomers.toLocaleString(), 
      icon: '👥', 
      color: 'green' 
    },
    { 
      title: 'Proveedores', 
      value: stats.totalVendors.toLocaleString(), 
      icon: '🏢', 
      color: 'purple' 
    },
    { 
      title: 'Órdenes Activas', 
      value: `${stats.activePurchaseCount} (${formatCurrency(stats.activePurchases)})`, 
      icon: '📋', 
      color: 'orange' 
    },
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <Header title={`Panel de ${user?.firstName || 'Usuario'}`} />
        <div className="loading">Cargando tu panel personalizado...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header title={`Panel de ${user?.firstName || 'Usuario'}`} />
      
      {error && <div className="error-banner">{error}</div>}
      
      {/* Mensaje de bienvenida personalizado */}
      <div className="welcome-message">
        <h2>¡Bienvenido de vuelta, {user?.firstName}! 👋</h2>
        <p>Aquí tienes un resumen de tu actividad empresarial</p>
      </div>
      
      <div className="dashboard-stats">
        {statsCards.map((stat, index) => (
          <div key={index} className={`stat-card stat-card--${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-title">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de gráficas */}
      <div className="dashboard-charts">
        <div className="dashboard-card chart-card">
          <PieChart 
            title="Distribución de Entidades" 
            data={entitiesChartData}
            colors={['#4A90E2', '#50E3C2', '#B266D9']}
          />
        </div>
        
        <div className="dashboard-card chart-card">
          <PieChart 
            title="Estado de Órdenes de Compra" 
            data={purchaseStatusChartData}
            colors={['#F5A623', '#50E3C2', '#D0021B']}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="card-title">Actividad Reciente</h3>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-icon">{activity.icon}</span>
                  <div className="activity-content">
                    <span className="activity-message">{activity.message}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No hay actividad reciente</div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Inventario Bajo</h3>
          <div className="inventory-list">
            {lowStock.length > 0 ? (
              lowStock.map((item, index) => (
                <div key={index} className="inventory-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-code">({item.itemNo})</span>
                  </div>
                  <span className={`item-stock ${item.status}`}>
                    {item.stock} {item.stock === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
              ))
            ) : (
              <div className="no-data">Todos los productos tienen stock suficiente</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={fetchDashboardData} className="refresh-button">
          🔄 Actualizar Datos
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
