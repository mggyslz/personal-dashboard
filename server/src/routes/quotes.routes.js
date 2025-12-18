const express = require('express');
const router = express.Router();

// Cache for daily quote
let dailyQuoteCache = {
  quote: {
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson"
  },
  date: new Date().toDateString()
};

// Fetch a random programming quote from API
async function fetchRandomQuote() {
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
}

// Get daily quote endpoint (same quote for the whole day)
router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toDateString();
    
    // Check if we have a cached quote for today
    if (dailyQuoteCache.date === today && dailyQuoteCache.quote) {
      console.log('Returning cached quote');
      return res.json(dailyQuoteCache.quote);
    }
    
    // Only fetch if date changed
    console.log('Fetching new quote from API');
    const quote = await fetchRandomQuote();
    dailyQuoteCache = {
      quote: quote,
      date: today
    };
    
    res.json(quote);
  } catch (error) {
    console.error('Daily quote route error:', error.message);
    
    // Always return the cached quote if API fails
    console.log('API failed, returning cached quote');
    return res.json(dailyQuoteCache.quote);
  }
});

module.exports = router;