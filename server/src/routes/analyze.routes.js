const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyze.controller');

router.post('/', analyzeController.analyze.bind(analyzeController));

module.exports = router;