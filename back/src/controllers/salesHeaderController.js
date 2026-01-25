const { poolPromise } = require('../config/config');

// Obtener todos los encabezados de venta del usuario autenticado
exports.getSalesHeaders = async (req, res) => {
  const { userId } = req.query; // Recibir userId por query parameter
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Sales Header]';
    let request = pool.request();
    
    // Filtrar por usuario si se proporciona userId
    if (userId) {
      query += ' WHERE [UserId] = @UserId';
      request = request.input('UserId', userId);
    }
    
    const result = await request.query(query);
    console.log(`Sales Headers for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener encabezados de venta:', err);
    res.status(500).json({ message: 'Error al obtener encabezados de venta', error: err.message });
  }
};

// Crear un encabezado de venta
exports.createSalesHeader = async (req, res) => {
  const { 
    DocumentType = 1, 
    No_, 
    SellToCustomerNo, 
    BillToCustomerNo, 
    DocumentDate, 
    PostingDate, 
    DueDate, 
    PaymentTermsCode, 
    CurrencyCode, 
    PricesIncludingVAT = 0, 
    Status = 'Abierto',
    AmountIncludingVAT = 0,
    UserId // Agregar UserId
  } = req.body;
  
  // Validar que se proporcione UserId
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  // Validar que el estado sea uno de los permitidos
  const validStatuses = ['Abierto', 'Cerrado', 'Pendiente'];
  if (!validStatuses.includes(Status)) {
    return res.status(400).json({ 
      message: 'Estado inválido. Debe ser: Abierto, Cerrado o Pendiente' 
    });
  }
  
  console.log('Datos recibidos para crear sales header:', req.body);
  
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('DocumentType', DocumentType)
      .input('No_', No_)
      .input('SellToCustomerNo', SellToCustomerNo)
      .input('BillToCustomerNo', BillToCustomerNo || SellToCustomerNo)
      .input('DocumentDate', DocumentDate)
      .input('PostingDate', PostingDate)
      .input('DueDate', DueDate)
      .input('PaymentTermsCode', PaymentTermsCode || null)
      .input('CurrencyCode', CurrencyCode || 'COP')
      .input('PricesIncludingVAT', PricesIncludingVAT)
      .input('Status', Status)
      .input('AmountIncludingVAT', parseFloat(AmountIncludingVAT) || 0)
      .input('UserId', UserId) // Agregar UserId al insert
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Sales Header]
        ([Document Type], [No_], [Sell-to Customer No_], [Bill-to Customer No_], 
         [Document Date], [Posting Date], [Due Date], [Payment Terms Code], 
         [Currency Code], [Prices Including VAT], [Status], [Amount Including VAT], [UserId])
        VALUES (@DocumentType, @No_, @SellToCustomerNo, @BillToCustomerNo, 
                @DocumentDate, @PostingDate, @DueDate, @PaymentTermsCode, 
                @CurrencyCode, @PricesIncludingVAT, @Status, @AmountIncludingVAT, @UserId)
      `);
    console.log(`Sales header created for user ${UserId}`);
    res.status(201).json({ message: 'Encabezado de venta creado' });
  } catch (err) {
    console.error('Error al crear encabezado de venta:', err);
    res.status(500).json({ message: 'Error al crear encabezado de venta', error: err.message });
  }
};

// Actualizar un encabezado de venta (solo si pertenece al usuario)
exports.updateSalesHeader = async (req, res) => {
  const { id } = req.params;
  const { 
    SellToCustomerNo, 
    BillToCustomerNo, 
    DocumentDate, 
    PostingDate, 
    DueDate, 
    PaymentTermsCode, 
    CurrencyCode, 
    PricesIncludingVAT, 
    Status, 
    AmountIncludingVAT,
    UserId // Agregar UserId para validación
  } = req.body;
  
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  // Validar que el estado sea uno de los permitidos
  if (Status) {
    const validStatuses = ['Abierto', 'Cerrado', 'Pendiente'];
    if (!validStatuses.includes(Status)) {
      return res.status(400).json({ 
        message: 'Estado inválido. Debe ser: Abierto, Cerrado o Pendiente' 
      });
    }
  }
  
  console.log('Actualizando sales header:', { id, body: req.body });
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el sales header pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('No_', id)
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Sales Header] WHERE [No_] = @No_ AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Encabezado de venta no encontrado o no tienes permisos para modificarlo' });
    }
    
    await pool.request()
      .input('No_', id)
      .input('SellToCustomerNo', SellToCustomerNo)
      .input('BillToCustomerNo', BillToCustomerNo || SellToCustomerNo)
      .input('DocumentDate', DocumentDate)
      .input('PostingDate', PostingDate)
      .input('DueDate', DueDate)
      .input('PaymentTermsCode', PaymentTermsCode || null)
      .input('CurrencyCode', CurrencyCode || 'COP')
      .input('PricesIncludingVAT', PricesIncludingVAT || 0)
      .input('Status', Status)
      .input('AmountIncludingVAT', parseFloat(AmountIncludingVAT) || 0)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Sales Header]
        SET [Sell-to Customer No_]=@SellToCustomerNo, 
            [Bill-to Customer No_]=@BillToCustomerNo,
            [Document Date]=@DocumentDate, 
            [Posting Date]=@PostingDate, 
            [Due Date]=@DueDate,
            [Payment Terms Code]=@PaymentTermsCode, 
            [Currency Code]=@CurrencyCode,
            [Prices Including VAT]=@PricesIncludingVAT, 
            [Status]=@Status,
            [Amount Including VAT]=@AmountIncludingVAT
        WHERE [No_]=@No_ AND [UserId]=@UserId
      `);
    res.json({ message: 'Encabezado de venta actualizado' });
  } catch (err) {
    console.error('Error al actualizar encabezado de venta:', err);
    res.status(500).json({ message: 'Error al actualizar encabezado de venta', error: err.message });
  }
};

// Eliminar un encabezado de venta (solo si pertenece al usuario)
exports.deleteSalesHeader = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // Recibir userId por query parameter
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el sales header pertenece al usuario antes de eliminar
    const deleteResult = await pool.request()
      .input('No_', id)
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Sales Header] WHERE [No_]=@No_ AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Encabezado de venta no encontrado o no tienes permisos para eliminarlo' });
    }
    
    res.json({ message: 'Encabezado de venta eliminado' });
  } catch (err) {
    console.error('Error al eliminar encabezado de venta:', err);
    res.status(500).json({ message: 'Error al eliminar encabezado de venta', error: err.message });
  }
};