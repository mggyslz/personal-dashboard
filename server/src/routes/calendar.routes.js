const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendar.service');

router.get('/', async (req, res) => {
  try {
    const events = await calendarService.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Calendar route error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;