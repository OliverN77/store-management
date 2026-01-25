const express = require('express');
const router = express.Router();
const paymentTermsController = require('../controllers/paymentTermsController');

router.get('/', paymentTermsController.getPaymentTerms);
router.post('/', paymentTermsController.createPaymentTerm);
router.put('/:id', paymentTermsController.updatePaymentTerm);
router.delete('/:id', paymentTermsController.deletePaymentTerm);

module.exports = router;