const express = require('express');
const router = express.Router();
const outputController = require('../controllers/output.controller');

// Entries
router.get('/entries', outputController.getEntries.bind(outputController));
router.post('/entries', outputController.createEntry.bind(outputController));
router.delete('/entries/:id', outputController.deleteEntry.bind(outputController));

// Types
router.get('/types', outputController.getTypes.bind(outputController));
router.post('/types', outputController.createType.bind(outputController));
router.put('/types/:id', outputController.updateType.bind(outputController));
router.delete('/types/:id', outputController.deleteType.bind(outputController));

// Stats
router.get('/stats', outputController.getStats.bind(outputController));
router.get('/streak', outputController.getStreak.bind(outputController));

module.exports = router;