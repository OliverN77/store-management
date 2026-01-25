const { poolPromise } = require('../config/config');

// Obtener estadísticas generales por usuario
const getStats = async (req, res) => {
  const { userId } = req.params; // Obtenemos el userId de la URL
  
  try {
    const pool = await poolPromise;
    
    // Obtener total de productos del usuario
    const itemsResult = await pool.request()
      .input('UserId', userId)
      .query('SELECT COUNT(*) as totalItems FROM [OLIVER SOLUTIONS S.A.S$Item] WHERE [UserId] = @UserId');
    
    // Obtener total de clientes del usuario
    const customersResult = await pool.request()
      .input('UserId', userId)
      .query('SELECT COUNT(*) as totalCustomers FROM [OLIVER SOLUTIONS S.A.S$Customer] WHERE [UserId] = @UserId');
    
    // Obtener total de proveedores del usuario
    const vendorsResult = await pool.request()
      .input('UserId', userId)
      .query('SELECT COUNT(*) as totalVendors FROM [OLIVER SOLUTIONS S.A.S$Vendor] WHERE [UserId] = @UserId');
    
    // Obtener órdenes de compra activas del usuario con saldo
    const activePurchasesResult = await pool.request()
      .input('UserId', userId)
      .query(`
        SELECT ISNULL(SUM([Amount Including VAT]), 0) as activePurchases,
               COUNT(*) as activePurchaseCount
        FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] 
        WHERE [Status] = 'Activo' 
        AND [Amount Including VAT] > 0
        AND [UserId] = @UserId
      `);

    const stats = {
      totalItems: itemsResult.recordset[0].totalItems,
      totalCustomers: customersResult.recordset[0].totalCustomers,
      totalVendors: vendorsResult.recordset[0].totalVendors,
      activePurchases: activePurchasesResult.recordset[0].activePurchases || 0,
      activePurchaseCount: activePurchasesResult.recordset[0].activePurchaseCount || 0
    };

    console.log(`Dashboard stats for user ${userId}:`, stats);
    res.json(stats);
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: err.message });
  }
};

// Obtener actividad reciente del usuario
const getRecentActivity = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const pool = await poolPromise;
    
    const activities = [];
    
    // Últimos productos agregados por el usuario
    try {
      const recentItemsResult = await pool.request()
        .input('UserId', userId)
        .query(`
          SELECT TOP 2 [No_], [Description] 
          FROM [OLIVER SOLUTIONS S.A.S$Item] 
          WHERE [UserId] = @UserId
          ORDER BY [No_] DESC
        `);
      
      recentItemsResult.recordset.forEach(item => {
        activities.push({
          type: 'product',
          icon: '📦',
          message: `Nuevo producto agregado: "${item.Description}"`,
          time: 'Reciente'
        });
      });
    } catch (err) {
      console.log('Error getting recent items:', err.message);
    }

    // Últimos clientes registrados por el usuario
    try {
      const recentCustomersResult = await pool.request()
        .input('UserId', userId)
        .query(`
          SELECT TOP 1 [No_], [Name] 
          FROM [OLIVER SOLUTIONS S.A.S$Customer] 
          WHERE [UserId] = @UserId
          ORDER BY [No_] DESC
        `);
      
      recentCustomersResult.recordset.forEach(customer => {
        activities.push({
          type: 'customer',
          icon: '👥',
          message: `Cliente registrado: "${customer.Name}"`,
          time: 'Reciente'
        });
      });
    } catch (err) {
      console.log('Error getting recent customers:', err.message);
    }

    // Últimas órdenes de compra creadas por el usuario
    try {
      const recentPurchasesResult = await pool.request()
        .input('UserId', userId)
        .query(`
          SELECT TOP 3 [No_], [Amount Including VAT], [Document Date], [Status]
          FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] 
          WHERE [UserId] = @UserId
          ORDER BY [Document Date] DESC
        `);
      
      recentPurchasesResult.recordset.forEach(purchase => {
        activities.push({
          type: 'purchase',
          icon: purchase.Status === 'Activo' ? '📋' : '⏳',
          message: `Orden de compra #${purchase['No_']}: $${Number(purchase['Amount Including VAT'] || 0).toLocaleString()}`,
          time: purchase['Document Date'] ? new Date(purchase['Document Date']).toLocaleDateString() : 'Reciente'
        });
      });
    } catch (err) {
      console.log('Error getting recent purchases:', err.message);
    }

    // Limitar a 5 actividades más recientes
    const sortedActivities = activities.slice(0, 5);
    
    console.log(`Dashboard recent activity for user ${userId}:`, sortedActivities);
    res.json(sortedActivities);
  } catch (err) {
    console.error('Error al obtener actividad reciente:', err);
    res.status(500).json({ message: 'Error al obtener actividad reciente', error: err.message });
  }
};

// Obtener productos con inventario bajo del usuario
const getLowStock = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const pool = await poolPromise;
    
    // Obtener productos del usuario
    const lowStockResult = await pool.request()
      .input('UserId', userId)
      .query(`
        SELECT TOP 10
          [No_], 
          [Description]
        FROM [OLIVER SOLUTIONS S.A.S$Item]
        WHERE [UserId] = @UserId
        ORDER BY [No_]
      `);

    const lowStockItems = lowStockResult.recordset.map((item, index) => ({
      itemNo: item['No_'],
      name: item.Description,
      stock: Math.floor(Math.random() * 10) + 1, // Stock simulado para demo
      status: index < 2 ? 'critical' : index < 5 ? 'low' : 'warning'
    }));

    console.log(`Dashboard low stock for user ${userId}:`, lowStockItems);
    res.json(lowStockItems);
  } catch (err) {
    console.error('Error al obtener inventario bajo:', err);
    res.status(500).json({ message: 'Error al obtener inventario bajo', error: err.message });
  }
};

// Obtener órdenes de compra activas del usuario con detalle
const getActivePurchaseOrders = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const pool = await poolPromise;
    
    const activePurchasesResult = await pool.request()
      .input('UserId', userId)
      .query(`
        SELECT TOP 10
          ph.[No_],
          ph.[Buy-from Vendor No_],
          v.[Name] as VendorName,
          ph.[Document Date],
          ph.[Due Date],
          ph.[Amount Including VAT],
          ph.[Status]
        FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] ph
        LEFT JOIN [OLIVER SOLUTIONS S.A.S$Vendor] v ON ph.[Buy-from Vendor No_] = v.[No_] AND v.[UserId] = @UserId
        WHERE ph.[Status] = 'Activo' 
        AND ph.[Amount Including VAT] > 0
        AND ph.[UserId] = @UserId
        ORDER BY ph.[Document Date] DESC
      `);

    const activePurchases = activePurchasesResult.recordset.map(purchase => ({
      orderNo: purchase['No_'],
      vendorNo: purchase['Buy-from Vendor No_'],
      vendorName: purchase.VendorName || 'Sin nombre',
      documentDate: purchase['Document Date'],
      dueDate: purchase['Due Date'],
      amount: purchase['Amount Including VAT'] || 0,
      status: purchase.Status
    }));

    console.log(`Dashboard active purchases for user ${userId}:`, activePurchases);
    res.json(activePurchases);
  } catch (err) {
    console.error('Error al obtener órdenes de compra activas:', err);
    res.status(500).json({ message: 'Error al obtener órdenes de compra activas', error: err.message });
  }
};

module.exports = {
  getStats,
  getRecentActivity,
  getLowStock,
  getActivePurchaseOrders
};