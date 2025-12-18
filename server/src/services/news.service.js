const axios = require('axios');

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '';
    this.baseUrl = 'https://newsapi.org/v2';
  }

  async getTopHeadlines(country = 'us', category = 'technology', pageSize = 10) {
    try {
      if (!this.apiKey) {
        throw new Error('News API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/top-headlines`, {
        params: {
          country: country,
          category: category,
          pageSize: pageSize,
          apiKey: this.apiKey
        }
      });

      return this.formatArticles(response.data.articles);
    } catch (error) {
      console.error('News API error:', error.message);
      throw new Error(`Failed to fetch news: ${error.message}`);
    }
  }

  async searchNews(query, language = 'en', pageSize = 10) {
    try {
      if (!this.apiKey) {
        throw new Error('News API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          q: query,
          language: language,
          pageSize: pageSize,
          sortBy: 'relevancy',
          apiKey: this.apiKey
        }
      });

      return this.formatArticles(response.data.articles);
    } catch (error) {
      console.error('News search error:', error.message);
      throw new Error(`Failed to search news: ${error.message}`);
    }
  }

  formatArticles(articles) {
    if (!articles || !Array.isArray(articles)) {
      return [];
    }

    return articles
      .filter(article => article.title && article.title !== '[Removed]')
      .map(article => ({
        title: article.title || 'No title available',
        description: article.description || 'No description available',
        url: article.url || '#',
        source: article.source?.name || 'Unknown source',
        publishedAt: article.publishedAt || new Date().toISOString(),
        image: article.urlToImage || null
      }));
  }
}

module.exports = new NewsService();