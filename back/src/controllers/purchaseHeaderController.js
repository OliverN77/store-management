const { poolPromise } = require('../config/config');

// Obtener todos los encabezados de compra del usuario autenticado
exports.getPurchaseHeaders = async (req, res) => {
  const { userId } = req.query; // Recibir userId por query parameter
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Purchase Header]';
    let request = pool.request();
    
    // Filtrar por usuario si se proporciona userId
    if (userId) {
      query += ' WHERE [UserId] = @UserId';
      request = request.input('UserId', userId);
    }
    
    const result = await request.query(query);
    console.log(`Purchase Headers for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener encabezados de compra:', err);
    res.status(500).json({ message: 'Error al obtener encabezados de compra', error: err.message });
  }
};

// Función helper para generar el siguiente número de documento único (sin cambios)
const getNextDocumentNumber = async (pool, documentType) => {
  try {
    // Obtener el máximo número para cualquier tipo de documento (no solo el tipo específico)
    const result = await pool.request()
      .query(`
        SELECT MAX(CAST([No_] AS INT)) as MaxNo 
        FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] 
        WHERE ISNUMERIC([No_]) = 1
      `);
    
    const maxNo = result.recordset[0]?.MaxNo || 0;
    const newNo = maxNo + 1;
    
    console.log('Next document number calculation:', { maxNo, newNo, documentType });
    
    return newNo.toString();
  } catch (err) {
    console.error('Error getting next document number:', err);
    // Fallback más robusto: usar timestamp con prefijo para evitar conflictos
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${timestamp}${randomSuffix}`;
  }
};

// Función para verificar disponibilidad de número (sin cambios)
const isDocumentNumberAvailable = async (pool, documentType, documentNo) => {
  try {
    const result = await pool.request()
      .input('DocumentType', documentType)
      .input('No_', documentNo)
      .query(`
        SELECT COUNT(*) as count 
        FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] 
        WHERE [Document Type] = @DocumentType AND [No_] = @No_
      `);
    
    return result.recordset[0].count === 0;
  } catch (err) {
    console.error('Error checking document availability:', err);
    return false;
  }
};

// Crear un encabezado de compra
exports.createPurchaseHeader = async (req, res) => {
  const {
    DocumentType = 1,
    No_,
    BuyfromVendorNo,
    PayToVendorNo,
    DocumentDate,
    PostingDate,
    DueDate,
    PaymentTermsCode,
    CurrencyCode,
    Status = 'Activo',
    AmountIncludingVAT = 0,
    UserId // Agregar UserId
  } = req.body;

  // Validar que se proporcione UserId
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }

  console.log('Datos recibidos para crear purchase header:', req.body);

  try {
    const pool = await poolPromise;
    
    let documentNo = No_;
    
    // Si No_ está vacío o no se proporciona, generar uno automáticamente
    if (!documentNo || documentNo.trim() === '') {
      let attempts = 0;
      const maxAttempts = 5;
      
      // Intentar generar un número único hasta 5 veces
      do {
        documentNo = await getNextDocumentNumber(pool, DocumentType);
        attempts++;
        console.log(`Attempt ${attempts}: Generated document number ${documentNo}`);
        
        if (await isDocumentNumberAvailable(pool, DocumentType, documentNo)) {
          console.log(`Document number ${documentNo} is available`);
          break;
        }
        
        if (attempts >= maxAttempts) {
          // Si no puede generar un número único, usar timestamp más específico
          documentNo = `PO${Date.now()}${Math.floor(Math.random() * 10000)}`;
          console.log(`Using fallback document number: ${documentNo}`);
          break;
        }
      } while (attempts < maxAttempts);
    } else {
      // Verificar si el número proporcionado está disponible
      if (!(await isDocumentNumberAvailable(pool, DocumentType, documentNo))) {
        return res.status(400).json({ 
          message: `Error al crear nueva orden: Ya existe una orden con el número ${documentNo}. Por favor use un número diferente.`,
          errorType: 'DUPLICATE_ORDER_NUMBER'
        });
      }
    }
    
    console.log('Final document number to use:', documentNo);
    
    // Insertar el nuevo encabezado
    const insertResult = await pool.request()
      .input('DocumentType', DocumentType)
      .input('No_', documentNo)
      .input('BuyfromVendorNo', BuyfromVendorNo)
      .input('PayToVendorNo', PayToVendorNo || BuyfromVendorNo)
      .input('DocumentDate', DocumentDate)
      .input('PostingDate', PostingDate)
      .input('DueDate', DueDate)
      .input('PaymentTermsCode', PaymentTermsCode || null)
      .input('CurrencyCode', CurrencyCode || 'COP')
      .input('Status', Status)
      .input('AmountIncludingVAT', parseFloat(AmountIncludingVAT) || 0)
      .input('UserId', UserId) // Agregar UserId al insert
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Purchase Header]
        ([Document Type], [No_], [Buy-from Vendor No_], [Pay-to Vendor No_],
         [Document Date], [Posting Date], [Due Date], [Payment Terms Code], 
         [Currency Code], [Status], [Amount Including VAT], [UserId])
        VALUES (@DocumentType, @No_, @BuyfromVendorNo, @PayToVendorNo,
                @DocumentDate, @PostingDate, @DueDate, @PaymentTermsCode,
                @CurrencyCode, @Status, @AmountIncludingVAT, @UserId)
      `);
    
    console.log(`Purchase header created for user ${UserId} with number:`, documentNo);
    
    res.status(201).json({ 
      message: 'Orden de compra creada exitosamente',
      documentNo: documentNo
    });
  } catch (err) {
    console.error('Error al crear encabezado de compra:', err);
    console.error('Full error details:', {
      message: err.message,
      number: err.number,
      state: err.state,
      severity: err.class
    });
    
    // Manejo específico para error de clave duplicada
    if (err.number === 2627) {
      res.status(400).json({ 
        message: 'Error al crear nueva orden: El número de orden ya existe. Por favor intente con un número diferente.',
        errorType: 'DUPLICATE_ORDER_ERROR'
      });
    } else {
      res.status(500).json({ 
        message: 'Error al crear nueva orden: Ocurrió un problema inesperado. Por favor intente nuevamente.',
        errorType: 'CREATION_ERROR'
      });
    }
  }
};

// Actualizar un encabezado de compra (solo si pertenece al usuario)
exports.updatePurchaseHeader = async (req, res) => {
  const { id } = req.params;
  const {
    BuyfromVendorNo,
    PayToVendorNo,
    DocumentDate,
    PostingDate,
    DueDate,
    PaymentTermsCode,
    CurrencyCode,
    Status,
    AmountIncludingVAT,
    UserId // Agregar UserId para validación
  } = req.body;

  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }

  console.log('Actualizando purchase header:', { id, body: req.body });

  try {
    const pool = await poolPromise;
    
    // Verificar que el purchase header pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('No_', id)
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] WHERE [No_] = @No_ AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Documento no encontrado o no tienes permisos para modificarlo' });
    }
    
    await pool.request()
      .input('No_', id)
      .input('BuyfromVendorNo', BuyfromVendorNo)
      .input('PayToVendorNo', PayToVendorNo || BuyfromVendorNo)
      .input('DocumentDate', DocumentDate)
      .input('PostingDate', PostingDate)
      .input('DueDate', DueDate)
      .input('PaymentTermsCode', PaymentTermsCode || null)
      .input('CurrencyCode', CurrencyCode || 'COP')
      .input('Status', Status)
      .input('AmountIncludingVAT', parseFloat(AmountIncludingVAT) || 0)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Purchase Header]
        SET [Buy-from Vendor No_]=@BuyfromVendorNo,
            [Pay-to Vendor No_]=@PayToVendorNo,
            [Document Date]=@DocumentDate,
            [Posting Date]=@PostingDate,
            [Due Date]=@DueDate,
            [Payment Terms Code]=@PaymentTermsCode,
            [Currency Code]=@CurrencyCode,
            [Status]=@Status,
            [Amount Including VAT]=@AmountIncludingVAT
        WHERE [No_]=@No_ AND [UserId]=@UserId
      `);
    res.json({ message: 'Encabezado de compra actualizado' });
  } catch (err) {
    console.error('Error al actualizar encabezado de compra:', err);
    res.status(500).json({ message: 'Error al actualizar encabezado de compra', error: err.message });
  }
};

// Eliminar un encabezado de compra (solo si pertenece al usuario)
exports.deletePurchaseHeader = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // Recibir userId por query parameter
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el purchase header pertenece al usuario antes de eliminar
    const deleteResult = await pool.request()
      .input('No_', id)
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] WHERE [No_]=@No_ AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Documento no encontrado o no tienes permisos para eliminarlo' });
    }
    
    res.json({ message: 'Encabezado de compra eliminado' });
  } catch (err) {
    console.error('Error al eliminar encabezado de compra:', err);
    res.status(500).json({ message: 'Error al eliminar encabezado de compra', error: err.message });
  }
};