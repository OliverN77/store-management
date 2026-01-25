const express = require('express');
const router = express.Router();
const salesHeaderController = require('../controllers/salesHeaderController');

router.get('/', salesHeaderController.getSalesHeaders);
router.post('/', salesHeaderController.createSalesHeader);
router.put('/:id', salesHeaderController.updateSalesHeader);
router.delete('/:id', salesHeaderController.deleteSalesHeader);

module.exports = router;