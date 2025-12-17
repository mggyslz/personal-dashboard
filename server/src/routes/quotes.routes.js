const express = require('express');
const router = express.Router();

// Cache for daily quote
let dailyQuoteCache = {
  quote: null,
  date: null
};

// Fetch a random programming quote from API
async function fetchRandomQuote() {
  try {
    const response = await fetch('https://programming-quotesapi.vercel.app/api/random');
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the response to match our format
    return {
      text: data.quote,
      author: data.author
    };
  } catch (error) {
    console.error('Error fetching quote from API:', error);
    // Return a fallback quote if API fails
    return {
      text: "Code is like humor. When you have to explain it, it's bad.",
      author: "Cory House"
    };
  }
}

// Get random quote endpoint
router.get('/', async (req, res) => {
  try {
    const quote = await fetchRandomQuote();
    res.json(quote);
  } catch (error) {
    console.error('Quotes route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daily quote endpoint (same quote for the whole day)
router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toDateString();
    
    // Check if we have a cached quote for today
    if (dailyQuoteCache.date === today && dailyQuoteCache.quote) {
      return res.json(dailyQuoteCache.quote);
    }
    
    // Fetch new quote and cache it
    const quote = await fetchRandomQuote();
    dailyQuoteCache = {
      quote: quote,
      date: today
    };
    
    res.json(quote);
  } catch (error) {
    console.error('Daily quote route error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;