const express = require('express');
const router = express.Router();
const {
  getItemLedgerEntries,
  createItemLedgerEntry,
  updateItemLedgerEntry,
  deleteItemLedgerEntry
} = require('../controllers/itemLedgerEntryController');

// GET /api/item-ledger-entries - Obtener todas las entradas
router.get('/', getItemLedgerEntries);

// POST /api/item-ledger-entries - Crear una nueva entrada
router.post('/', createItemLedgerEntry);

// PUT /api/item-ledger-entries/:id - Actualizar una entrada
router.put('/:id', updateItemLedgerEntry);

// DELETE /api/item-ledger-entries/:id - Eliminar una entrada
router.delete('/:id', deleteItemLedgerEntry);

module.exports = router;