const express = require('express');
const router = express.Router();
const controller = require('../controllers/salesHeaderAdvancedController');

router.get('/:no', controller.getHeaderWithLines);

module.exports = router;