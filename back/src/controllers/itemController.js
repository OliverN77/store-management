const { poolPromise } = require('../config/config');

// Obtener todos los items del usuario autenticado
exports.getItems = async (req, res) => {
  const { userId } = req.query; // Recibir userId por query parameter
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Item]';
    let request = pool.request();
    
    // Filtrar por usuario si se proporciona userId
    if (userId) {
      query += ' WHERE [UserId] = @UserId';
      request = request.input('UserId', userId);
    }
    
    const result = await request.query(query);
    console.log(`Items for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener items:', err);
    res.status(500).json({ message: 'Error al obtener items', error: err.message });
  }
};

// Crear un item
exports.createItem = async (req, res) => {
  const {
    No_, Description, Description2, BaseUnitOfMeasure, Inventory, UnitCost, LastDirectCost,
    UnitPrice, ItemCategoryCode, ProductGroupCode, InventoryPostingGroup, VendorNo,
    Blocked, CreatedAt, UserId // Agregar UserId
  } = req.body;
  
  // Validar que se proporcione UserId
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  console.log('Datos recibidos para crear item:', req.body);
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('No_', No_)
      .input('Description', Description)
      .input('Description2', Description2)
      .input('BaseUnitOfMeasure', BaseUnitOfMeasure)
      .input('Inventory', parseFloat(Inventory) || 0)
      .input('UnitCost', parseFloat(UnitCost) || 0)
      .input('LastDirectCost', parseFloat(LastDirectCost) || 0)
      .input('UnitPrice', parseFloat(UnitPrice) || 0)
      .input('ItemCategoryCode', ItemCategoryCode)
      .input('ProductGroupCode', ProductGroupCode)
      .input('InventoryPostingGroup', InventoryPostingGroup)
      .input('VendorNo', VendorNo || null)
      .input('Blocked', Blocked)
      .input('CreatedAt', CreatedAt || new Date().toISOString())
      .input('UserId', UserId) // Agregar UserId al insert
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Item]
        ([No_], [Description], [Description 2], [Base Unit of Measure], [Inventory], [Unit Cost], [Last Direct Cost], [Unit Price], [Item Category Code], [Product Group Code], [Inventory Posting Group], [Vendor No_], [Blocked], [Created At], [UserId])
        VALUES (@No_, @Description, @Description2, @BaseUnitOfMeasure, @Inventory, @UnitCost, @LastDirectCost, @UnitPrice, @ItemCategoryCode, @ProductGroupCode, @InventoryPostingGroup, @VendorNo, @Blocked, @CreatedAt, @UserId)
      `);
    
    console.log(`Item created for user ${UserId}`);
    res.status(201).json({ message: 'Item creado exitosamente', itemNo: No_ });
  } catch (err) {
    console.error('Error al crear item:', err);
    res.status(500).json({ message: 'Error al crear item', error: err.message });
  }
};

// Actualizar un item (solo si pertenece al usuario)
exports.updateItem = async (req, res) => {
  const { id } = req.params; // id = No_
  const {
    Description, Description2, BaseUnitOfMeasure, Inventory, UnitCost, LastDirectCost,
    UnitPrice, ItemCategoryCode, ProductGroupCode, InventoryPostingGroup, VendorNo,
    Blocked, UserId // Agregar UserId para validación
  } = req.body;

  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el item pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('No_', id)
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Item] WHERE [No_] = @No_ AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Item no encontrado o no tienes permisos para modificarlo' });
    }
    
    await pool.request()
      .input('No_', id)
      .input('Description', Description)
      .input('Description2', Description2)
      .input('BaseUnitOfMeasure', BaseUnitOfMeasure)
      .input('Inventory', Inventory)
      .input('UnitCost', UnitCost)
      .input('LastDirectCost', LastDirectCost)
      .input('UnitPrice', UnitPrice)
      .input('ItemCategoryCode', ItemCategoryCode)
      .input('ProductGroupCode', ProductGroupCode)
      .input('InventoryPostingGroup', InventoryPostingGroup)
      .input('VendorNo', VendorNo)
      .input('Blocked', Blocked)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Item]
        SET [Description]=@Description, [Description 2]=@Description2, [Base Unit of Measure]=@BaseUnitOfMeasure,
            [Inventory]=@Inventory, [Unit Cost]=@UnitCost, [Last Direct Cost]=@LastDirectCost, [Unit Price]=@UnitPrice,
            [Item Category Code]=@ItemCategoryCode, [Product Group Code]=@ProductGroupCode,
            [Inventory Posting Group]=@InventoryPostingGroup, [Vendor No_]=@VendorNo, [Blocked]=@Blocked
        WHERE [No_]=@No_ AND [UserId]=@UserId
      `);
    res.json({ message: 'Item actualizado' });
  } catch (err) {
    console.error('Error al actualizar item:', err);
    res.status(500).json({ message: 'Error al actualizar item', error: err.message });
  }
};

// Eliminar un item (solo si pertenece al usuario)
exports.deleteItem = async (req, res) => {
  const { id } = req.params; // id = No_
  const { userId } = req.query; // Recibir userId por query parameter
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el item pertenece al usuario antes de eliminar
    const deleteResult = await pool.request()
      .input('No_', id)
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Item] WHERE [No_]=@No_ AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Item no encontrado o no tienes permisos para eliminarlo' });
    }
    
    res.json({ message: 'Item eliminado' });
  } catch (err) {
    console.error('Error al eliminar item:', err);
    res.status(500).json({ message: 'Error al eliminar item', error: err.message });
  }
};