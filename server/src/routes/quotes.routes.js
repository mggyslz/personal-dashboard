const express = require('express');
const router = express.Router();

// Mock quotes data
const quotes = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair"
  },
  {
    text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.",
    author: "Roy T. Bennett"
  },
  {
    text: "I learned that courage was not the absence of fear, but the triumph over it.",
    author: "Nelson Mandela"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Unknown"
  }
];

router.get('/', (req, res) => {
  try {
    // Return a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    res.json(randomQuote);
  } catch (error) {
    console.error('Quotes route error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/daily', (req, res) => {
  try {
    // Return the same quote for the current day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const dailyQuote = quotes[dayOfYear % quotes.length];
    res.json(dailyQuote);
  } catch (error) {
    console.error('Daily quote route error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;