const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const nlp = require('compromise');
const stopword = require('stopword');

// Personal Doctrine - Your core beliefs
const coreBeliefs = {
  disciplineOverMood: true,
  comfortIsSuspicious: true,
  progressBeatsValidation: true,
  excusesAreSignals: true,
  actionOverTheory: true,
  competenceOverApproval: true,
  clarityOverNoise: true
};

// Signal words with weights (for decision-making, not just sentiment)
const signalWords = {
  // Drive/Action signals
  shipped: 3.0, built: 2.5, finished: 2.5, completed: 2.5, deployed: 3.0,
  executed: 3.0, fixed: 2.0, solved: 2.5, merged: 2.5,
  won: 2.0, achieved: 2.0, breakthrough: 2.5, optimized: 2.0,
  
  // Resistance signals (stronger weights)
  procrastinated: -3.0, avoided: -3.0, skipped: -2.5, wasted: -2.5,
  distracted: -2.5, scrolled: -2.0, snooze: -2.5, guilty: -1.5,
  stuck: -2.0, confused: -1.5, lost: -2.0, failed: -2.0,
  
  // Discipline signals
  focused: 2.0, disciplined: 2.5, consistent: 2.0, routine: 1.5,
  
  // Comfort trap signals
  comfortable: -1.5, easy: -1.0, relaxed: -0.8, rest: -0.5,
  
  // Excuse markers
  but: -1.0, should: -1.5, could: -0.8, maybe: -1.2, trying: -1.5,
  tomorrow: -1.0, later: -0.5, eventually: -0.5
};

// Negations
const negations = ['not', 'no', 'never', 'neither', 'nor', 'none', "n't", 'cannot'];

class AIService {
  constructor() {
    this.recentInsights = new Set();
    this.maxRecentInsights = 30;
    this.recentResponseTypes = [];
    this.maxResponseTypeHistory = 5;
  }

  async analyze(text, previousEntries = []) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const mood = this.analyzeMood(text);
    
    // Get themes from NLP
    const nlpThemes = this.extractThemes(text);
    
    // Get manual topics as fallback/supplement
    const manualTopics = this.extractTopicsManually(text);
    
    // Combine, deduplicate, and limit to 5 unique themes
    const allThemes = [...new Set([...manualTopics, ...nlpThemes])];
    const themes = allThemes.slice(0, 5).filter(t => t && t.trim().length > 0);
    
    const patterns = this.detectPatterns(text);
    const context = this.analyzeContext(text, previousEntries);
    const signals = this.extractSignals(text);
    const temporalContext = this.buildTemporalContext(text, mood, previousEntries, themes);
    const responseType = this.decideResponseType(mood, patterns, context, temporalContext, signals, text);
    const insights = this.generateInsights(text, mood, themes, patterns, context, temporalContext, responseType, previousEntries);

    return {
      mood,
      themes,
      insights
    };
  }

  analyzeMood(text) {
    const result = sentiment.analyze(text);
    const score = result.score;
    const comparative = result.comparative;

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
    
    // Extract nouns and verbs properly
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    
    // Clean and filter words properly
    const words = [...nouns, ...verbs]
      .map(w => w.toLowerCase().trim())
      .filter(word => {
        if (!word || word.length < 3) return false;
        if (/[^a-z\s-]/.test(word)) return false;
        const commonStops = ['the', 'this', 'that', 'these', 'those', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had'];
        if (commonStops.includes(word)) return false;
        return true;
      });
    
    // Use stopword library for additional cleaning
    const cleaned = stopword.removeStopwords(words);
    
    // Count frequency
    const freq = {};
    cleaned.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    // Return top 5 themes, but only if they appear meaningful
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
      .filter(word => word.length >= 3);
  }

  extractTopicsManually(text) {
    const lower = text.toLowerCase();
    const topics = [];
    
    // Work/Code topics
    if (/code|coding|programm|feature|bug|deploy|ship|build|project|commit|merge|api|cache|react|optimiz|fix|debug/.test(lower)) {
      topics.push('coding');
    }
    
    // Training/Gym topics
    if (/gym|lift|workout|train|basketball|exercise|pr|deadlift|bench|sport|physical/.test(lower)) {
      topics.push('training');
    }
    
    // Discipline/Procrastination topics
    if (/discipl|focus|consisten|routine|habit|execution|motivat|willpower/.test(lower)) {
      topics.push('discipline');
    }
    
    if (/procrastinat|delay|postpone|snooze|snoozed|late|tired|lazy|avoid/.test(lower)) {
      topics.push('procrastination');
    }
    
    if (/guilt|guilty|regret|ashamed|disappoint/.test(lower)) {
      topics.push('guilt');
    }
    
    // Resistance topics
    if (/avoid|procrastinat|distract|waste|scroll|twitter|youtube|tutorial|watch|video/.test(lower)) {
      topics.push('resistance');
    }
    
    // Progress topics
    if (/progress|improv|better|growth|advance|level|achievement|accomplish|success/.test(lower)) {
      topics.push('progress');
    }
    
    // Challenge topics
    if (/stuck|difficult|struggle|challenge|problem|debug|error|bug|fix|hard/.test(lower)) {
      topics.push('challenge');
    }
    
    // Excuse/Pattern topics
    if (/tomorrow|maybe|should|could|would|but|however|though|cycle|pattern/.test(lower)) {
      topics.push('pattern');
    }
    
    // Philosophy/Reading topics
    if (/nietzsche|philosophy|read|book|learn|study|tutorial|research/.test(lower)) {
      topics.push('learning');
    }
    
    // Execution topics
    if (/execute|action|do|done|finished|complete|ship|deploy|deliver/.test(lower)) {
      topics.push('execution');
    }
    
    // Deduplicate
    return [...new Set(topics)];
  }

  detectPatterns(text) {
    const doc = nlp(text);
    const lower = text.toLowerCase();

    return {
      hasGoals: /goal|plan|want to|need to|should|will|going to/i.test(text),
      hasGratitude: /grateful|thankful|appreciate|blessed|lucky|glad/i.test(text),
      hasWorry: /worry|anxious|stress|nervous|afraid|scared|concern/i.test(text),
      hasRelationships: /friend|family|partner|colleague|relationship|people/i.test(text),
      hasWork: /work|job|project|meeting|deadline|task|career|code|build|ship|api|bug|fix/i.test(text),
      hasHealth: /exercise|health|sleep|eat|tired|energy|workout|gym|lift|train/i.test(text),
      hasReflection: /realize|learned|understand|think|feel|notice|know/i.test(text),
      hasChallenge: /difficult|hard|struggle|challenge|problem|tough|stuck|debug|error|bug/i.test(text),
      hasAchievement: /achieved|completed|accomplished|success|proud|win|shipped|finished|built|fixed|solved/i.test(text),
      hasResistance: /avoid|procrastinat|distract|waste|scroll|twitter|youtube|snooze|late|instead|tutorial|watch/i.test(text),
      hasDiscipline: /focus|discipl|consisten|routine|habit|execution|motivat/i.test(text),
      hasProcrastination: /snooze|snoozed|late|procrastinat|delay|postpone|tomorrow|maybe/i.test(text),
      hasGuilt: /guilt|guilty|regret|ashamed|disappoint|should have/i.test(text),
      hasExcuses: /but|maybe|tomorrow|should|could|would|however|though|at least/i.test(text),
      hasQuestion: text.includes('?'),
      hasExclamation: text.includes('!'),
      emotionalIntensity: (text.match(/!/g) || []).length + (text.match(/\?/g) || []).length,
      timeReferences: {
        morning: /morning|breakfast|woke|snooze/i.test(text),
        afternoon: /afternoon|lunch/i.test(text),
        evening: /evening|dinner|night/i.test(text),
        past: /yesterday|last week|ago|was|were/i.test(text),
        future: /tomorrow|next|will|plan|hope|tomorrow/i.test(text)
      }
    };
  }

  analyzeContext(text, previousEntries) {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

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

  extractSignals(text) {
    const words = text.toLowerCase().split(/\s+/);
    const signals = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w]/g, '');
      const isNegated = i > 0 && negations.includes(words[i - 1].replace(/[^\w]/g, ''));
      
      if (signalWords[word]) {
        let weight = signalWords[word];
        if (isNegated) weight *= -1;
        signals.push({ word, weight, isNegated });
      }
    }
    
    return signals;
  }

  buildTemporalContext(text, mood, previousEntries, themes) {
    if (previousEntries.length === 0) {
      return {
        trend: 'baseline',
        repeatedThemes: [],
        volatility: 'unknown',
        isPattern: false
      };
    }
    
    const moodValues = {
      'Very Positive': 3, 'Positive': 2, 'Slightly Positive': 1,
      'Neutral': 0,
      'Slightly Negative': -1, 'Negative': -2, 'Very Negative': -3
    };
    
    const recentMoods = previousEntries.slice(-7).map(e => moodValues[e.mood] || 0);
    const currentMoodValue = moodValues[mood] || 0;
    const avgRecent = recentMoods.reduce((a, b) => a + b, 0) / (recentMoods.length || 1);
    
    let trend;
    if (currentMoodValue > avgRecent + 0.7) trend = 'improving';
    else if (currentMoodValue < avgRecent - 0.7) trend = 'declining';
    else trend = 'stable';
    
    // Detect repeated themes
    const recentThemes = previousEntries
      .slice(-5)
      .flatMap(e => e.themes || []);
    
    const themeFreq = {};
    recentThemes.forEach(t => themeFreq[t] = (themeFreq[t] || 0) + 1);
    
    const repeatedThemes = Object.entries(themeFreq)
      .filter(([_, count]) => count >= 3)
      .map(([theme]) => theme);
    
    const isPattern = themes.some(t => repeatedThemes.includes(t));
    
    // Volatility
    const variance = recentMoods.reduce((sum, m) => sum + Math.pow(m - avgRecent, 2), 0) / (recentMoods.length || 1);
    const volatility = variance > 2 ? 'high' : variance > 0.5 ? 'moderate' : 'stable';
    
    return { trend, repeatedThemes, volatility, isPattern };
  }

  decideResponseType(mood, patterns, context, temporalContext, signals, text) {
    const signalScore = signals.reduce((sum, s) => sum + s.weight, 0);
    const lowerText = text.toLowerCase();
    
    // Strong resistance + excuses pattern
    if ((patterns.hasProcrastination || patterns.hasGuilt) && patterns.hasExcuses) {
      return 'confront_resistance';
    }
    
    // Classic "tomorrow" or "maybe" excuse
    if (/\btomorrow\b|\bmaybe\b|\bshould have\b|\bwould have\b/.test(lowerText)) {
      if (patterns.hasResistance || patterns.hasProcrastination) {
        return 'confront_resistance';
      }
    }
    
    // Pattern detection with confrontation
    if (patterns.hasResistance && temporalContext.isPattern) {
      return 'confront_resistance';
    }
    
    if (temporalContext.trend === 'declining' && patterns.hasChallenge) {
      return 'confront_slide';
    }
    
    // Achievement + discipline = push harder
    if (patterns.hasAchievement && patterns.hasDiscipline && signalScore > 0) {
      return 'push_momentum';
    }
    
    // High action signals
    if (signalScore > 3) {
      return 'reinforce_execution';
    }
    
    // Stuck with repeated theme
    if (patterns.hasChallenge && temporalContext.isPattern) {
      return 'expose_pattern';
    }
    
    // Worry without goals
    if (patterns.hasWorry && !patterns.hasGoals) {
      return 'redirect_action';
    }
    
    // Guilt + procrastination combo
    if (patterns.hasGuilt && patterns.hasProcrastination) {
      return 'expose_pattern';
    }
    
    // Goals detected
    if (patterns.hasGoals) {
      return 'challenge_intent';
    }
    
    // Improving trend
    if (temporalContext.trend === 'improving') {
      return 'acknowledge_trajectory';
    }
    
    // Reflection + detailed writing
    if (patterns.hasReflection && context.isLong) {
      return 'validate_depth';
    }
    
    // Gratitude
    if (patterns.hasGratitude) {
      return 'note_perspective';
    }
    
    // Negative mood with resistance
    if (mood.includes('Negative') && (patterns.hasResistance || patterns.hasProcrastination)) {
      return 'confront_resistance';
    }
    
    // Default observe
    return 'observe_neutral';
  }

  generateInsights(text, mood, themes, patterns, context, temporalContext, responseType, previousEntries) {
    const insights = [];
    
    // Core response based on type
    insights.push(...this.getCoreResponse(responseType, temporalContext, themes, patterns, text));
    
    // Contextual observations
    if (context.isLong && patterns.hasReflection) {
      insights.push(...this.selectMultiple([
        "You're processing deeply here. That's necessary work.",
        "Detailed reflection like this builds clarity over time.",
        "The length tells me you're working through something real.",
        "Writing this much means it matters. Keep digging."
      ], 1));
    }
    
    if (context.isShort && !patterns.hasChallenge) {
      insights.push(...this.selectMultiple([
        "Short and clear. Sometimes that's all you need.",
        "Concise capture. The signal is there.",
        "Brief doesn't mean shallow. This works."
      ], 1));
    }
    
    // Temporal context insights
    if (temporalContext.trend === 'declining' && !insights.some(i => i.includes('slipping'))) {
      insights.push(...this.selectMultiple([
        "Trajectory is slipping. Catch it now before it accelerates.",
        "The trend is downward. Time to tighten the screws.",
        "You're sliding. Notice it, name it, correct it."
      ], 1));
    }
    
    if (temporalContext.repeatedThemes.length > 0 && !responseType.includes('confront')) {
      const theme = temporalContext.repeatedThemes[0];
      insights.push(...this.selectMultiple([
        `${theme} keeps showing up. Either solve it or accept it's not actually a problem.`,
        `Third time writing about ${theme}. Pattern recognition is step one. Action is step two.`,
        `Recurring: ${theme}. The solution isn't more thinking.`
      ], 1));
    }
    
    // Specific pattern observations
    if (patterns.hasProcrastination && patterns.hasExcuses) {
      insights.push(...this.selectMultiple([
        "'Tomorrow' is the most expensive word in the language of discipline.",
        "Snooze buttons and 'maybe' are the same muscle: avoidance.",
        "YouTube tutorials feel productive until you realize what you're avoiding."
      ], 1));
    }
    
    if (patterns.hasGuilt && patterns.hasResistance) {
      insights.push(...this.selectMultiple([
        "Guilt is the tax on avoidance. Pay it once with action instead.",
        "Feeling guilty about skipping training while learning React is irony in real time.",
        "The guilt tells you what matters. Now listen to it."
      ], 1));
    }
    
    // Doctrine-aligned observations
    if (coreBeliefs.disciplineOverMood && (patterns.hasWorry || mood.includes('Negative'))) {
      insights.push(...this.selectMultiple([
        "Mood is weather. Discipline is climate. Focus on what you control.",
        "Feelings are data, not directives. Execute anyway.",
        "The mood will pass. The work won't do itself."
      ], 1));
    }
    
    if (coreBeliefs.progressBeatsValidation && patterns.hasAchievement) {
      insights.push(...this.selectMultiple([
        "Results speak. You don't need to.",
        "Progress is the validation. Everything else is noise.",
        "You built something. That's the scorecard."
      ], 1));
    }
    
    if (coreBeliefs.comfortIsSuspicious && /comfortable|easy|rest|relax|snooze/i.test(text)) {
      insights.push(...this.selectMultiple([
        "Comfort is a trap dressed as recovery.",
        "Easy feels good until you realize it's stagnation.",
        "Rest is tactical. Comfort is strategic failure."
      ], 1));
    }
    
    if (coreBeliefs.excusesAreSignals && patterns.hasExcuses) {
      insights.push(...this.selectMultiple([
        "Excuses are data. They show you where resistance lives.",
        "'But' and 'maybe' are red flags. Notice them.",
        "Every excuse points to a decision you're avoiding."
      ], 1));
    }
    
    // Add a closing question/challenge (selective, not every time)
    if (this.getRandom(1, 3) === 1 && this.getRandom(1, 2) === 1) {
      const closingChallenge = this.getClosingChallenge(responseType, patterns, mood, text);
      if (closingChallenge) {
        insights.push(closingChallenge);
      }
    }
    
    // Filter repetition
    const filtered = insights.filter(insight => !this.recentInsights.has(insight));
    const selected = this.shuffleArray(filtered).slice(0, this.getRandom(2, 3));
    
    // Track used insights
    selected.forEach(insight => {
      this.recentInsights.add(insight);
      if (this.recentInsights.size > this.maxRecentInsights) {
        const first = this.recentInsights.values().next().value;
        this.recentInsights.delete(first);
      }
    });
    
    // Track response type to avoid repetition
    this.recentResponseTypes.push(responseType);
    if (this.recentResponseTypes.length > this.maxResponseTypeHistory) {
      this.recentResponseTypes.shift();
    }
    
    // Join insights into a single string
    return selected.join(' ');
  }

  getCoreResponse(responseType, temporalContext, themes, patterns, text) {
    const lowerText = text.toLowerCase();
    
    // Special case for procrastination + excuses
    if ((responseType === 'confront_resistance' || responseType === 'expose_pattern') && 
        (/\bsnooze\b|\bsnoozed\b|\btomorrow\b|\bmaybe\b/.test(lowerText))) {
      const specificResponses = [
        "Three snoozes = three conscious decisions to avoid discomfort. That's a pattern, not an accident.",
        "YouTube tutorials won't fix the discipline deficit. The gym doesn't care about your React optimization.",
        "'At least I learned something' is the most dangerous excuse—it disguises avoidance as productivity.",
        "You traded iron for pixels. One builds strength, the other builds excuses.",
        "Guilt about skipping training while 'learning' is irony in real time. Both are choices."
      ];
      
      // Avoid repeating response types too often
      if (this.recentResponseTypes.filter(t => t === responseType).length >= 2) {
        return this.selectMultiple(specificResponses, 1);
      }
      
      return this.selectMultiple(specificResponses, 1);
    }
    
    const responses = {
      confront_resistance: [
        "Same pattern, new words. You're not stuck—you're choosing avoidance.",
        "The resistance has better excuses now, but it's still resistance.",
        "You already know what needs doing. The question is why you're not doing it.",
        "Planning is resistance wearing a productivity mask.",
        "This isn't confusion. It's comfort disguised as strategy.",
        "YouTube tutorials are productivity theater. Action is what counts.",
        "Snooze buttons train your avoidance muscle. Three times is a workout."
      ],
      
      confront_slide: [
        "You're slipping and you know it. Stop the slide now.",
        "The trend doesn't lie. You're losing ground.",
        "This is the third signal. How many more before you act?",
        "Decline starts slow, accelerates fast. You're in the danger zone."
      ],
      
      push_momentum: [
        "You're in the zone. Stack another win while you have traction.",
        "Momentum is here. Don't waste it on coasting.",
        "This is what execution looks like. Keep the pressure on.",
        "You're building. Don't stop to admire—compound it."
      ],
      
      reinforce_execution: [
        "Action over analysis. You're doing it right.",
        "Results are stacking. This is how winning works.",
        "You shipped. That's what matters.",
        "Execution beats intention every time. You proved it today."
      ],
      
      expose_pattern: [
        "You've written this before. The problem isn't new—your response is.",
        "Same issue, different entry. Pattern recognition is step one. Breaking it is step two.",
        "This is a loop. You know how to exit it.",
        "Recurring problem means you're choosing not to solve it.",
        "Guilt + avoidance = predictable pattern. Break the equation."
      ],
      
      redirect_action: [
        "Worrying without action is just noise. What's the move?",
        "Stress doesn't need analysis. It needs a plan.",
        "You're spinning. Pick one thing and execute.",
        "Anxiety dissolves when you shift to doing."
      ],
      
      challenge_intent: [
        "Goals are cheap. Execution is expensive. Which are you paying for?",
        "You named the target. Now what's the first move?",
        "Intent without action is fantasy.",
        "Plans feel productive. Building is productive. Don't confuse them."
      ],
      
      acknowledge_trajectory: [
        "The trend is up. That's execution, not luck.",
        "You're climbing. Keep the discipline tight.",
        "Progress is compounding. This is how it's built.",
        "Better than last week. Better than last month. That's the standard."
      ],
      
      validate_depth: [
        "Deep reflection builds clarity. This is necessary work.",
        "You're processing, not avoiding. That distinction matters.",
        "This level of thought precedes breakthroughs. Keep going.",
        "Writing this much means it matters. Trust the process."
      ],
      
      note_perspective: [
        "Gratitude shifts the frame. Use it.",
        "Appreciation is a tool, not just a feeling. You're using it right.",
        "Perspective matters more than people admit. You're seeing it.",
        "Finding signal in the noise—that's what this is."
      ],
      
      observe_neutral: [
        "Steady is underrated. Not every day is war.",
        "Baseline. No drama, no crisis. That's fine.",
        "Neutral isn't nothing. It's stable ground.",
        "Holding position isn't retreat. Sometimes it's strategy."
      ]
    };
    
    const pool = responses[responseType] || responses['observe_neutral'];
    
    // Avoid repeating response types too often
    if (this.recentResponseTypes.filter(t => t === responseType).length >= 2) {
      return this.selectMultiple(pool, 1);
    }
    
    return this.selectMultiple(pool, 1);
  }

  getClosingChallenge(responseType, patterns, mood, text) {
    const lowerText = text.toLowerCase();
    const challenges = [];
    
    // Specific to procrastination patterns
    if (patterns.hasProcrastination || /\bsnooze\b|\blate\b/.test(lowerText)) {
      challenges.push(
        "What's the exact time you're setting your alarm for tomorrow?",
        "When the alarm goes off, what's the first physical movement you'll make?",
        "What's one thing you'll do differently before bed tonight?"
      );
    }
    
    if (patterns.hasGuilt) {
      challenges.push(
        "What's the specific action that would resolve this guilt?",
        "If you couldn't feel guilty, what would you do right now?",
        "What's the lesson here that doesn't require self-punishment?"
      );
    }
    
    if (patterns.hasChallenge) {
      challenges.push(
        "What's one thing you learned that you'll use next time?",
        "How would you approach this if you couldn't fail?",
        "What's the smallest move that breaks the pattern?"
      );
    }
    
    if (patterns.hasGoals) {
      challenges.push(
        "What's the first 30 minutes of execution look like?",
        "If you had to do this today, what's blocking you?",
        "Why does this goal matter to you—actually?"
      );
    }
    
    if (patterns.hasExcuses || /\bbut\b|\bmaybe\b|\bshould\b/.test(lowerText)) {
      challenges.push(
        "What's the excuse pattern here? Name it precisely.",
        "If someone else wrote this, what would you tell them?",
        "What are you actually afraid of?"
      );
    }
    
    if (mood.includes('Positive')) {
      challenges.push(
        "How do you replicate this tomorrow?",
        "What made today work that you can systematize?",
        "Can you increase the intensity or is this the ceiling?"
      );
    }
    
    if (patterns.hasResistance) {
      challenges.push(
        "What's the excuse pattern here? Name it precisely.",
        "If someone else wrote this, what would you tell them?",
        "What are you actually afraid of?"
      );
    }
    
    // Universal challenges
    challenges.push(
      "What deserves focus tomorrow that didn't get it today?",
      "What's one thing you're pretending not to know?",
      "If this entry had a title, what would it be?",
      "What's the next right move?"
    );
    
    return this.selectRandom(challenges);
  }

  // UTILITY FUNCTIONS
  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  selectMultiple(array, count) {
    return this.shuffleArray(array).slice(0, count);
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