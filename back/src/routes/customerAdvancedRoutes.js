const express = require('express');
const router = express.Router();
const controller = require('../controllers/customerAdvancedController');

router.get('/:no/sales-headers', controller.getCustomerSalesHeaders);

module.exports = router;