const express = require('express');
const router = express.Router();
const newsService = require('../services/news.service');

// GET /api/news - Get top headlines
router.get('/', async (req, res) => {
  try {
    const { 
      country = 'us', 
      category = 'technology', 
      pageSize = 10 
    } = req.query;
    
    const news = await newsService.getTopHeadlines(country, category, parseInt(pageSize));
    res.json(news);
  } catch (error) {
    console.error('News route error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message 
    });
  }
});

// GET /api/news/search - Search news
router.get('/search', async (req, res) => {
  try {
    const { 
      q, 
      language = 'en', 
      pageSize = 10 
    } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    const news = await newsService.searchNews(q, language, parseInt(pageSize));
    res.json(news);
  } catch (error) {
    console.error('News search route error:', error.message);
    res.status(500).json({ 
      error: 'Failed to search news',
      message: error.message 
    });
  }
});

module.exports = router;