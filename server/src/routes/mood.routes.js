const express = require('express');
const router = express.Router();
const moodController = require('../controllers/mood.controller');

router.get('/summary', moodController.getMoodSummary);
router.get('/history', moodController.getMoodHistory);
router.get('/analysis', moodController.getMoodAnalysis);
router.get('/chart', moodController.getMoodChartData);

module.exports = router;