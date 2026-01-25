const express = require('express');
const router = express.Router();
const controller = require('../controllers/vendorAdvancedController');

router.get('/:no/purchase-headers', controller.getVendorPurchaseHeaders);

module.exports = router;