// server/src/routes/quotes.routes.js (The FINAL, Environment-Proof Fix)

const express = require('express');
const router = express.Router();
const https = require('https'); // ⬅️ Using built-in module now

// Fetch a random quote from ZenQuotes API using the built-in 'https' module
async function fetchRandomQuote() {
  const url = 'https://zenquotes.io/api/random';
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        return reject(new Error(`ZenQuotes API returned status: ${res.statusCode}`));
      }

      // Concatenate data chunks
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Once all data is received
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (!Array.isArray(json) || json.length === 0) {
            return reject(new Error('Invalid response format from ZenQuotes API.'));
          }
          
          // Transform the response to match the expected format
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

router.get('/', async (req, res) => {
  try {
    const quote = await fetchRandomQuote();
    return res.json(quote);
  } catch (error) {
    console.error('Random quote route error:', error.message);
    return res.status(500).json({}); // Return empty object on failure
  }
});

router.get('/daily', async (req, res) => {
  try {
    const quote = await fetchRandomQuote();
    return res.json(quote);
  } catch (error) {
    console.error('Daily quote route error:', error.message);
    return res.status(500).json({}); // Return empty object on failure
  }
});

module.exports = router;