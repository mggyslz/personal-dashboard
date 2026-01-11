const express = require('express');
const router = express.Router();
const entriesController = require('../controllers/entries.controller');

router.post('/', entriesController.create);
router.get('/', entriesController.getAll);
router.get('/stats/mood', entriesController.getMoodEntriesStats);
router.get('/:id', entriesController.getById);
router.put('/:id', entriesController.update);
router.delete('/:id', entriesController.delete);

module.exports = router;