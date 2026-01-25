const express = require('express');
const router = express.Router();
const controller = require('../controllers/purchaseHeaderAdvancedController');

router.get('/:no', controller.getHeaderWithLines);

module.exports = router;