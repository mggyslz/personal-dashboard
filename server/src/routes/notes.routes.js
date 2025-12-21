const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');

router.post('/', notesController.create.bind(notesController));
router.get('/', notesController.getAll.bind(notesController));
router.get('/categories', notesController.getCategories.bind(notesController));
router.get('/category/:category', notesController.getByCategory.bind(notesController));
router.get('/:id', notesController.getOne.bind(notesController));
router.put('/:id', notesController.update.bind(notesController));
router.patch('/:id/toggle-pin', notesController.togglePin.bind(notesController));
router.delete('/:id', notesController.delete.bind(notesController));

module.exports = router;