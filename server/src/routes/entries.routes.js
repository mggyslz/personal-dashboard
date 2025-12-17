const express = require('express');
const router = express.Router();
const entriesController = require('../controllers/entries.controller');

router.post('/', entriesController.create.bind(entriesController));
router.get('/', entriesController.getAll.bind(entriesController));
router.get('/stats/mood', entriesController.getMoodStats.bind(entriesController));
router.get('/:id', entriesController.getById.bind(entriesController));
router.put('/:id', entriesController.update.bind(entriesController));
router.delete('/:id', entriesController.delete.bind(entriesController));

module.exports = router;