const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const nlp = require('compromise');
const stopword = require('stopword');

class AIService {
  constructor() {
    // Track response history to avoid repetition
    this.recentInsights = new Set();
    this.maxRecentInsights = 20;
  }

  async analyze(text, previousEntries = []) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const mood = this.analyzeMood(text);
    const themes = this.extractThemes(text);
    const patterns = this.detectPatterns(text);
    const context = this.analyzeContext(text, previousEntries);
    const insights = this.generateInsights(text, mood, themes, patterns, context, previousEntries);

    return { mood, themes, insights };
  }

  analyzeMood(text) {
    const result = sentiment.analyze(text);
    const score = result.score;
    const comparative = result.comparative;

    // More nuanced mood detection
    if (score > 5 || comparative > 0.5) return 'Very Positive';
    if (score > 2 || comparative > 0.2) return 'Positive';
    if (score > 0 || comparative > 0.05) return 'Slightly Positive';
    if (score === 0 && comparative === 0) return 'Neutral';
    if (score > -2 || comparative > -0.2) return 'Slightly Negative';
    if (score > -5 || comparative > -0.5) return 'Negative';
    return 'Very Negative';
  }

  extractThemes(text) {
    const doc = nlp(text);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    
    const words = stopword.removeStopwords(
      [...nouns, ...verbs].map(w => w.toLowerCase())
    ).filter(word => word.length > 3);

    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  detectPatterns(text) {
    const doc = nlp(text);
    const lower = text.toLowerCase();

    return {
      hasGoals: /goal|plan|want to|need to|should|will|going to/i.test(text),
      hasGratitude: /grateful|thankful|appreciate|blessed|lucky|glad/i.test(text),
      hasWorry: /worry|anxious|stress|nervous|afraid|scared|concern/i.test(text),
      hasRelationships: /friend|family|partner|colleague|relationship|people/i.test(text),
      hasWork: /work|job|project|meeting|deadline|task|career/i.test(text),
      hasHealth: /exercise|health|sleep|eat|tired|energy|workout/i.test(text),
      hasReflection: /realize|learned|understand|think|feel|notice/i.test(text),
      hasChallenge: /difficult|hard|struggle|challenge|problem|tough/i.test(text),
      hasAchievement: /achieved|completed|accomplished|success|proud|win/i.test(text),
      hasQuestion: text.includes('?'),
      hasExclamation: text.includes('!'),
      emotionalIntensity: (text.match(/!/g) || []).length + (text.match(/\?/g) || []).length,
      timeReferences: {
        morning: /morning|breakfast|woke/i.test(text),
        afternoon: /afternoon|lunch/i.test(text),
        evening: /evening|dinner|night/i.test(text),
        past: /yesterday|last week|ago|was|were/i.test(text),
        future: /tomorrow|next|will|plan|hope/i.test(text)
      }
    };
  }

  analyzeContext(text, previousEntries) {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = wordCount / sentenceCount;

    return {
      wordCount,
      sentenceCount,
      avgSentenceLength,
      isLong: wordCount > 200,
      isShort: wordCount < 50,
      isMedium: wordCount >= 50 && wordCount <= 200,
      isDetailed: avgSentenceLength > 15,
      isConcise: avgSentenceLength < 10,
      hasHistory: previousEntries.length > 0,
      recentEntryCount: previousEntries.length
    };
  }

  generateInsights(text, mood, themes, patterns, context, previousEntries) {
    const insights = [];

    // Mood insights with variety
    insights.push(this.getMoodInsight(mood, patterns, context));

    // Pattern-based insights
    if (patterns.hasAchievement) {
      insights.push(this.selectRandom([
        "Celebrating your wins is important - you've earned this moment of pride.",
        "Your accomplishments reflect your dedication and effort. Well done!",
        "Success builds on success. This achievement can be a stepping stone.",
        "Take a moment to appreciate how far you've come with this accomplishment."
      ]));
    }

    if (patterns.hasWorry && !patterns.hasGoals) {
      insights.push(this.selectRandom([
        "When worries arise, breaking them into smaller, actionable steps can help.",
        "Consider: what's one small thing within your control right now?",
        "Anxiety often fades when we move from worrying to planning.",
        "What would you tell a friend facing this same concern?"
      ]));
    }

    if (patterns.hasGoals) {
      insights.push(this.selectRandom([
        "Clear intentions are the first step. What's one action you can take today?",
        "Goals feel more achievable when broken into tiny, concrete steps.",
        "Having direction gives your energy somewhere purposeful to flow.",
        "What would success look like for this goal in one week?"
      ]));
    }

    if (patterns.hasGratitude) {
      insights.push(this.selectRandom([
        "Gratitude shifts perspective powerfully. Notice how it changes your mood?",
        "Appreciating what's working can make challenges feel more manageable.",
        "Your ability to find gratitude shows emotional awareness and strength.",
        "Small moments of thankfulness compound into lasting contentment."
      ]));
    }

    // Contextual insights
    if (context.isLong && patterns.hasReflection) {
      insights.push(this.selectRandom([
        "Your thorough reflection shows you're processing deeply. That's valuable.",
        "The depth here suggests you're working through something important.",
        "Detailed writing like this often leads to personal breakthroughs.",
        "You're giving yourself space to think fully - that's rare and important."
      ]));
    }

    if (context.isShort && !patterns.hasChallenge) {
      insights.push(this.selectRandom([
        "Sometimes brevity captures the essence perfectly.",
        "Short entries can be powerful - quality over quantity.",
        "Not every day needs a novel. This captures the moment.",
        "Concise reflection can be just as meaningful as long entries."
      ]));
    }

    // Theme-based insights
    if (themes.length > 0) {
      const themeInsight = this.getThemeInsight(themes, patterns);
      if (themeInsight) insights.push(themeInsight);
    }

    // Time-based insights
    if (patterns.timeReferences.future && patterns.hasGoals) {
      insights.push(this.selectRandom([
        "Forward-thinking mindset detected. Planning ahead reduces future stress.",
        "Your future-oriented thinking shows you're taking charge of what's ahead.",
        "Anticipating tomorrow while being present today - that's balanced thinking."
      ]));
    }

    // Comparative insights with history
    if (context.hasHistory && previousEntries.length >= 3) {
      const historicalInsight = this.getHistoricalInsight(mood, previousEntries);
      if (historicalInsight) insights.push(historicalInsight);
    }

    // Add a reflective question
    insights.push(this.getReflectiveQuestion(mood, patterns, context));

    // Filter out recently used insights and limit to 4-5
    const filtered = insights.filter(insight => !this.recentInsights.has(insight));
    const selected = this.shuffleArray(filtered).slice(0, this.getRandom(4, 5));

    // Track used insights
    selected.forEach(insight => {
      this.recentInsights.add(insight);
      if (this.recentInsights.size > this.maxRecentInsights) {
        const first = this.recentInsights.values().next().value;
        this.recentInsights.delete(first);
      }
    });

    return selected.join(' ');
  }

  getMoodInsight(mood, patterns, context) {
    const moodInsights = {
      'Very Positive': [
        "Your energy is radiating through these words. Ride this wave while it lasts!",
        "High spirits detected! What's fueling this positivity?",
        "This vibrant mood is infectious. What made today shine?",
        "You're in a great headspace. How can you extend this feeling?",
        "Positive momentum like this is worth capturing and remembering."
      ],
      'Positive': [
        "Things seem to be flowing well for you. What's contributing to that?",
        "Your optimistic tone suggests you're finding your rhythm.",
        "A good day comes through clearly. What made the difference?",
        "Positive vibes here. Small wins or big breakthroughs?",
        "You're in a good place mentally. That's worth acknowledging."
      ],
      'Slightly Positive': [
        "There's a gentle optimism here, even if subtle.",
        "You're leaning positive, which is meaningful even in small doses.",
        "A quiet contentment comes through in your words.",
        "Not ecstatic, but steady and positive - that's often underrated."
      ],
      'Neutral': [
        "Balanced and steady. Sometimes neutral is exactly what's needed.",
        "An even keel today. How does this calm feel?",
        "Neutral doesn't mean nothing - it can mean centered and stable.",
        "Sometimes the most productive days feel neutral in retrospect."
      ],
      'Slightly Negative': [
        "There's a subtle weight in your words. What's on your mind?",
        "Something's pulling at you, even if it's not overwhelming. Worth exploring?",
        "A slight dip in mood - small shifts often have specific causes.",
        "Not terrible, but not quite right either. What changed?"
      ],
      'Negative': [
        "Today feels heavy. Remember: one day doesn't define your trajectory.",
        "Tough moments pass. What's one small thing that could help right now?",
        "Difficult emotions are valid. What do you need to move through this?",
        "Hard days happen. Be as kind to yourself as you'd be to a friend.",
        "This feeling is temporary, even if it doesn't feel that way now."
      ],
      'Very Negative': [
        "This is clearly a rough moment. Please reach out to someone you trust if you need support.",
        "When things feel this heavy, remember: you don't have to carry it alone.",
        "Difficult emotions this intense deserve attention and care. Consider talking to someone.",
        "Really tough days need extra self-compassion. What support do you have available?"
      ]
    };

    const options = moodInsights[mood] || moodInsights['Neutral'];
    return this.selectRandom(options);
  }

  getThemeInsight(themes, patterns) {
    const themeWords = themes.slice(0, 3).join(', ');
    
    const templates = [
      `Recurring themes today: ${themeWords}. These are clearly on your mind.`,
      `${themeWords} - these topics are demanding your attention right now.`,
      `Your focus gravitates toward ${themeWords}. What connects them?`,
      `Interesting how ${themeWords} keep surfacing in your thoughts.`,
      `Core themes emerging: ${themeWords}. Worth exploring deeper?`
    ];

    return this.selectRandom(templates);
  }

  getHistoricalInsight(currentMood, previousEntries) {
    if (previousEntries.length < 3) return null;

    const recentMoods = previousEntries.slice(-5).map(e => e.mood || 'Neutral');
    const isImproving = this.detectMoodTrend(recentMoods, currentMood);

    if (isImproving === 'improving') {
      return this.selectRandom([
        "Your mood seems to be trending upward over recent entries. Notice that?",
        "Looking at your recent pattern, things appear to be getting better.",
        "Compared to recent days, there's a positive shift happening."
      ]);
    } else if (isImproving === 'declining') {
      return this.selectRandom([
        "Your mood has dipped compared to recent entries. What changed?",
        "There's been a shift downward recently. Worth reflecting on triggers?",
        "Recent entries show a pattern worth noticing. What's different lately?"
      ]);
    }

    return null;
  }

  detectMoodTrend(recentMoods, currentMood) {
    const moodValues = {
      'Very Positive': 3, 'Positive': 2, 'Slightly Positive': 1,
      'Neutral': 0,
      'Slightly Negative': -1, 'Negative': -2, 'Very Negative': -3
    };

    const recent = recentMoods.map(m => moodValues[m] || 0);
    const current = moodValues[currentMood] || 0;
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;

    if (current > avgRecent + 0.5) return 'improving';
    if (current < avgRecent - 0.5) return 'declining';
    return 'stable';
  }

  getReflectiveQuestion(mood, patterns, context) {
    const questions = [];

    if (patterns.hasChallenge) {
      questions.push(
        "What's one thing you learned from today's challenges?",
        "How might you approach this differently next time?",
        "What support or resources could help with this?"
      );
    }

    if (patterns.hasGoals) {
      questions.push(
        "What's the smallest first step toward your goal?",
        "What obstacles might you encounter, and how can you prepare?",
        "Why does this goal matter to you specifically?"
      );
    }

    if (patterns.hasRelationships) {
      questions.push(
        "How did your interactions today affect your energy?",
        "Which relationships are currently filling your cup?",
        "Is there a connection you'd like to strengthen?"
      );
    }

    if (mood.includes('Positive')) {
      questions.push(
        "What made today feel good, and how can you create more of that?",
        "Who or what contributed most to today's positive energy?",
        "How can you carry this feeling into tomorrow?"
      );
    }

    if (mood.includes('Negative')) {
      questions.push(
        "What's one small thing that could make tomorrow slightly better?",
        "What do you need right now - rest, connection, or something else?",
        "Is there someone you trust who could help lighten this load?"
      );
    }

    // Default questions
    questions.push(
      "What surprised you most about today?",
      "If today had a theme, what would it be?",
      "What deserves more of your attention tomorrow?",
      "What are you grateful for right now, even if it's small?"
    );

    return this.selectRandom(questions);
  }

  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = new AIService(); 