const express = require('express');
const router = express.Router();
const purchaseHeaderController = require('../controllers/purchaseHeaderController');

router.get('/', purchaseHeaderController.getPurchaseHeaders);
router.post('/', purchaseHeaderController.createPurchaseHeader);
router.put('/:id', purchaseHeaderController.updatePurchaseHeader);
router.delete('/:id', purchaseHeaderController.deletePurchaseHeader);

module.exports = router;