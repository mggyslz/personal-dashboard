const express = require('express');
const router = express.Router();
const codeSnippetController = require('../controllers/codeSnippet.controller');

router.post('/', codeSnippetController.create.bind(codeSnippetController));
router.get('/', codeSnippetController.getAll.bind(codeSnippetController));
router.get('/languages', codeSnippetController.getLanguages.bind(codeSnippetController));
router.get('/:id', codeSnippetController.getOne.bind(codeSnippetController));
router.put('/:id', codeSnippetController.update.bind(codeSnippetController));
router.delete('/:id', codeSnippetController.delete.bind(codeSnippetController));

module.exports = router;