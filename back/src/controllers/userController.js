const { poolPromise } = require('../config/config');

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT Id, Email, FirstName, LastName, Status, CreatedAt, LastLogin FROM [OLIVER SOLUTIONS S.A.S$User]');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', id)
      .query('SELECT Id, Email, FirstName, LastName, Status, CreatedAt, LastLogin FROM [OLIVER SOLUTIONS S.A.S$User] WHERE Id = @Id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ message: 'Error al obtener usuario', error: err.message });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, status } = req.body;
  
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Id', id)
      .input('FirstName', firstName)
      .input('LastName', lastName)
      .input('Status', status || 'Active')
      .query(`
        UPDATE [OLIVER SOLUTIONS S.A.S$User] 
        SET FirstName = @FirstName, LastName = @LastName, Status = @Status
        WHERE Id = @Id
      `);
    
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ message: 'Error al actualizar usuario', error: err.message });
  }
};

// Desactivar usuario
exports.deactivateUser = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Id', id)
      .query('UPDATE [OLIVER SOLUTIONS S.A.S$User] SET Status = \'Inactive\' WHERE Id = @Id');
    
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (err) {
    console.error('Error al desactivar usuario:', err);
    res.status(500).json({ message: 'Error al desactivar usuario', error: err.message });
  }
};