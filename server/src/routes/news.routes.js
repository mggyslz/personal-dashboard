const express = require('express');
const router = express.Router();
const newsService = require('../services/news.service');

router.get('/', async (req, res) => {
  try {
    const country = req.query.country || 'ph';
    const category = req.query.category || 'general';
    const news = await newsService.getTopHeadlines(country, category);
    res.json(news);
  } catch (error) {
    console.error('News route error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;