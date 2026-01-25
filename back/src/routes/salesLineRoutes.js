const express = require('express');
const router = express.Router();
const salesLineController = require('../controllers/salesLineController');

router.get('/', salesLineController.getSalesLines);
router.post('/', salesLineController.createSalesLine);
router.put('/:id', salesLineController.updateSalesLine);
router.delete('/:id', salesLineController.deleteSalesLine);

module.exports = router;