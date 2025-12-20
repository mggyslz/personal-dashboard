const Sentiment = require('sentiment');
const nlp = require('compromise');
const stopword = require('stopword');

const sentiment = new Sentiment();

// Core beliefs as weights
const coreBeliefs = {
  disciplineOverMood: 0.8,
  comfortIsSuspicious: 0.6,
  progressBeatsValidation: 0.9,
  excusesAreSignals: 0.7,
  actionOverTheory: 0.8,
  competenceOverApproval: 0.7,
  clarityOverNoise: 0.7
};

// Enhanced signal words with narrative connections
const signalWords = {
  // Drive/Action signals
  shipped: 3.0, built: 2.5, finished: 2.5, completed: 2.5, deployed: 3.0,
  executed: 3.0, fixed: 2.0, solved: 2.5, merged: 2.5,
  won: 2.0, achieved: 2.0, breakthrough: 2.5, optimized: 2.0,
  
  // General/Life Action signals
  walked: 1.5, meditated: 2.0, reflected: 1.5, wrote: 1.5, cooked: 1.0,
  cleaned: 1.0, read: 1.5, explored: 1.5, disconnected: 2.0,
  
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
  tomorrow: -1.0, later: -0.5, eventually: -0.5,
  
  // Connection markers
  instead: -1.8, rather: -1.0, while: -0.5, although: -0.8,
  
  // Cost markers
  cost: 0.8, price: 0.8, tax: 0.8, trade: 0.8, exchange: 0.5
};

const negations = ['not', 'no', 'never', 'neither', 'nor', 'none', "n't", 'cannot', 'hardly', 'scarcely'];

class AIService {
  constructor() {
    this.recentInsights = new Set();
    this.maxRecentInsights = 30;
    this.recentResponseTypes = [];
    this.maxResponseTypeHistory = 5;
    this.recentInsightsHistory = [];
    this.maxInsightsHistory = 3;
    this.userBaseline = this.initializeBaseline();
  }

  initializeBaseline() {
    return {
      totalEntries: 0,
      avgMoodValue: 0,
      avgWordCount: 0,
      executionFrequency: 0, // ratio of execution to avoidance
      commonThemes: {},
      lastExecutionStreak: 0,
      lastAvoidanceStreak: 0
    };
  }

  async analyze(text, previousEntries = []) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Update baseline from history
    this.updateBaseline(previousEntries);

    // DETECTION PHASE
    const wordCount = text.split(/\s+/).length;
    const mood = this.analyzeMood(text);
    const nlpThemes = this.extractThemes(text);
    const manualTopics = this.extractTopicsManually(text);
    let allThemes = [...new Set([...manualTopics, ...nlpThemes])];
    const themes = allThemes.slice(0, 5).filter(t => t && t.trim().length > 0);
    const patterns = this.detectPatterns(text);
    const context = this.analyzeContext(text, previousEntries);
    const signals = this.extractSignals(text);
    const phase = this.detectPhase(text, patterns, signals);
    const temporalContext = this.buildTemporalContext(mood, previousEntries, themes);
    const entryTiming = this.detectEntryTiming(text);
    const severity = this.calculateSeverity(patterns, signals, text, context);
    const energyState = this.detectEnergyState(text, patterns, context, severity);

    // SHORT TEXT HANDLER
    if (wordCount < 20) {
      const shortTextResult = this.handleShortText(text, signals, patterns, context, temporalContext, wordCount);
      if (shortTextResult) {
        return {
          mood,
          themes,
          insights: shortTextResult.insights
        };
      }
    }

    // CALM GATE (improved)
    const isCalmGate = this.detectCalmGate(text, patterns, context, severity);
    
    // INTERPRETATION PHASE
    const { responseType, confidence, contradiction, finalThemes } = this.interpretSignals(
      mood, patterns, context, temporalContext, signals, text, phase, 
      isCalmGate, themes, severity, energyState, entryTiming
    );
    
    this.recentResponseTypes.push(responseType);
    if (this.recentResponseTypes.length > this.maxResponseTypeHistory) {
      this.recentResponseTypes.shift();
    }

    // COACHING PHASE
    const insights = this.generateInsights(
      text, mood, finalThemes, patterns, context, temporalContext, 
      responseType, previousEntries, phase, confidence, contradiction, 
      severity, energyState
    );

    return {
      mood,
      themes: finalThemes,
      insights
    };
  }

  updateBaseline(previousEntries) {
    if (previousEntries.length === 0) return;

    const moodValues = {
      'Very Positive': 3, 'Positive': 2, 'Slightly Positive': 1,
      'Neutral': 0,
      'Slightly Negative': -1, 'Negative': -2, 'Very Negative': -3
    };

    this.userBaseline.totalEntries = previousEntries.length;
    
    // Calculate average mood
    const totalMood = previousEntries.reduce((sum, e) => sum + (moodValues[e.mood] || 0), 0);
    this.userBaseline.avgMoodValue = totalMood / previousEntries.length;

    // Calculate average word count
    const totalWords = previousEntries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
    this.userBaseline.avgWordCount = totalWords / previousEntries.length;

    // Calculate execution frequency (last 10 entries)
    const recent = previousEntries.slice(-10);
    const executionCount = recent.filter(e => 
      e.signals && e.signals.some(s => s.weight > 2.0)
    ).length;
    this.userBaseline.executionFrequency = executionCount / recent.length;

    // Track streaks
    let currentStreak = 0;
    let isExecutionStreak = false;
    
    for (let i = previousEntries.length - 1; i >= 0; i--) {
      const entry = previousEntries[i];
      const hasExecution = entry.signals && entry.signals.some(s => s.weight > 2.0);
      const hasAvoidance = entry.signals && entry.signals.some(s => s.weight < -2.0);
      
      if (i === previousEntries.length - 1) {
        isExecutionStreak = hasExecution;
        currentStreak = hasExecution || hasAvoidance ? 1 : 0;
      } else {
        if ((isExecutionStreak && hasExecution) || (!isExecutionStreak && hasAvoidance)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    if (isExecutionStreak) {
      this.userBaseline.lastExecutionStreak = currentStreak;
      this.userBaseline.lastAvoidanceStreak = 0;
    } else {
      this.userBaseline.lastAvoidanceStreak = currentStreak;
      this.userBaseline.lastExecutionStreak = 0;
    }
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
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    
    const words = [...nouns, ...verbs]
      .map(w => w.toLowerCase().trim())
      .filter(word => {
        if (!word || word.length < 3) return false;
        if (/[^a-z\s-]/.test(word)) return false;
        const commonStops = ['the', 'this', 'that', 'these', 'those', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had'];
        if (commonStops.includes(word)) return false;
        return true;
      });
    
    const cleaned = stopword.removeStopwords(words);
    
    const freq = {};
    cleaned.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
      .filter(word => word.length >= 3);
  }

  extractTopicsManually(text) {
    const lower = text.toLowerCase();
    const topics = [];
    
    if (/code|coding|programm|feature|bug|deploy|ship|build|project|commit|merge|api|cache|react|optimiz|fix|debug/.test(lower)) {
      topics.push('coding');
    }
    if (/gym|lift|workout|train|basketball|exercise|pr|deadlift|bench|sport|physical/.test(lower)) {
      topics.push('training');
    }
    if (/discipl|focus|consisten|routine|habit|execution|motivat|willpower/.test(lower)) {
      topics.push('discipline');
    }
    if (/procrastinat|delay|postpone|snooze|snoozed|late|tired|lazy|avoid/.test(lower)) {
      topics.push('procrastination');
    }
    if (/guilt|guilty|regret|ashamed|disappoint/.test(lower)) {
      topics.push('guilt');
    }
    if (/avoid|procrastinat|distract|waste|scroll|twitter|youtube|tutorial|watch|video/.test(lower)) {
      topics.push('resistance');
    }
    if (/progress|improv|better|growth|advance|level|achievement|accomplish|success/.test(lower)) {
      topics.push('progress');
    }
    if (/stuck|difficult|struggle|challenge|problem|debug|error|bug|fix|hard/.test(lower)) {
      topics.push('challenge');
    }
    if (/tomorrow|maybe|should|could|would|but|however|though|cycle|pattern/.test(lower)) {
      topics.push('pattern');
    }
    if (/read|book|learn|study|tutorial|research/.test(lower)) {
      topics.push('learning');
    }
    if (/meaning|purpose|life|death|exist|absurd|choice|freedom|sartre|camus|nietzsche|why am i/.test(lower)) {
      topics.push('existentialism');
    }
    if (/meditat|mindful|present|now|breath|suffering|detach|impermanen|calm|aware|observe|ego/.test(lower)) {
      topics.push('buddhism');
    }
    if (/walk|hike|nature|outside|sun|tree|river|sky|air|think|reflect|ponder|wander/.test(lower)) {
      topics.push('reflection');
    }
    if (/cook|clean|friend|social|family|hobby|music|art|create|fun|play/.test(lower)) {
      topics.push('life');
    }
    if (/execute|action|do|done|finished|complete|ship|deploy|deliver/.test(lower)) {
      topics.push('execution');
    }
    if (/instead|while|rather|although|even though/.test(lower)) {
      topics.push('tradeoff');
    }
    if (/cost|price|tax|trade|exchange|sacrifice/.test(lower)) {
      topics.push('cost');
    }
    
    return [...new Set(topics)];
  }

  detectPatterns(text) {
    const lower = text.toLowerCase();
    
    const hasResistanceTradeoff = /instead.*(tutorial|watch|scroll|youtube|twitter)|while.*(should|need to)|rather than.*(train|gym|workout)/i.test(text);
    const hasCostLanguage = /cost.*(time|energy|focus)|price.*(pay)|tax.*(avoid|procrastinate)/i.test(text);
    const hasGuiltAvoidanceCombo = /guilt.*(snooze|scroll|tutorial|watch)|guilty.*instead.*train/i.test(text);
    const avoidanceKeywords = (text.match(/snooze|scroll|tutorial|watch|delay|procrastinate|avoid/gi) || []);
    const hasMultipleAvoidance = avoidanceKeywords.length >= 2;
    const excuseKeywords = (text.match(/but|maybe|tomorrow|should|could|would|however|though|at least/gi) || []);
    const delayKeywords = (text.match(/later|tomorrow|eventually|someday|next week|when i/gi) || []);
    
    return {
      hasGoals: /goal|plan|want to|need to|should|will|going to/i.test(text),
      hasGratitude: /grateful|thankful|appreciate|blessed|lucky|glad/i.test(text),
      hasWorry: /worry|anxious|stress|nervous|afraid|scared|concern/i.test(text),
      hasRelationships: /friend|family|partner|colleague|relationship|people/i.test(text),
      hasWork: /work|job|project|meeting|deadline|task|career|code|build|ship|api|bug|fix/i.test(text),
      hasHealth: /exercise|health|sleep|eat|tired|energy|workout|gym|lift|train/i.test(text),
      hasReflection: /realize|learned|understand|think|feel|notice|know|wonder|ponder/i.test(text),
      hasChallenge: /difficult|hard|struggle|challenge|problem|tough|stuck|debug|error|bug/i.test(text),
      hasAchievement: /achieved|completed|accomplished|success|proud|win|shipped|finished|built|fixed|solved/i.test(text),
      hasResistance: /avoid|procrastinat|distract|waste|scroll|twitter|youtube|snooze|late|instead|tutorial|watch/i.test(text),
      hasDiscipline: /focus|discipl|consisten|routine|habit|execution|motivat/i.test(text),
      hasProcrastination: /snooze|snoozed|late|procrastinat|delay|postpone|tomorrow|maybe/i.test(text),
      hasGuilt: /guilt|guilty|regret|ashamed|disappoint|should have/i.test(text),
      hasExcuses: excuseKeywords.length > 0,
      hasUncertainty: /don't know|not sure|where to start|how to|unsure|confused about|unclear/i.test(text),
      hasDelayMarkers: delayKeywords.length > 0,
      hasExistential: /meaning|purpose|absurd|freedom|choice|existence|void|death/i.test(text),
      hasMindfulness: /breath|present|now|moment|observe|detach|calm|mindful/i.test(text),
      hasNature: /walk|hike|sun|outside|fresh air|nature/i.test(text),
      hasQuestion: text.includes('?'),
      hasExclamation: text.includes('!'),
      emotionalIntensity: (text.match(/!/g) || []).length + (text.match(/\?/g) || []).length,
      hasResistanceTradeoff,
      hasCostLanguage,
      hasGuiltAvoidanceCombo,
      hasMultipleAvoidance,
      hasTrainingAvoidance: /gym|lift|train|workout.*(instead|rather|while|although)/i.test(text),
      hasCodingAvoidance: /code|program|build.*(instead.*scroll|rather.*watch|while.*tutorial)/i.test(text),
      avoidanceCount: avoidanceKeywords.length,
      excuseCount: excuseKeywords.length,
      isConfirmedAvoidance: avoidanceKeywords.length >= 2 && delayKeywords.length > 0 && excuseKeywords.length > 0
    };
  }

  analyzeContext(text, previousEntries) {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    const recentPositiveSignalScore = previousEntries.slice(-3).reduce((sum, e) => {
      const positiveSignals = e.signals && e.signals.filter(s => s.weight > 0);
      return sum + (positiveSignals ? positiveSignals.reduce((s, signal) => s + signal.weight, 0) : 0);
    }, 0);
    
    const recentNegativeSignalScore = previousEntries.slice(-3).reduce((sum, e) => {
      const negativeSignals = e.signals && e.signals.filter(s => s.weight < 0);
      return sum + (negativeSignals ? negativeSignals.reduce((s, signal) => s + signal.weight, 0) : 0);
    }, 0);
    
    const lowAvoidanceDensity = recentNegativeSignalScore > -5;
    const hasRecentExecution = recentPositiveSignalScore > 5;
    
    return {
      wordCount,
      sentenceCount,
      avgSentenceLength,
      isLong: wordCount > 200,
      isShort: wordCount < 50,
      hasHistory: previousEntries.length > 0,
      recentEntryCount: previousEntries.length,
      lowAvoidanceDensity,
      hasRecentExecution,
      recentPositiveSignalScore,
      recentNegativeSignalScore
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

  detectPhase(text, patterns, signals) {
    const signalScore = signals.reduce((sum, s) => sum + s.weight, 0);
    const lower = text.toLowerCase();
    
    if (patterns.hasUncertainty && !patterns.hasDelayMarkers && patterns.hasGoals) {
      return 'orientation';
    }
    
    if (signalScore > 2 || patterns.hasAchievement || /shipped|built|finished|completed|deployed|fixed|solved/.test(lower)) {
      return 'execution';
    }
    
    if (patterns.hasGoals && !patterns.hasUncertainty) {
      return 'initiation';
    }
    
    return 'initiation';
  }

  buildTemporalContext(mood, previousEntries, themes) {
    if (previousEntries.length === 0) {
      return { trend: 'baseline', repeatedThemes: [], volatility: 'unknown', isPattern: false };
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
    
    const recentThemes = previousEntries.slice(-5).flatMap(e => e.themes || []);
    const themeFreq = {};
    recentThemes.forEach(t => themeFreq[t] = (themeFreq[t] || 0) + 1);
    
    const repeatedThemes = Object.entries(themeFreq)
      .filter(([_, count]) => count >= 3)
      .map(([theme]) => theme);
    
    const isPattern = themes.some(t => repeatedThemes.includes(t));
    
    const variance = recentMoods.reduce((sum, m) => sum + Math.pow(m - avgRecent, 2), 0) / (recentMoods.length || 1);
    const volatility = variance > 2 ? 'high' : variance > 0.5 ? 'moderate' : 'stable';
    
    return { trend, repeatedThemes, volatility, isPattern };
  }

  detectCalmGate(text, patterns, context, severity) {
    const lower = text.toLowerCase();
    
    const hasSensoryLanguage = /sky|wind|light|air|quiet|breathing|calm|stillness|peace|sun|tree|river|nature/.test(lower);
    const hasReflectionVerbs = /noticed|felt|observed|contemplat|ponder|listen|present/.test(lower);
    
    const noGoals = !patterns.hasGoals;
    const noDelay = !patterns.hasDelayMarkers;
    const noExcuses = !patterns.hasExcuses;
    const noAvoidance = !patterns.hasResistance && !patterns.hasProcrastination;
    
    // Additional check: severity must be low AND no recent avoidance pattern
    const lowSeverity = severity < 3;
    const noRecentAvoidance = this.userBaseline.lastAvoidanceStreak < 2;

    return hasSensoryLanguage && hasReflectionVerbs && noGoals && 
           noDelay && noExcuses && noAvoidance && lowSeverity && noRecentAvoidance;
  }

  handleShortText(text, signals, patterns, context, temporalContext, wordCount) {
    const signalDensity = signals.length / wordCount;
    
    // If very short with no clear signals, request context
    if (wordCount < 10 && signalDensity < 0.2) {
      return {
        insights: "Too brief to read clearly. What's the fuller picture?"
      };
    }

    // Short text with no history = observe only
    if (wordCount < 20 && !context.hasHistory) {
      return {
        insights: "Noted. I'll have better context as we build history."
      };
    }

    // Short text with strong signal = trust it
    const hasStrongSignal = signals.some(s => Math.abs(s.weight) > 2.0);
    if (hasStrongSignal) {
      return null; // Continue with normal analysis
    }

    // Short ambiguous text = lean on temporal context
    if (temporalContext.isPattern) {
      return null; // Pattern detected, continue with analysis
    }

    // Default for short ambiguous text
    const lower = text.toLowerCase();
    if (/tired|exhausted|drained/i.test(lower)) {
      if (this.userBaseline.lastExecutionStreak > 2) {
        return {
          insights: "Tired after execution is earned rest. Recovery is strategic."
        };
      } else {
        return {
          insights: "Tired without execution is suspicious. What's really happening?"
        };
      }
    }

    return {
      insights: "Signal is weak. What's the context I'm missing?"
    };
  }

  detectEntryTiming(text) {
    const lower = text.toLowerCase();
    const hasMorningMarkers = /morning|woke up|alarm|breakfast|coffee/i.test(lower);
    const hasNightMarkers = /tonight|bed|sleep|tired|exhausted|end of day/i.test(lower);
    const hasAfternoonMarkers = /lunch|afternoon|midday/i.test(lower);

    if (hasMorningMarkers) return 'morning';
    if (hasNightMarkers) return 'night';
    if (hasAfternoonMarkers) return 'afternoon';
    return 'unknown';
  }

  calculateSeverity(patterns, signals, text, context) {
    let severity = 0;

    // Count resistance markers
    const avoidanceWords = (text.match(/snooze|scroll|avoid|procrastinate|distract/gi) || []).length;
    severity += avoidanceWords * 1.5;

    // Weight by signal strength
    const negativeSignalSum = signals
      .filter(s => s.weight < 0)
      .reduce((sum, s) => sum + Math.abs(s.weight), 0);
    severity += negativeSignalSum;

    // Pattern repetition increases severity
    if (context.hasHistory && patterns.hasProcrastination) {
      const recentAvoidance = context.recentEntryCount > 0 ? 
        context.recentNegativeSignalScore : 0;
      if (recentAvoidance < -5) severity += 2;
    }

    // Excuse count adds to severity
    if (patterns.excuseCount > 2) severity += patterns.excuseCount;

    // Guilt + avoidance combo is more severe
    if (patterns.hasGuilt && patterns.hasResistance) severity += 2;

    // Normalize to 0-10 scale
    return Math.min(Math.round(severity), 10);
  }

  detectEnergyState(text, patterns, context, severity) {
    const lower = text.toLowerCase();
    
    // Physical exhaustion markers
    const exhaustionMarkers = /exhausted|drained|burnt out|can't focus|brain fog|dead tired/i.test(lower);
    const physicalMarkers = /sore|aching|hurting|injured|sick|ill/i.test(lower);
    
    // Mental fatigue markers
    const mentalFatigueMarkers = /overwhelmed|can't think|brain dead|mentally tired|burnt/i.test(lower);
    
    // Burnout markers
    const burnoutMarkers = /everything feels|nothing matters|going through motions|numb/i.test(lower);

    // Context check: recent execution streak + exhaustion = legitimate fatigue
    const hasEarnedExhaustion = this.userBaseline.lastExecutionStreak > 3 && exhaustionMarkers;

    if (burnoutMarkers || (mentalFatigueMarkers && severity < 3)) {
      return 'burnout_risk';
    }
    
    if (physicalMarkers) {
      return 'physical_limitation';
    }

    if (hasEarnedExhaustion) {
      return 'earned_exhaustion';
    }

    if (exhaustionMarkers && severity > 5) {
      return 'exhaustion_excuse';
    }

    if (mentalFatigueMarkers) {
      return 'mental_fatigue';
    }

    return 'normal';
  }

  interpretSignals(mood, patterns, context, temporalContext, signals, text, phase, isCalmGate, initialThemes, severity, energyState, entryTiming) {
    const lowerText = text.toLowerCase();
    let responseType = 'observe_neutral';
    let confidence = 0.5; 
    let contradiction = null;
    let finalThemes = [...initialThemes];

    // Calm Gate Lock
    if (isCalmGate) {
      responseType = 'integrate_presence';
      confidence = 1.0;
      
      const allowedThemes = ['reflection', 'mindfulness', 'calm', 'nature', 'health'];
      finalThemes = finalThemes.filter(t => allowedThemes.includes(t));
      
      return { responseType, confidence, contradiction, finalThemes };
    }

    // Energy State Override
    if (energyState === 'burnout_risk') {
      responseType = 'address_burnout';
      confidence = 0.9;
      return { responseType, confidence, contradiction, finalThemes };
    }

    if (energyState === 'physical_limitation') {
      responseType = 'validate_recovery';
      confidence = 0.85;
      return { responseType, confidence, contradiction, finalThemes };
    }

    if (energyState === 'earned_exhaustion') {
      responseType = 'validate_rest';
      confidence = 0.9;
      return { responseType, confidence, contradiction, finalThemes };
    }

    // Contradiction Detection
    if (patterns.hasAchievement && patterns.hasGuilt) {
      contradiction = 'achievement_guilt';
      responseType = 'integrate_contradiction';
      confidence = 0.8;
    } else if (patterns.hasReflection && patterns.hasAchievement) {
      contradiction = 'reflection_momentum';
      responseType = 'integrate_contradiction';
      confidence = 0.7;
    } else if (patterns.hasHealth && patterns.hasReflection && patterns.hasAchievement) {
      contradiction = 'rest_clarity';
      responseType = 'integrate_contradiction';
      confidence = 0.6;
    }
    
    if (contradiction) return { responseType, confidence, contradiction, finalThemes };
    
    // Strategic Recovery Gate (improved with baseline)
    const isStrategicRecovery = this.userBaseline.lastExecutionStreak > 2 && 
                            context.lowAvoidanceDensity && 
                            /rest|sleep|relax|read|walk/.test(lowerText) &&
                            severity < 4;

    // Core Logic
    if (phase === 'orientation') {
      responseType = 'orient_to_action';
      confidence = 0.9;
    }
    // High severity + confirmed avoidance
    else if (severity >= 7 && patterns.isConfirmedAvoidance) {
      responseType = 'confront_resistance';
      confidence = 0.95;
    }
    // Medium-high severity
    else if (severity >= 5 && (patterns.hasGuiltAvoidanceCombo || patterns.hasResistanceTradeoff || patterns.hasMultipleAvoidance)) {
      responseType = 'confront_tradeoff';
      confidence = 0.85;
    }
    // Pattern recurrence with severity
    else if (temporalContext.isPattern && 
             temporalContext.repeatedThemes.some(t => t === 'resistance' || t === 'procrastination') && 
             temporalContext.trend !== 'improving' &&
             severity >= 4) {
      responseType = 'expose_pattern';
      confidence = 0.8;
    }
    // High-score execution
    else if (signals.reduce((sum, s) => sum + s.weight, 0) > 3 && patterns.hasAchievement) {
      responseType = 'push_momentum';
      confidence = 0.8;
    }
    // Philosophical
    else if (patterns.hasExistential) {
      responseType = 'philosophical_perspective';
      confidence = 0.75;
    } else if (patterns.hasNature && (patterns.hasReflection || patterns.hasMindfulness)) {
      responseType = 'validate_detachment';
      confidence = 0.7;
    } else if (patterns.hasMindfulness) {
      responseType = 'validate_presence';
      confidence = 0.65;
    }
    // General confrontation (with severity check)
    else if ((patterns.hasProcrastination || patterns.hasResistance) && 
             patterns.hasExcuses && 
             !isStrategicRecovery && 
             severity >= 3) {
      responseType = 'confront_resistance';
      confidence = 0.7;
    }
    // Goals but no execution
    else if (patterns.hasGoals && phase === 'initiation') {
      responseType = 'challenge_intent';
      confidence = 0.6;
    }
    // Acknowledge positives
    else if (temporalContext.trend === 'improving' || patterns.hasAchievement) {
      responseType = 'acknowledge_trajectory';
      confidence = 0.7;
    }
    // Deep reflection
    else if (patterns.hasReflection && context.isLong) {
      responseType = 'validate_depth';
      confidence = 0.6;
    }
    // Gratitude
    else if (patterns.hasGratitude) {
      responseType = 'note_perspective';
      confidence = 0.5;
    }
    // Neutral
    else {
      responseType = 'observe_neutral_diagnostic';
      confidence = 0.3;
    }

    // Lower confidence without resistance signals
    const hasResistance = patterns.hasResistance || patterns.hasProcrastination;
    const hasExcuses = patterns.hasExcuses;
    const hasDelay = patterns.hasDelayMarkers;

    if (!hasResistance && !hasExcuses && !hasDelay) {
      confidence = Math.min(confidence, 0.4);
    }

    // Cap confrontational repetition
    if (responseType.includes('confront_') || responseType.includes('expose_')) {
      const recentConfronts = this.recentResponseTypes.filter(t => t.includes('confront_') || t.includes('expose_'));
      if (recentConfronts.length >= 2) {
        if (confidence >= 0.7) {
          responseType = 'observe_neutral_diagnostic';
          confidence = 0.4;
        }
      }
    }

    // Strategic Recovery Final Block
    if (responseType.includes('confront_') || responseType.includes('expose_') || responseType.includes('challenge_')) {
      if (isStrategicRecovery) {
        responseType = 'validate_detachment';
        confidence = 0.9;
      }
    }

    return { responseType, confidence, contradiction, finalThemes };
  }

  generateInsights(text, mood, themes, patterns, context, temporalContext, responseType, previousEntries, phase, confidence, contradiction, severity, energyState) {
    // Complex narrative for high confidence confrontations
    if (confidence >= 0.7 && (responseType.includes('confront') || responseType === 'expose_pattern')) {
      const narrative = this.buildCohesiveNarrative(responseType, text, patterns, themes, phase, severity);
      if (narrative) {
        const hasQuestion = narrative.includes('?');
        if (hasQuestion && this.recentInsightsHistory.filter(i => i.includes('?')).length >= 1) {
          return narrative.split('?')[0].trim() + ".";
        }
        this.updateInsightsHistory([narrative]);
        return narrative;
      }
    }

    let insights = [];

    // Energy State Responses
    if (energyState === 'burnout_risk') {
      insights.push(...this.selectMultiple([
        "This reads like burnout, not laziness. Recovery isn't optional—it's required. What's one thing you can remove from your plate this week?",
        "Going through the motions is a signal. Your system is overloaded. Strategic retreat beats collapse.",
        "Burnout whispers before it screams. You're in the whisper phase. Listen now or pay later."
      ], 1));
    } else if (energyState === 'earned_exhaustion') {
      insights.push(...this.selectMultiple([
        "This exhaustion is earned. Your execution streak proves it. Rest is part of the strategy, not a break from it.",
        "Fatigue after consistent execution is the tax on growth. Pay it, then compound.",
        "You've been running hot. This cooldown is maintenance, not retreat."
      ], 1));
    } else if (energyState === 'physical_limitation') {
      insights.push(...this.selectMultiple([
        "Physical limits are real constraints. Adjust the plan, don't abandon the mission.",
        "Injury isn't failure. Ignoring injury is. What's the modified version of your goal?",
        "Your body is giving you data. Listen to it."
      ], 1));
    }

    // Contradiction Integration
    if (contradiction === 'achievement_guilt') {
      insights.push(...this.selectMultiple([
        "You shipped and still feel guilt. The guilt measures your standards, not your failure. Acknowledge the win before chasing perfection.",
        "Achievement + Guilt = high-performer anxiety. The work is done. Let it be done.",
        "Don't let the pursuit of 'perfect' steal the victory of 'done'."
      ], 1));
    } else if (contradiction === 'reflection_momentum') {
      insights.push(...this.selectMultiple([
        "Reflection after action is strategic. You're integrating the lesson, not avoiding the next step.",
        "Clarity is the reward of execution. Use this pause to optimize, not to slow down.",
        "Your mind is processing. This is fuel, not friction."
      ], 1));
    } else if (contradiction === 'rest_clarity') {
      insights.push(...this.selectMultiple([
        "Strategic recovery. That's how sprints become marathons.",
        "The best rest leads to the clearest thinking. What did this reveal about your next move?",
        "Distance debugs the mind. What pattern became visible from here?"
      ], 1));
    }

    // Core response
    if (!insights.length) {
      insights.push(...this.getCoreResponse(responseType, temporalContext, themes, patterns, text, phase, confidence, severity));
    }

    // Weighted Doctrine Application
    if (coreBeliefs.disciplineOverMood >= 0.7 && (patterns.hasWorry || mood.includes('Negative')) && confidence < 0.7) {
      insights.push(...this.selectMultiple([
        "Mood is weather. Discipline is climate. Focus on what you control.",
        "Feelings are data, not directives. Execute anyway.",
        "The mood will pass. The work won't do itself."
      ], 1));
    }

    if (coreBeliefs.comfortIsSuspicious >= 0.6 && /comfortable|easy|relax|snooze/i.test(text) && 
        responseType !== 'validate_detachment' && responseType !== 'integrate_contradiction' && 
        responseType !== 'validate_rest' && severity > 3) {
      insights.push(...this.selectMultiple([
        "Comfort is a trap dressed as recovery.",
        "Easy feels good until you realize it's stagnation.",
        "Rest is tactical. Comfort is strategic failure."
      ], 1));
    }

    if (coreBeliefs.progressBeatsValidation >= 0.8 && patterns.hasAchievement) {
      insights.push(...this.selectMultiple([
        "Results speak. You don't need to.",
        "Progress is the validation. Everything else is noise.",
        "You built something. That's the scorecard."
      ], 1));
    }

    if (coreBeliefs.excusesAreSignals >= 0.7 && patterns.hasExcuses && confidence < 0.7 && severity >= 3) {
      insights.push(...this.selectMultiple([
        "Excuses are data. They show you where resistance lives.",
        "'At least' is often a rationalization. Notice when you use it.",
        "Every excuse points to a decision you're avoiding."
      ], 1));
    }

    // Thematic linking
    if (patterns.hasTrainingAvoidance && patterns.hasCodingAvoidance) {
      insights.push(...this.selectMultiple([
        "You're avoiding both iron and code. That's not coincidence—it's a pattern.",
        "The gym and your editor both require the same thing: showing up.",
        "Resistance doesn't discriminate. It attacks what matters most."
      ], 1));
    }

    // Closing challenge
    let closingChallenge = null;
    if (responseType !== 'integrate_presence' && responseType !== 'validate_rest') {
      closingChallenge = this.getClosingChallenge(responseType, patterns, mood, text, phase, confidence, severity);
    }

    // Filter and format
    const filtered = insights.filter(insight => !this.recentInsights.has(insight));
    let selected = this.shuffleArray(filtered).slice(0, this.getRandom(2, 3));

    // Question capping
    const recentQuestions = this.recentInsightsHistory.filter(i => i.includes('?')).length;
    let newInsights = [];
    let questionAdded = false;

    for (let s of selected) {
      if (s.includes('?') && (recentQuestions >= 1 || questionAdded)) {
        const declarative = s.split('?')[0].trim();
        newInsights.push(declarative.endsWith('.') ? declarative : declarative + ".");
      } else {
        newInsights.push(s);
        if (s.includes('?')) {
          questionAdded = true;
        }
      }
    }
    selected = newInsights;

    // Add closing challenge
    if (closingChallenge && !questionAdded) {
      selected.push(closingChallenge);
    } else if (closingChallenge && questionAdded) {
      if (closingChallenge.includes('?')) {
        const statement = closingChallenge.split('?')[0].trim() + ".";
        selected.push(statement);
      } else {
        selected.push(closingChallenge);
      }
    }

    const joinedInsights = selected.join(' ');
    this.updateInsightsHistory([joinedInsights]);

    // Track recent insights
    selected.forEach(insight => {
      this.recentInsights.add(insight);
      if (this.recentInsights.size > this.maxRecentInsights) {
        const firstInsight = this.recentInsights.values().next().value;
        this.recentInsights.delete(firstInsight);
      }
    });

    return joinedInsights;
  }

  buildCohesiveNarrative(responseType, text, patterns, themes, phase, severity) {
    if (responseType === 'confront_tradeoff' || responseType === 'expose_pattern') {
      const severityLevel = severity >= 7 ? 'high' : severity >= 5 ? 'medium' : 'low';
      if (severityLevel === 'high') {
        const components = {
          observation: this.selectRandom([
            "Three snoozes, a tutorial binge, and guilt. That's not learning—that's a resistance workout",
            "You traded iron for pixels again. Same pattern, sharper execution",
            "Guilt is the tax you pay for choosing comfort over commitment"
          ]),
          implication: this.selectRandom([
            "You're training avoidance, not building discipline",
            "The pattern is precise: discomfort → distraction → guilt → repeat",
            "Each snooze button is a vote for the person you don't want to be"
          ]),
          action_question: this.selectRandom([
            "What's the exact time you're setting your alarm for tomorrow?",
            "When the alarm goes off, what's the first physical movement?",
            "What's one thing you'll do differently before bed tonight?"
          ])
        };
        return `${components.observation}. ${components.implication}. ${components.action_question}`;
      } else if (severityLevel === 'medium') {
        return this.selectRandom([
          "Avoidance dressed as productivity. You know the difference. What's the real next move?",
          "The gym doesn't care about your React optimization. Neither does your future self.",
          "You're choosing comfort over growth. Make it conscious or make it stop."
        ]);
      }
    }

    if (responseType === 'philosophical_perspective' || patterns.hasExistential) {
      const components = {
        observation: this.selectRandom([
          "Meaning isn't found, it's forged",
          "The void you feel is just the space where you haven't acted yet",
          "Absurdity is the canvas, not the barrier"
        ]),
        philosophical_truth: this.selectRandom([
          "You are condemned to be free",
          "Existence precedes essence",
          "The struggle itself is enough to fill a man's heart"
        ]),
        perspective_shift: this.selectRandom([
          "Your anxiety is just the dizziness of that freedom",
          "Stop looking for the path and start walking it",
          "Action is the only rebellion that matters"
        ]),
        grounding_question: this.selectRandom([
          "What will you create in this void today?",
          "How will you use your terrible freedom right now?"
        ])
      };
      
      return `${components.observation}. ${components.philosophical_truth}. ${components.perspective_shift}. ${components.grounding_question}`;
    }

    return null;
  }

  getCoreResponse(responseType, temporalContext, themes, patterns, text, phase, confidence, severity) {
    if (responseType === 'integrate_presence') {
      return this.selectMultiple([
        "This moment recalibrated your nervous system. That's not idle time—it's maintenance.",
        "You are simply present. This stillness is the foundation of clarity.",
        "Notice the quiet. That's the system resetting. This pause is strategic.",
        "Stability is a success state. Peace is valid."
      ], 1);
    }
    if (responseType === 'observe_neutral_diagnostic') {
      if (confidence < 0.4) {
        return this.selectMultiple([
          "Ambiguous signal. No action forced. What do you see that I don't?",
          "Low signal strength. The system is withholding pressure. Monitor and move forward.",
          "Baseline reading. Nothing to correct, nothing to compound. Maintain discipline."
        ], 1);
      } else {
        return this.selectMultiple([
          "The trend is stable but direction is unclear. What's the hidden cost in this stability?",
          "Low signal-to-noise ratio. You have agency here. Use it.",
          "Neutral ground. That's fine. What's the next deliberate move?"
        ], 1);
      }
    }

    if (responseType === 'orient_to_action') {
      return this.selectMultiple([
        "You're not avoiding—you're standing at the fork. Lock in 30 minutes and pick one concrete task. Clarity comes from motion, not thought.",
        "Intent without direction isn't failure—it's the starting line. Pick the smallest move that gets you from 'I want to' to 'I did'.",
        "You've got fuel, no map. Maps come from moving. Time-box 20 minutes to reduce one piece of uncertainty.",
        "Decision paralysis isn't procrastination. You showed up. Now convert it. What's one micro-action that shrinks the problem?"
      ], 1);
    }

    if (responseType === 'validate_rest') {
      return this.selectMultiple([
        "This exhaustion is earned. Your recent execution proves it. Rest is strategy, not retreat.",
        "You've been running hot. This cooldown is maintenance. Don't confuse recovery with avoidance.",
        "Strategic rest after consistent execution is how you avoid burnout. This is load management."
      ], 1);
    }

    if (responseType === 'validate_recovery') {
      return this.selectMultiple([
        "Physical limits are real. Adjust the plan, don't abandon it. What's the modified version?",
        "Your body is giving you data. Ignoring it is how small injuries become big problems.",
        "Recovery is part of training. This isn't time off—it's strategic adaptation."
      ], 1);
    }

    if (responseType === 'address_burnout') {
      return this.selectMultiple([
        "This reads like burnout, not laziness. Recovery isn't optional. What's one thing you can cut this week?",
        "Going through the motions is a red flag. Your system is overloaded. Strategic retreat beats collapse.",
        "Burnout whispers before it screams. You're in the whisper phase. What needs to change?"
      ], 1);
    }

    const responses = {
      philosophical_perspective: [
        "The feeling of pointlessness is Existentialism's starting line. You choose the meaning.",
        "Sartre called it 'bad faith'—pretending we don't have a choice. You always do.",
        "Impermanence isn't a bug. This struggle passes. Do the work anyway.",
        "You are the observer of your thoughts, not the thoughts themselves. Step back."
      ],
      
      validate_detachment: [
        "Walking is thinking in motion. Sometimes the best debugging happens away from the screen.",
        "Getting outside your field prevents mental overfitting. Perspective requires distance.",
        "Nature restores what screens deplete. This was a system reboot.",
        "Solvitur ambulando—'it is solved by walking'."
      ],

      validate_presence: [
        "You're here. Not in the past (guilt) or future (anxiety). That's where work gets done.",
        "A mindful breath is a rep for the brain. Good reset.",
        "Noticing the distraction is the practice. You noticed. Now return."
      ],

      confront_tradeoff: [
        "You're trading discipline for comfort. The cost is momentum. Break the pattern with one decisive move."
      ],

      confront_resistance: [
        "Same pattern, new words. You're not stuck—you're choosing avoidance.",
        "The resistance has better excuses now, but it's still resistance.",
        "You know what needs doing. The question is why you're not doing it.",
        "Planning is resistance wearing a productivity mask.",
        "This isn't confusion. It's comfort disguised as strategy.",
        "YouTube tutorials are productivity theater. Action is what counts.",
        "Snooze buttons train avoidance. Three times is a full workout."
      ],
      
      push_momentum: [
        "You're in the zone. Stack another win while you have traction.",
        "Momentum is here. Don't waste it coasting.",
        "This is what execution looks like. Keep the pressure on.",
        "You're building. Don't stop to admire—compound it."
      ],
      
      expose_pattern: [
        "You've written this before. Pattern recognition is step one. Breaking it is step two.",
        "Same issue, different entry. This is a loop. You know how to exit it.",
        "Recurring problem means you're choosing not to solve it.",
        "Guilt + avoidance = predictable pattern. Break the equation."
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
        "Better than last week. That's the standard."
      ],
      
      validate_depth: [
        "Deep reflection builds clarity. This is necessary work.",
        "You're processing, not avoiding. That distinction matters.",
        "This level of thought precedes breakthroughs. Keep going.",
        "Writing this much means it matters. Trust the process."
      ],
      
      note_perspective: [
        "Gratitude shifts the frame. Use it.",
        "Appreciation is a tool. You're using it right.",
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
    return this.selectMultiple(pool, 1);
  }

  getClosingChallenge(responseType, patterns, mood, text, phase, confidence, severity) {
    const challenges = [];
    // High confidence + high severity = concrete action question
    if (confidence >= 0.7 && severity >= 5 && (responseType.includes('confront_') || responseType.includes('expose_'))) {
      if (patterns.hasProcrastination) {
        challenges.push(
          "What's the exact time you're setting your alarm for tomorrow?",
          "When the alarm goes off, what's the first physical movement?",
          "What's one thing you'll do differently before bed tonight?"
        );
      } else if (patterns.hasGoals) {
        challenges.push(
          "What's the first 30 minutes of execution look like?",
          "What's blocking you from doing this today?",
          "What's the micro-action that proves your intent in the next 15 minutes?"
        );
      } else if (patterns.hasChallenge) {
        challenges.push(
          "What's one thing you learned that you'll use next time?",
          "What's the smallest move that breaks this pattern?",
          "How would you approach this if failure wasn't an option?"
        );
      }
    }

    if (phase === 'orientation') {
      challenges.push(
        "What's the smallest thing you could do in the next 20 minutes to reduce uncertainty?",
        "If you had to pick one micro-task right now, what would it be?",
        "What's the first physical action that moves this from idea to motion?"
      );
    }

    if (patterns.hasExistential) {
      challenges.push(
        "If this moment has no inherent meaning, what meaning are you assigning to it?",
        "What action remains if you accept the absurdity?",
        "What terrifies you about your freedom to choose right now?"
      );
    }

    if (patterns.hasNature || patterns.hasMindfulness) {
      challenges.push(
        "What clarity did you find that you can apply in here?",
        "How can you bring this stillness into your next high-stress task?",
        "What problem solved itself while you weren't looking?"
      );
    }

    // Universal fallbacks
    challenges.push(
      "What deserves focus tomorrow that didn't get it today?",
      "What's one thing you're pretending not to know?",
      "What's the next right move?"
    );

    const uniqueChallenges = [...new Set(challenges)];
    return this.selectRandom(uniqueChallenges);
  }

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

  updateInsightsHistory(newInsights) {
    this.recentInsightsHistory.push(...newInsights);
    if (this.recentInsightsHistory.length > this.maxInsightsHistory) {
      this.recentInsightsHistory.splice(0, this.recentInsightsHistory.length - this.maxInsightsHistory);
    }
  }
}

module.exports = new AIService();