const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Rutas del dashboard con userId como parámetro
router.get('/stats/:userId', dashboardController.getStats);
router.get('/recent-activity/:userId', dashboardController.getRecentActivity);
router.get('/low-stock/:userId', dashboardController.getLowStock);
router.get('/active-purchases/:userId', dashboardController.getActivePurchaseOrders);

module.exports = router;