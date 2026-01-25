const { poolPromise } = require('../config/config');

// Obtener todas las entradas del libro mayor de productos
exports.getItemLedgerEntries = async (req, res) => {
  const { userId } = req.query; // IGUAL que customerController
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Item Ledger Entry]';
    let request = pool.request();
    
    if (userId) {
      query += ' WHERE [UserId] = @UserId ORDER BY [Entry No_] DESC';
      request = request.input('UserId', userId);
    } else {
      query += ' ORDER BY [Entry No_] DESC';
    }
    
    const result = await request.query(query);
    console.log(`Item Ledger Entries for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener entradas del libro mayor:', err);
    res.status(500).json({ message: 'Error al obtener entradas del libro mayor', error: err.message });
  }
};

// Crear una entrada del libro mayor de productos
exports.createItemLedgerEntry = async (req, res) => {
  const {
    ItemNo,
    PostingDate,
    EntryType = 0,
    DocumentNo,
    Quantity = 0,
    RemainingQuantity = 0,
    CostAmountActual = 0,
    UserId // UserId del body
  } = req.body;

  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }

  console.log('Datos recibidos para crear item ledger entry:', req.body);

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('ItemNo', ItemNo)
      .input('PostingDate', PostingDate)
      .input('EntryType', parseInt(EntryType))
      .input('DocumentNo', DocumentNo)
      .input('Quantity', parseFloat(Quantity) || 0)
      .input('RemainingQuantity', parseFloat(RemainingQuantity) || 0)
      .input('CostAmountActual', parseFloat(CostAmountActual) || 0)
      .input('UserId', UserId)
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Item Ledger Entry]
        ([Item No_], [Posting Date], [Entry Type], [Document No_], 
         [Quantity], [Remaining Quantity], [Cost Amount (Actual)], [UserId])
        VALUES (@ItemNo, @PostingDate, @EntryType, @DocumentNo,
                @Quantity, @RemainingQuantity, @CostAmountActual, @UserId)
      `);
    console.log(`Item Ledger Entry created for user ${UserId}`);
    res.status(201).json({ message: 'Entrada del libro mayor creada' });
  } catch (err) {
    console.error('Error al crear entrada del libro mayor:', err);
    res.status(500).json({ message: 'Error al crear entrada del libro mayor', error: err.message });
  }
};

// Actualizar una entrada del libro mayor de productos
exports.updateItemLedgerEntry = async (req, res) => {
  const { id } = req.params;
  const {
    ItemNo,
    PostingDate,
    EntryType,
    DocumentNo,
    Quantity,
    RemainingQuantity,
    CostAmountActual,
    UserId // UserId del body
  } = req.body;

  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }

  console.log('Actualizando item ledger entry:', { id, body: req.body });

  try {
    const pool = await poolPromise;
    
    // Verificar que la entrada pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('EntryNo', parseInt(id))
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Item Ledger Entry] WHERE [Entry No_] = @EntryNo AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Entrada del libro mayor no encontrada o no tienes permisos para modificarla' });
    }
    
    const result = await pool.request()
      .input('EntryNo', parseInt(id))
      .input('ItemNo', ItemNo)
      .input('PostingDate', PostingDate)
      .input('EntryType', parseInt(EntryType))
      .input('DocumentNo', DocumentNo)
      .input('Quantity', parseFloat(Quantity) || 0)
      .input('RemainingQuantity', parseFloat(RemainingQuantity) || 0)
      .input('CostAmountActual', parseFloat(CostAmountActual) || 0)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Item Ledger Entry]
        SET [Item No_]=@ItemNo, [Posting Date]=@PostingDate, [Entry Type]=@EntryType,
            [Document No_]=@DocumentNo, [Quantity]=@Quantity, 
            [Remaining Quantity]=@RemainingQuantity, [Cost Amount (Actual)]=@CostAmountActual
        WHERE [Entry No_]=@EntryNo AND [UserId]=@UserId
      `);
    
    console.log(`Item Ledger Entry ${id} updated for user ${UserId}`);
    res.json({ message: 'Entrada del libro mayor actualizada' });
  } catch (err) {
    console.error('Error al actualizar entrada del libro mayor:', err);
    res.status(500).json({ message: 'Error al actualizar entrada del libro mayor', error: err.message });
  }
};

// Eliminar una entrada del libro mayor de productos
exports.deleteItemLedgerEntry = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // userId del query
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    const deleteResult = await pool.request()
      .input('EntryNo', parseInt(id))
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Item Ledger Entry] WHERE [Entry No_]=@EntryNo AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Entrada del libro mayor no encontrada o no tienes permisos para eliminarla' });
    }
    
    console.log(`Item Ledger Entry ${id} deleted for user ${userId}`);
    res.json({ message: 'Entrada del libro mayor eliminada' });
  } catch (err) {
    console.error('Error al eliminar entrada del libro mayor:', err);
    res.status(500).json({ message: 'Error al eliminar entrada del libro mayor', error: err.message });
  }
};