const express = require('express');
const router = express.Router();
const mitDailyController = require('../controllers/mitdaily.controller');

router.get('/today', mitDailyController.getTodayTask.bind(mitDailyController));
router.post('/today', mitDailyController.setTodayTask.bind(mitDailyController));
router.patch('/:id/complete', mitDailyController.toggleComplete.bind(mitDailyController));
router.get('/history', mitDailyController.getHistory.bind(mitDailyController));
router.get('/streak', mitDailyController.getStreakStats.bind(mitDailyController));
router.get('/weekly', mitDailyController.getWeeklyStats.bind(mitDailyController));
router.get('/monthly', mitDailyController.getMonthlyStats.bind(mitDailyController));
router.delete('/:id', mitDailyController.deleteTask.bind(mitDailyController));

module.exports = router;