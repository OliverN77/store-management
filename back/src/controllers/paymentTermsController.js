const { poolPromise } = require('../config/config');

// Obtener todos los términos de pago
exports.getPaymentTerms = async (req, res) => {
  const { userId } = req.query; // IGUAL que customerController
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Payment Terms]';
    let request = pool.request();
    
    // Filtrar por usuario si se proporciona userId
    if (userId) {
      query += ' WHERE [UserId] = @UserId';
      request = request.input('UserId', userId);
    }
    
    const result = await request.query(query);
    console.log(`Payment Terms for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener términos de pago:', err);
    res.status(500).json({ message: 'Error al obtener términos de pago', error: err.message });
  }
};

// Crear un término de pago
exports.createPaymentTerm = async (req, res) => {
  const { Code, Description, DueDateCalculation, UserId } = req.body; // UserId del body
  
  // Validar que se proporcione UserId
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  console.log('Datos recibidos para crear término de pago:', req.body);
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Code', Code)
      .input('Description', Description)
      .input('DueDateCalculation', DueDateCalculation || null)
      .input('UserId', UserId)
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Payment Terms]
        ([Code], [Description], [Due Date Calculation], [UserId])
        VALUES (@Code, @Description, @DueDateCalculation, @UserId)
      `);
    console.log(`Payment Term ${Code} created for user ${UserId}`);
    res.status(201).json({ message: 'Término de pago creado' });
  } catch (err) {
    console.error('Error al crear término de pago:', err);
    res.status(500).json({ message: 'Error al crear término de pago', error: err.message });
  }
};

// Actualizar un término de pago
exports.updatePaymentTerm = async (req, res) => {
  const { id } = req.params;
  const { Description, DueDateCalculation, UserId } = req.body; // UserId del body
  
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  console.log('Actualizando término de pago:', { id, body: req.body });
  try {
    const pool = await poolPromise;
    
    // Verificar que el término pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('Code', id)
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Payment Terms] WHERE [Code] = @Code AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Término de pago no encontrado o no tienes permisos para modificarlo' });
    }
    
    await pool.request()
      .input('Code', id)
      .input('Description', Description)
      .input('DueDateCalculation', DueDateCalculation || null)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Payment Terms]
        SET [Description]=@Description, [Due Date Calculation]=@DueDateCalculation
        WHERE [Code]=@Code AND [UserId]=@UserId
      `);
    
    console.log(`Payment Term ${id} updated for user ${UserId}`);
    res.json({ message: 'Término de pago actualizado' });
  } catch (err) {
    console.error('Error al actualizar término de pago:', err);
    res.status(500).json({ message: 'Error al actualizar término de pago', error: err.message });
  }
};

// Eliminar un término de pago
exports.deletePaymentTerm = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // userId del query como en customerController
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Eliminar solo si pertenece al usuario
    const deleteResult = await pool.request()
      .input('Code', id)
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Payment Terms] WHERE [Code]=@Code AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Término de pago no encontrado o no tienes permisos para eliminarlo' });
    }
    
    console.log(`Payment Term ${id} deleted for user ${userId}`);
    res.json({ message: 'Término de pago eliminado' });
  } catch (err) {
    console.error('Error al eliminar término de pago:', err);
    res.status(500).json({ message: 'Error al eliminar término de pago', error: err.message });
  }
};