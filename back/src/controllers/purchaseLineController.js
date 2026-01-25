const { poolPromise } = require('../config/config');

// Obtener todas las líneas de compra
exports.getPurchaseLines = async (req, res) => {
  const { userId } = req.query; // IGUAL que customerController
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Purchase Line]';
    let request = pool.request();
    
    if (userId) {
      query += ' WHERE [UserId] = @UserId';
      request = request.input('UserId', userId);
    }
    
    const result = await request.query(query);
    console.log(`Purchase Lines for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener líneas de compra:', err);
    res.status(500).json({ message: 'Error al obtener líneas de compra', error: err.message });
  }
};

// Crear una línea de compra
exports.createPurchaseLine = async (req, res) => {
  const {
    DocumentType = 1,
    DocumentNo,
    LineNo,
    Type = 2,
    No_,
    Description,
    Quantity = 1,
    UnitOfMeasureCode = 'UND',
    DirectUnitCost = 0,
    LineDiscountPct = 0,
    LineAmount = 0,
    UserId // UserId del body
  } = req.body;

  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }

  console.log('Datos recibidos para crear purchase line:', req.body);

  try {
    const pool = await poolPromise;
    
    // NUEVO: Verificar si ya existe la combinación DocumentNo + LineNo
    const existingLine = await pool.request()
      .input('DocumentNo', DocumentNo)
      .input('LineNo', LineNo)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Purchase Line] WHERE [Document No_] = @DocumentNo AND [Line No_] = @LineNo');
    
    let finalLineNo = LineNo;
    
    if (existingLine.recordset[0].count > 0) {
      // Si existe, generar un nuevo número de línea
      const maxLineResult = await pool.request()
        .input('DocumentNo', DocumentNo)
        .query('SELECT MAX([Line No_]) as maxLine FROM [OLIVER SOLUTIONS S.A.S$Purchase Line] WHERE [Document No_] = @DocumentNo');
      
      finalLineNo = (parseInt(maxLineResult.recordset[0].maxLine || 0) + 10000);
      
      console.log(`Line No ${LineNo} already exists for Document ${DocumentNo}. Using new Line No: ${finalLineNo}`);
    }
    
    // Insertar con el número de línea final (original o nuevo)
    await pool.request()
      .input('DocumentType', DocumentType)
      .input('DocumentNo', DocumentNo)
      .input('LineNo', finalLineNo) // Usar el número final
      .input('Type', Type)
      .input('No_', No_)
      .input('Description', Description)
      .input('Quantity', parseFloat(Quantity) || 0)
      .input('UnitOfMeasureCode', UnitOfMeasureCode)
      .input('DirectUnitCost', parseFloat(DirectUnitCost) || 0)
      .input('LineDiscountPct', parseFloat(LineDiscountPct) || 0)
      .input('LineAmount', parseFloat(LineAmount) || 0)
      .input('UserId', UserId)
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Purchase Line]
        ([Document Type], [Document No_], [Line No_], [Type], [No_], 
         [Description], [Quantity], [Unit of Measure Code], [Direct Unit Cost], 
         [Line Discount %], [Line Amount], [UserId])
        VALUES (@DocumentType, @DocumentNo, @LineNo, @Type, @No_,
                @Description, @Quantity, @UnitOfMeasureCode, @DirectUnitCost,
                @LineDiscountPct, @LineAmount, @UserId)
      `);
    
    console.log(`Purchase Line created for user ${UserId} with Line No: ${finalLineNo}`);
    res.status(201).json({ 
      message: 'Línea de compra creada', 
      lineNo: finalLineNo 
    });
  } catch (err) {
    console.error('Error al crear línea de compra:', err);
    res.status(500).json({ message: 'Error al crear línea de compra', error: err.message });
  }
};

// Actualizar una línea de compra
exports.updatePurchaseLine = async (req, res) => {
  const { id } = req.params;
  const [documentNo, lineNo] = id.split('-');
  
  const {
    Type,
    No_,
    Description,
    Quantity,
    UnitOfMeasureCode,
    DirectUnitCost,
    LineDiscountPct,
    LineAmount,
    UserId // UserId del body
  } = req.body;

  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }

  console.log('Actualizando purchase line:', { documentNo, lineNo, body: req.body });

  try {
    const pool = await poolPromise;
    
    // Verificar que la línea pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('DocumentNo', documentNo)
      .input('LineNo', parseInt(lineNo))
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Purchase Line] WHERE [Document No_] = @DocumentNo AND [Line No_] = @LineNo AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Línea de compra no encontrada o no tienes permisos para modificarla' });
    }
    
    const result = await pool.request()
      .input('DocumentNo', documentNo)
      .input('LineNo', parseInt(lineNo))
      .input('Type', Type || 2)
      .input('No_', No_)
      .input('Description', Description)
      .input('Quantity', parseFloat(Quantity) || 0)
      .input('UnitOfMeasureCode', UnitOfMeasureCode)
      .input('DirectUnitCost', parseFloat(DirectUnitCost) || 0)
      .input('LineDiscountPct', parseFloat(LineDiscountPct) || 0)
      .input('LineAmount', parseFloat(LineAmount) || 0)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Purchase Line]
        SET [Type]=@Type, [No_]=@No_, [Description]=@Description,
            [Quantity]=@Quantity, [Unit of Measure Code]=@UnitOfMeasureCode,
            [Direct Unit Cost]=@DirectUnitCost, [Line Discount %]=@LineDiscountPct,
            [Line Amount]=@LineAmount
        WHERE [Document No_]=@DocumentNo AND [Line No_]=@LineNo AND [UserId]=@UserId
      `);
    
    console.log(`Purchase Line ${id} updated for user ${UserId}`);
    res.json({ message: 'Línea de compra actualizada' });
  } catch (err) {
    console.error('Error al actualizar línea de compra:', err);
    res.status(500).json({ message: 'Error al actualizar línea de compra', error: err.message });
  }
};

// Eliminar una línea de compra
exports.deletePurchaseLine = async (req, res) => {
  const { id } = req.params;
  const [documentNo, lineNo] = id.split('-');
  const { userId } = req.query; // userId del query
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    const deleteResult = await pool.request()
      .input('DocumentNo', documentNo)
      .input('LineNo', parseInt(lineNo))
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Purchase Line] WHERE [Document No_]=@DocumentNo AND [Line No_]=@LineNo AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Línea de compra no encontrada o no tienes permisos para eliminarla' });
    }
    
    console.log(`Purchase Line ${id} deleted for user ${userId}`);
    res.json({ message: 'Línea de compra eliminada' });
  } catch (err) {
    console.error('Error al eliminar línea de compra:', err);
    res.status(500).json({ message: 'Error al eliminar línea de compra', error: err.message });
  }
};