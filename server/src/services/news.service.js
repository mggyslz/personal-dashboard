const axios = require('axios');

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '';
    this.baseUrl = 'https://newsapi.org/v2';
  }

  async getTopHeadlines(country = 'ph', category = 'general') {
    try {
      if (!this.apiKey) {
        return this.getMockNews();
      }

      const response = await axios.get(`${this.baseUrl}/top-headlines`, {
        params: {
          country: country,
          category: category,
          pageSize: 5,
          apiKey: this.apiKey
        }
      });

      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        image: article.urlToImage
      }));
    } catch (error) {
      console.error('News API error:', error.message);
      return this.getMockNews();
    }
  }

  getMockNews() {
    return [
      {
        title: 'Technology Advances in AI',
        description: 'Recent developments in artificial intelligence.',
        url: '#',
        source: 'Tech News',
        publishedAt: new Date().toISOString(),
        image: null
      },
      {
        title: 'Market Update',
        description: 'Stock market shows positive trends.',
        url: '#',
        source: 'Financial Times',
        publishedAt: new Date().toISOString(),
        image: null
      }
    ];
  }
}

module.exports = new NewsService();