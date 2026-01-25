const { poolPromise } = require('../config/config');

exports.getCustomerSalesHeaders = async (req, res) => {
  const { no } = req.params;
  try {
    const pool = await poolPromise;
    const headersResult = await pool.request()
      .input('SellToCustomerNo', no)
      .query('SELECT * FROM [OLIVER SOLUTIONS S.A.S$Sales Header] WHERE [Sell-to Customer No_]=@SellToCustomerNo');
    res.json(headersResult.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener ventas del cliente', error: err.message });
  }
};