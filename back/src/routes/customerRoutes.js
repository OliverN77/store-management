const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getCustomers);

router.post(
  '/',
  [
    body('No_').notEmpty().withMessage('No_ es requerido'),
    body('Name').notEmpty().withMessage('Name es requerido'),
    body('Email').isEmail().withMessage('Email no es válido').optional({ nullable: true }),
    // Agrega más validaciones según tus reglas de negocio
  ],
  customerController.createCustomer
);

router.put(
  '/:id',
  [
    body('Name').notEmpty().withMessage('Name es requerido'),
    body('Email').isEmail().withMessage('Email no es válido').optional({ nullable: true }),
    // Más validaciones si lo necesitas
  ],
  customerController.updateCustomer
);

router.delete('/:id', customerController.deleteCustomer);

module.exports = router;