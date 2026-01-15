const express = require('express');
const router = express.Router();
const deepWorkController = require('../controllers/deepwork.controller');

router.post('/sessions', deepWorkController.createSession.bind(deepWorkController));
router.get('/sessions/active', deepWorkController.getActiveSession.bind(deepWorkController));
router.put('/sessions/:id', deepWorkController.updateSession.bind(deepWorkController));
router.patch('/sessions/:id/complete', deepWorkController.completeSession.bind(deepWorkController));
router.get('/sessions/completed', deepWorkController.getCompletedSessions.bind(deepWorkController));
router.get('/stats', deepWorkController.getStats.bind(deepWorkController));
router.delete('/sessions/:id', deepWorkController.deleteSession.bind(deepWorkController));
router.get('/sessions', deepWorkController.getAllSessions.bind(deepWorkController));

// NEW ROUTES FOR STATS FIXES
router.post('/stats/initialize', deepWorkController.initializeStats.bind(deepWorkController));
router.get('/stats/daily', deepWorkController.getDailyStats.bind(deepWorkController));
router.post('/stats/fix', deepWorkController.fixAllStats.bind(deepWorkController));

module.exports = router;