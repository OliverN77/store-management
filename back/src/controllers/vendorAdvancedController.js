const { poolPromise } = require('../config/config');

exports.getVendorPurchaseHeaders = async (req, res) => {
  const { no } = req.params;
  try {
    const pool = await poolPromise;
    const headersResult = await pool.request()
      .input('BuyFromVendorNo', no)
      .query('SELECT * FROM [OLIVER SOLUTIONS S.A.S$Purchase Header] WHERE [Buy-from Vendor No_]=@BuyFromVendorNo');
    res.json(headersResult.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener compras del proveedor', error: err.message });
  }
};