const express = require('express');
const router = express.Router();
const remindersController = require('../controllers/reminders.controller');

router.post('/', remindersController.create.bind(remindersController));
router.get('/', remindersController.getAll.bind(remindersController));
router.get('/active', remindersController.getActive.bind(remindersController));
router.put('/:id', remindersController.update.bind(remindersController));
router.patch('/:id/toggle', remindersController.toggleComplete.bind(remindersController));
router.delete('/:id', remindersController.delete.bind(remindersController));

module.exports = router;