const express = require('express');
const router = express.Router();
const https = require('https');

let dailyQuoteCache = null;
let dailyQuoteDate = null;

async function fetchRandomQuote() {
  const url = 'https://zenquotes.io/api/random';

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      if (res.statusCode !== 200) {
        return reject(new Error(`ZenQuotes API status: ${res.statusCode}`));
      }

      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            text: json[0].q,
            author: json[0].a,
          });
        } catch {
          reject(new Error('Invalid ZenQuotes response'));
        }
      });
    }).on('error', reject);
  });
}

function isToday(date) {
  if (!date) return false;
  return new Date(date).toDateString() === new Date().toDateString();
}

router.get('/daily', async (req, res) => {
  try {
    if (dailyQuoteCache && isToday(dailyQuoteDate)) {
      return res.json(dailyQuoteCache);
    }

    const quote = await fetchRandomQuote();
    dailyQuoteCache = quote;
    dailyQuoteDate = new Date();

    return res.json(quote);
  } catch (err) {
    console.error('Daily quote error:', err.message);

    if (dailyQuoteCache) {
      return res.json(dailyQuoteCache);
    }

    return res.status(500).json({});
  }
});

module.exports = router;
