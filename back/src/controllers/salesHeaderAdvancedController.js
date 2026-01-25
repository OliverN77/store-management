const { poolPromise } = require('../config/config');

exports.getHeaderWithLines = async (req, res) => {
  const { no } = req.params;
  try {
    const pool = await poolPromise;
    const headerResult = await pool.request()
      .input('No_', no)
      .query('SELECT * FROM [OLIVER SOLUTIONS S.A.S$Sales Header] WHERE [No_]=@No_');
    const linesResult = await pool.request()
      .input('DocumentNo', no)
      .query('SELECT * FROM [OLIVER SOLUTIONS S.A.S$Sales Line] WHERE [Document No_]=@DocumentNo');
    res.json({
      header: headerResult.recordset[0],
      lines: linesResult.recordset
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener encabezado y líneas', error: err.message });
  }
};