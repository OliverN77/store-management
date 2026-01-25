const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

router.post(
  '/send-code',
  [body('email').isEmail().withMessage('Email válido requerido')],
  authController.sendCode
);

router.post(
  '/verify-code',
  [
    body('email').isEmail().withMessage('Email válido requerido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código de 6 dígitos requerido')
  ],
  authController.verifyCode
);

module.exports = router;