const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const nlp = require('compromise');
const natural = require('natural');
const stopword = require('stopword');

class AIService {
  /**
   * Analyze journal text for mood, themes, and insights
   */
  async analyze(text, previousEntries = []) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const mood = this.analyzeMood(text);
    const themes = this.extractThemes(text);
    const insights = this.generateInsights(text, mood, themes, previousEntries);

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
   * Extract key themes/keywords using compromise + TF-IDF
   */
  extractThemes(text) {
    const doc = nlp(text);

    // Extract nouns and noun phrases
    const nouns = doc.nouns().out('array');
    const phrases = doc.nouns().out('phrases');

    // Combine words and phrases, remove stopwords
    const words = stopword.removeStopwords([...nouns, ...phrases].map(w => w.toLowerCase()))
      .filter(word => word.length > 3);

    // Count frequency
    const freq = {};
    words.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    // Top 5 themes
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Generate verbose insights
   */
  generateInsights(text, mood, themes) {
    const insights = [];

    // Mood-based insight
    if (mood.includes('Positive')) {
      insights.push('You seem to be in a good mental space today. Keep embracing this energy!');
    } else if (mood.includes('Negative')) {
      insights.push('You might be facing some challenges today. Reflect on what triggered these feelings.');
    } else {
      insights.push('Your emotions seem balanced today. Maintain this steady mindset.');
    }

    // Theme-based insight
    if (themes.length > 0) {
      insights.push(`Key focus areas: ${themes.slice(0, 5).join(', ')}.`);
    }

    // Length-based insight
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 200) {
      insights.push('You had a lot to express today, which shows deep reflection.');
    } else if (wordCount < 50) {
      insights.push('Consider elaborating a bit more to capture your thoughts fully.');
    }

    // Dynamic reflective prompts
    const reflectionPrompts = [
      'What went well today and why?',
      'Which challenges taught you something new?',
      'How can you apply what you learned tomorrow?',
      'What energized you today?',
      'Is there something small you can do to improve tomorrow?'
    ];

    // If negative mood, pick prompts that encourage action
    const negativePrompts = [
      'Identify one small step to improve your mindset.',
      'What could have made today feel better?',
      'Which challenge could you approach differently tomorrow?'
    ];

    const promptsPool = mood.includes('Negative') ? negativePrompts : reflectionPrompts;

    // Pick 1-2 random prompts
    const selectedPrompts = promptsPool
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    insights.push(...selectedPrompts);

    // Return insights as a single string
    return insights.join(' ');
  }
}

module.exports = new AIService();
