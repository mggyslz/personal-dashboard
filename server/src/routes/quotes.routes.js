const express = require('express');
const router = express.Router();
const https = require('https');

// In-memory cache for daily quotes (resets when server restarts)
let dailyQuoteCache = null;
let dailyQuoteDate = null;

// Fetch a random quote from ZenQuotes API
async function fetchRandomQuote() {
  const url = 'https://zenquotes.io/api/random';
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        return reject(new Error(`ZenQuotes API returned status: ${res.statusCode}`));
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (!Array.isArray(json) || json.length === 0) {
            return reject(new Error('Invalid response format from ZenQuotes API.'));
          }
          
          resolve({
            text: json[0].q,
            author: json[0].a
          });
        } catch (e) {
          reject(new Error('Failed to parse external API response.'));
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
    req.end(); 
  });
}

// Helper to check if cache is still valid for today
function isDailyCacheValid() {
  if (!dailyQuoteDate) return false;
  
  const today = new Date().toDateString();
  const cacheDate = new Date(dailyQuoteDate).toDateString();
  
  return today === cacheDate;
}

// Daily quote endpoint with server-side caching
router.get('/daily', async (req, res) => {
  try {
    // Return cached quote if valid
    if (isDailyCacheValid() && dailyQuoteCache) {
      return res.json(dailyQuoteCache);
    }
    
    // Fetch new quote and cache it
    const quote = await fetchRandomQuote();
    
    // Cache the quote
    dailyQuoteCache = quote;
    dailyQuoteDate = new Date();
    
    return res.json(quote);
  } catch (error) {
    console.error('Daily quote route error:', error.message);
    
    // Try to return cached quote even if outdated
    if (dailyQuoteCache) {
      return res.json(dailyQuoteCache);
    }
    
    return res.status(500).json({});
  }
});

// Random quote endpoint (always fresh)
router.get('/random', async (req, res) => {
  try {
    const quote = await fetchRandomQuote();
    return res.json(quote);
  } catch (error) {
    console.error('Random quote route error:', error.message);
    return res.status(500).json({});
  }
});

module.exports = router;