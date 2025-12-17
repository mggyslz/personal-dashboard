const Sentiment = require('sentiment');
const sentiment = new Sentiment();

class AIService {
  /**
   * Analyze journal text for mood, themes, and insights
   */
  async analyze(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const mood = this.analyzeMood(text);
    const themes = this.extractThemes(text);
    const insights = this.generateInsights(text, mood, themes);

    return {
      mood,
      themes,
      insights
    };
  }

  /**
   * Analyze mood using sentiment analysis
   */
  analyzeMood(text) {
    const result = sentiment.analyze(text);
    const score = result.score;

    if (score > 3) return 'Very Positive';
    if (score > 0) return 'Positive';
    if (score === 0) return 'Neutral';
    if (score > -3) return 'Negative';
    return 'Very Negative';
  }

  /**
   * Extract key themes/keywords from text
   */
  extractThemes(text) {
    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our',
      'their', 'this', 'that', 'these', 'those', 'am', 'very', 'just',
      'so', 'than', 'too', 'about', 'me', 'him', 'them', 'us'
    ]);

    // Tokenize and clean
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Get top 5 themes
    const themes = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return themes;
  }

  /**
   * Generate insights based on analysis
   */
  generateInsights(text, mood, themes) {
    const insights = [];

    // Mood-based insight
    if (mood.includes('Positive')) {
      insights.push('You seem to be in a good mental space today.');
    } else if (mood.includes('Negative')) {
      insights.push('Consider what might be causing these feelings.');
    } else {
      insights.push('Your emotions seem balanced today.');
    }

    // Theme-based insight
    if (themes.length > 0) {
      insights.push(`Key focus areas: ${themes.slice(0, 3).join(', ')}.`);
    }

    // Length-based insight
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 200) {
      insights.push('You had a lot to express today.');
    } else if (wordCount < 50) {
      insights.push('Consider expanding on your thoughts more.');
    }

    return insights.join(' ');
  }
}

module.exports = new AIService();