const express = require('express');
const router = express.Router();
const purchaseLineController = require('../controllers/purchaseLineController');

// Rutas para líneas de compra
router.get('/', purchaseLineController.getPurchaseLines);
router.post('/', purchaseLineController.createPurchaseLine);
router.put('/:id', purchaseLineController.updatePurchaseLine);
router.delete('/:id', purchaseLineController.deletePurchaseLine);

module.exports = router;