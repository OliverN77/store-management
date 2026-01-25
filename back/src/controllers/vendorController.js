const { poolPromise } = require('../config/config');

// Obtener todos los proveedores del usuario autenticado
exports.getVendors = async (req, res) => {
  const { userId } = req.query; // Recibir userId por query parameter
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Vendor]';
    let request = pool.request();
    
    // Filtrar por usuario si se proporciona userId
    if (userId) {
      query += ' WHERE [UserId] = @UserId';
      request = request.input('UserId', userId);
    }
    
    const result = await request.query(query);
    console.log(`Vendors for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener proveedores:', err);
    res.status(500).json({ message: 'Error al obtener proveedores', error: err.message });
  }
};

// Crear un proveedor
exports.createVendor = async (req, res) => {
  const {
    No_, Name, SearchName, Address, Address2, City, PostCode, CountryRegionCode,
    PhoneNo, Email, Contact, VATRegistrationNo, VATRegistrationType, VendorPostingGroup,
    PaymentTermsCode, CurrencyCode, BalanceLCY, Blocked, CreatedAt,
    UserId // Agregar UserId
  } = req.body;
  
  // Validar que se proporcione UserId
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('No_', No_)
      .input('Name', Name)
      .input('SearchName', SearchName)
      .input('Address', Address)
      .input('Address2', Address2)
      .input('City', City)
      .input('PostCode', PostCode)
      .input('CountryRegionCode', CountryRegionCode)
      .input('PhoneNo', PhoneNo)
      .input('Email', Email)
      .input('Contact', Contact)
      .input('VATRegistrationNo', VATRegistrationNo)
      .input('VATRegistrationType', VATRegistrationType)
      .input('VendorPostingGroup', VendorPostingGroup)
      .input('PaymentTermsCode', PaymentTermsCode)
      .input('CurrencyCode', CurrencyCode)
      .input('BalanceLCY', BalanceLCY)
      .input('Blocked', Blocked)
      .input('CreatedAt', CreatedAt)
      .input('UserId', UserId) // Agregar UserId al insert
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Vendor]
        ([No_], [Name], [Search Name], [Address], [Address 2], [City], [Post Code], [Country/Region Code], [Phone No_], [E-Mail], [Contact], [VAT Registration No_], [VAT Registration Type], [Vendor Posting Group], [Payment Terms Code], [Currency Code], [Balance (LCY)], [Blocked], [Created At], [UserId])
        VALUES (@No_, @Name, @SearchName, @Address, @Address2, @City, @PostCode, @CountryRegionCode, @PhoneNo, @Email, @Contact, @VATRegistrationNo, @VATRegistrationType, @VendorPostingGroup, @PaymentTermsCode, @CurrencyCode, @BalanceLCY, @Blocked, @CreatedAt, @UserId)
      `);
    console.log(`Vendor created for user ${UserId}`);
    res.status(201).json({ message: 'Proveedor creado' });
  } catch (err) {
    console.error('Error al crear proveedor:', err);
    res.status(500).json({ message: 'Error al crear proveedor', error: err.message });
  }
};

// Actualizar un proveedor (solo si pertenece al usuario)
exports.updateVendor = async (req, res) => {
  const { id } = req.params;
  const {
    Name, SearchName, Address, Address2, City, PostCode, CountryRegionCode,
    PhoneNo, Email, Contact, VATRegistrationNo, VATRegistrationType, VendorPostingGroup,
    PaymentTermsCode, CurrencyCode, BalanceLCY, Blocked,
    UserId // Agregar UserId para validación
  } = req.body;
  
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el proveedor pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('No_', id)
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Vendor] WHERE [No_] = @No_ AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado o no tienes permisos para modificarlo' });
    }
    
    await pool.request()
      .input('No_', id)
      .input('Name', Name)
      .input('SearchName', SearchName)
      .input('Address', Address)
      .input('Address2', Address2)
      .input('City', City)
      .input('PostCode', PostCode)
      .input('CountryRegionCode', CountryRegionCode)
      .input('PhoneNo', PhoneNo)
      .input('Email', Email)
      .input('Contact', Contact)
      .input('VATRegistrationNo', VATRegistrationNo)
      .input('VATRegistrationType', VATRegistrationType)
      .input('VendorPostingGroup', VendorPostingGroup)
      .input('PaymentTermsCode', PaymentTermsCode)
      .input('CurrencyCode', CurrencyCode)
      .input('BalanceLCY', BalanceLCY)
      .input('Blocked', Blocked)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Vendor]
        SET [Name]=@Name, [Search Name]=@SearchName, [Address]=@Address, [Address 2]=@Address2,
            [City]=@City, [Post Code]=@PostCode, [Country/Region Code]=@CountryRegionCode,
            [Phone No_]=@PhoneNo, [E-Mail]=@Email, [Contact]=@Contact,
            [VAT Registration No_]=@VATRegistrationNo, [VAT Registration Type]=@VATRegistrationType,
            [Vendor Posting Group]=@VendorPostingGroup, [Payment Terms Code]=@PaymentTermsCode,
            [Currency Code]=@CurrencyCode, [Balance (LCY)]=@BalanceLCY, [Blocked]=@Blocked
        WHERE [No_]=@No_ AND [UserId]=@UserId
      `);
    res.json({ message: 'Proveedor actualizado' });
  } catch (err) {
    console.error('Error al actualizar proveedor:', err);
    res.status(500).json({ message: 'Error al actualizar proveedor', error: err.message });
  }
};

// Eliminar un proveedor (solo si pertenece al usuario)
exports.deleteVendor = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // Recibir userId por query parameter
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el proveedor pertenece al usuario antes de eliminar
    const deleteResult = await pool.request()
      .input('No_', id)
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Vendor] WHERE [No_]=@No_ AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado o no tienes permisos para eliminarlo' });
    }
    
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) {
    console.error('Error al eliminar proveedor:', err);
    res.status(500).json({ message: 'Error al eliminar proveedor', error: err.message });
  }
};