const { poolPromise } = require('../config/config');
const { validationResult } = require('express-validator');

// Obtener todos los clientes del usuario autenticado
exports.getCustomers = async (req, res) => {
  const { userId } = req.query; // Recibir userId por query parameter
  
  try {
    const pool = await poolPromise;
    let query = 'SELECT * FROM [OLIVER SOLUTIONS S.A.S$Customer]';
    let request = pool.request();
    
    // Filtrar por usuario si se proporciona userId
    if (userId) {
      query += ' WHERE [UserId] = @UserId';
      request = request.input('UserId', userId);
    }
    
    const result = await request.query(query);
    console.log(`Customers for user ${userId}:`, result.recordset.length);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ message: 'Error al obtener clientes', error: err.message });
  }
};

// Crear un cliente
exports.createCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    No_, Name, SearchName, Name2, Address, Address2, City, PostCode, CountryRegionCode,
    PhoneNo, Email, Contact, VATRegistrationNo, VATRegistrationType, CustomerPostingGroup,
    PaymentTermsCode, CurrencyCode, CreditLimitLCY, BalanceLCY, Blocked, CreatedAt,
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
      .input('Name2', Name2)
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
      .input('CustomerPostingGroup', CustomerPostingGroup)
      .input('PaymentTermsCode', PaymentTermsCode)
      .input('CurrencyCode', CurrencyCode)
      .input('CreditLimitLCY', CreditLimitLCY)
      .input('BalanceLCY', BalanceLCY)
      .input('Blocked', Blocked)
      .input('CreatedAt', CreatedAt)
      .input('UserId', UserId) // Agregar UserId al insert
      .query(`
        INSERT INTO [OLIVER SOLUTIONS S.A.S$Customer]
        ([No_], [Name], [Search Name], [Name 2], [Address], [Address 2], [City], [Post Code], [Country/Region Code], [Phone No_], [E-Mail], [Contact], [VAT Registration No_], [VAT Registration Type], [Customer Posting Group], [Payment Terms Code], [Currency Code], [Credit Limit (LCY)], [Balance (LCY)], [Blocked], [Created At], [UserId])
        VALUES (@No_, @Name, @SearchName, @Name2, @Address, @Address2, @City, @PostCode, @CountryRegionCode, @PhoneNo, @Email, @Contact, @VATRegistrationNo, @VATRegistrationType, @CustomerPostingGroup, @PaymentTermsCode, @CurrencyCode, @CreditLimitLCY, @BalanceLCY, @Blocked, @CreatedAt, @UserId)
      `);
    console.log(`Customer created for user ${UserId}`);
    res.status(201).json({ message: 'Cliente creado' });
  } catch (err) {
    console.error('Error al crear cliente:', err);
    res.status(500).json({ message: 'Error al crear cliente', error: err.message });
  }
};

// Actualizar un cliente (solo si pertenece al usuario)
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const {
    Name, SearchName, Name2, Address, Address2, City, PostCode, CountryRegionCode,
    PhoneNo, Email, Contact, VATRegistrationNo, VATRegistrationType, CustomerPostingGroup,
    PaymentTermsCode, CurrencyCode, CreditLimitLCY, BalanceLCY, Blocked,
    UserId // Agregar UserId para validación
  } = req.body;
  
  if (!UserId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el cliente pertenece al usuario
    const ownershipCheck = await pool.request()
      .input('No_', id)
      .input('UserId', UserId)
      .query('SELECT COUNT(*) as count FROM [OLIVER SOLUTIONS S.A.S$Customer] WHERE [No_] = @No_ AND [UserId] = @UserId');
    
    if (ownershipCheck.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado o no tienes permisos para modificarlo' });
    }
    
    await pool.request()
      .input('No_', id)
      .input('Name', Name)
      .input('SearchName', SearchName)
      .input('Name2', Name2)
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
      .input('CustomerPostingGroup', CustomerPostingGroup)
      .input('PaymentTermsCode', PaymentTermsCode)
      .input('CurrencyCode', CurrencyCode)
      .input('CreditLimitLCY', CreditLimitLCY)
      .input('BalanceLCY', BalanceLCY)
      .input('Blocked', Blocked)
      .input('UserId', UserId)
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$Customer]
        SET [Name]=@Name, [Search Name]=@SearchName, [Name 2]=@Name2, [Address]=@Address, [Address 2]=@Address2,
            [City]=@City, [Post Code]=@PostCode, [Country/Region Code]=@CountryRegionCode, [Phone No_]=@PhoneNo,
            [E-Mail]=@Email, [Contact]=@Contact, [VAT Registration No_]=@VATRegistrationNo,
            [VAT Registration Type]=@VATRegistrationType, [Customer Posting Group]=@CustomerPostingGroup,
            [Payment Terms Code]=@PaymentTermsCode, [Currency Code]=@CurrencyCode,
            [Credit Limit (LCY)]=@CreditLimitLCY, [Balance (LCY)]=@BalanceLCY, [Blocked]=@Blocked
        WHERE [No_]=@No_ AND [UserId]=@UserId
      `);
    res.json({ message: 'Cliente actualizado' });
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    res.status(500).json({ message: 'Error al actualizar cliente', error: err.message });
  }
};

// Eliminar un cliente (solo si pertenece al usuario)
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // Recibir userId por query parameter
  
  if (!userId) {
    return res.status(400).json({ message: 'UserId es requerido' });
  }
  
  try {
    const pool = await poolPromise;
    
    // Verificar que el cliente pertenece al usuario antes de eliminar
    const deleteResult = await pool.request()
      .input('No_', id)
      .input('UserId', userId)
      .query('DELETE FROM [OLIVER SOLUTIONS S.A.S$Customer] WHERE [No_]=@No_ AND [UserId]=@UserId');
    
    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado o no tienes permisos para eliminarlo' });
    }
    
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    console.error('Error al eliminar cliente:', err);
    res.status(500).json({ message: 'Error al eliminar cliente', error: err.message });
  }
};