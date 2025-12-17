const express = require('express');
const router = express.Router();
const weatherService = require('../services/weather.service');

router.get('/', async (req, res) => {
  try {
    const city = req.query.city || 'Manila';
    const weather = await weatherService.getCurrentWeather(city);
    res.json(weather);
  } catch (error) {
    console.error('Weather route error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;