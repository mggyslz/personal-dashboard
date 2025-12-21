const { GoogleGenAI } = require('@google/genai');

class AIService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.modelName = 'gemini-2.5-flash';
    this.analysisCache = new Map();
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes cache
    this.recentInsights = new Set();
    this.maxRecentInsights = 30;
    this.recentResponseTypes = [];
    this.maxResponseTypeHistory = 5;
    
    if (this.ai) {
      this.checkAvailableModels().then(workingModel => {
        if (workingModel) {
          this.modelName = workingModel;
        }
      });
    }
  }

  async analyze(text, previousEntries = []) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const cacheKey = this.generateCacheKey(text);
    const cached = this.analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result;
    }

    try {
      const analysis = await this.analyzeWithGemini(text, previousEntries);
      
      this.analysisCache.set(cacheKey, {
        result: analysis,
        timestamp: Date.now()
      });
      
      return analysis;
      
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        // Fallback to local analysis on quota exceeded
        return this.fallbackAnalysis(text, previousEntries);
      } else if (error.message.includes('API key')) {
        throw new Error('Invalid Gemini API key. Check your .env file.');
      }
      
      // Fallback to local analysis on other errors
      return this.fallbackAnalysis(text, previousEntries);
    }
  }

  async analyzeWithGemini(text, previousEntries = []) {
    const modelCandidates = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-pro',
    ];

    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const prompt = this.buildJournalPrompt(text, previousEntries);
        
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.95,
            topK: 40,
          }
        });
        
        return this.parseGeminiResponse(response.text);
        
      } catch (error) {
        lastError = error;
        
        // Only try other models for "model not found" errors
        if (!error.message.includes('404') && 
            !error.message.includes('not found') && 
            !error.message.includes('not available') &&
            !error.message.includes('does not exist')) {
          break;
        }
      }
    }

    throw lastError || new Error('Unable to find a working Gemini model');
  }

  async checkAvailableModels() {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const contentModels = data.models?.filter(model => 
        model.supportedGenerationMethods?.includes('generateContent')
      ) || [];
      
      const preferredModels = [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro'
      ];
      
      for (const prefModel of preferredModels) {
        const fullModelName = `models/${prefModel}`;
        if (contentModels.some(model => model.name === fullModelName)) {
          return prefModel;
        }
      }
      
      if (contentModels.length > 0) {
        return contentModels[0].name.replace('models/', '');
      }
      
    } catch (error) {
      // Silently fail - we'll use default model
    }
    
    return null;
  }

  buildJournalPrompt(text, previousEntries) {
    const context = previousEntries.length > 0 
      ? this.buildContextFromHistory(previousEntries)
      : 'No previous entries. This is the first journal entry.';
    
    return `You are an expert life coach and journal analyst. Analyze this journal entry.

  IMPORTANT: Your response MUST be valid, complete JSON. Do not truncate the response.

  JOURNAL ENTRY:
  "${text.substring(0, 1200)}"

  CONTEXT FROM PREVIOUS ENTRIES (last 3):
  ${context}

  RETURN PURE JSON ONLY - no other text:
  {
    "mood": "Very Positive/Positive/Slightly Positive/Neutral/Slightly Negative/Negative/Very Negative",
    "themes": ["theme1", "theme2", "theme3"],
    "insights": "Keep insights concise - maximum 2 sentences."
  }`;
  }

parseGeminiResponse(responseText) {
  try {
    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/^```json\s*/i, '');
    cleanedText = cleanedText.replace(/```$/g, '');
    cleanedText = cleanedText.trim();
    
    // First try to parse directly - it might work even with minor issues
    try {
      const parsed = JSON.parse(cleanedText);
      
      if (!parsed.mood || !parsed.themes || !parsed.insights) {
        throw new Error('Missing required fields in response');
      }
      
      return {
        mood: this.validateMood(parsed.mood),
        themes: this.validateThemes(parsed.themes),
        insights: parsed.insights.toString().substring(0, 500)
      };
    } catch (parseError) {
      // If direct parsing fails, try the more sophisticated fix
      return this.handleTruncatedJSON(responseText);
    }
    
  } catch (error) {
    // Ultimate fallback
    return this.handleTruncatedJSON(responseText);
  }
}

handleTruncatedJSON(jsonText) {
  try {
    // Start with the original text
    let fixedJson = jsonText.trim();
    
    // Remove markdown code blocks
    fixedJson = fixedJson.replace(/^```json\s*/i, '');
    fixedJson = fixedJson.replace(/```$/g, '');
    fixedJson = fixedJson.trim();
    
    // Find the start of JSON
    const jsonStart = fixedJson.indexOf('{');
    if (jsonStart > 0) {
      fixedJson = fixedJson.substring(jsonStart);
    }
    
    // Remove any text after the last complete structure
    // Count braces to find where JSON becomes incomplete
    let braceDepth = 0;
    let inString = false;
    let escapeNext = false;
    let lastGoodIndex = -1;
    
    for (let i = 0; i < fixedJson.length; i++) {
      const char = fixedJson[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '{') braceDepth++;
        if (char === '}') {
          braceDepth--;
          if (braceDepth === 0) {
            lastGoodIndex = i; // This marks the end of a complete object
          }
        }
      }
    }
    
    // If we found a complete JSON object, use it
    if (lastGoodIndex > 0) {
      fixedJson = fixedJson.substring(0, lastGoodIndex + 1);
    } else {
      // Otherwise, try to complete the JSON
      fixedJson = this.completePartialJSON(fixedJson);
    }
    
    // Parse the fixed JSON
    const parsed = JSON.parse(fixedJson);
    
    return {
      mood: this.validateMood(parsed.mood || 'Neutral'),
      themes: this.validateThemes(parsed.themes || ['journal']),
      insights: (parsed.insights || 'Analysis completed. Reflect on what you wrote.').toString().substring(0, 500)
    };
    
  } catch (fixError) {
    // Ultimate fallback
    return {
      mood: 'Neutral',
      themes: ['journal', 'reflection'],
      insights: 'Analysis completed. Reflect on what you wrote.'
    };
  }
}

completePartialJSON(partialJson) {
  let result = partialJson;
  let inString = false;
  let escapeNext = false;
  
  // Count braces and brackets
  let braceCount = 0;
  let bracketCount = 0;
  
  for (let i = 0; i < partialJson.length; i++) {
    const char = partialJson[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }
  }
  
  // Close any open strings
  if (inString) {
    result += '"';
  }
  
  // Close any open arrays
  while (bracketCount > 0) {
    result += ']';
    bracketCount--;
  }
  
  // Close any open objects
  while (braceCount > 0) {
    result += '}';
    braceCount--;
  }
  
  // Ensure the JSON ends with a closing brace
  if (!result.trim().endsWith('}')) {
    // Find the last property and close it
    const lastQuote = result.lastIndexOf('"');
    const lastColon = result.lastIndexOf(':');
    
    if (lastQuote > lastColon) {
      // We were in the middle of a string value - close it
      if (!result.endsWith('"')) {
        result += '"';
      }
      result += '}';
    } else {
      result += '}';
    }
  }
  
  return result;
}

  validateMood(mood) {
    const validMoods = [
      'Very Positive', 'Positive', 'Slightly Positive',
      'Neutral', 
      'Slightly Negative', 'Negative', 'Very Negative'
    ];
    
    if (validMoods.includes(mood)) return mood;
    
    const moodStr = mood.toString();
    if (moodStr.includes('Positive')) return 'Positive';
    if (moodStr.includes('Negative')) return 'Negative';
    if (moodStr.includes('Neutral')) return 'Neutral';
    
    return 'Neutral';
  }

  validateThemes(themes) {
    if (!themes) return ['journal'];
    
    let themeArray;
    
    if (Array.isArray(themes)) {
      themeArray = themes;
    } else if (typeof themes === 'string') {
      try {
        themeArray = JSON.parse(themes);
      } catch {
        themeArray = themes.split(',').map(t => t.trim());
      }
    } else {
      return ['journal'];
    }
    
    return themeArray
      .filter(theme => theme && typeof theme === 'string')
      .map(theme => theme.toLowerCase().trim())
      .filter(theme => theme.length > 0)
      .slice(0, 5);
  }

  generateCacheKey(text) {
    return Buffer.from(text.substring(0, 100)).toString('base64');
  }

  fallbackAnalysis(text, previousEntries = []) {
    const lower = text.toLowerCase();
    let mood = 'Neutral';
    let themes = [];
    
    const positiveWords = ['good', 'great', 'happy', 'excited', 'proud', 'grateful', 'accomplished'];
    const negativeWords = ['bad', 'sad', 'angry', 'frustrated', 'tired', 'guilty', 'anxious', 'stuck'];
    
    const posCount = positiveWords.filter(word => lower.includes(word)).length;
    const negCount = negativeWords.filter(word => lower.includes(word)).length;
    
    if (posCount > negCount + 2) mood = 'Positive';
    else if (negCount > posCount + 2) mood = 'Negative';
    
    if (/code|coding|program|build|ship|debug|feature/i.test(text)) themes.push('coding');
    if (/gym|workout|train|exercise|lift|basketball|sport/i.test(text)) themes.push('training');
    if (/procrastinat|avoid|snooze|scroll|youtube|twitter|tutorial binge/i.test(text)) themes.push('procrastination');
    if (/discipl|focus|routine|habit|consisten|execution/i.test(text)) themes.push('discipline');
    if (/guilt|guilty|regret|ashamed|disappoint/i.test(text)) themes.push('guilt');
    if (/existential|meaning|purpose|absurd|freedom|choice|sartre|camus/i.test(text)) themes.push('existential');
    if (/meditat|mindful|present|breath|observe|calm/i.test(text)) themes.push('mindfulness');
    if (/walk|nature|outside|sun|tree|reflect|ponder/i.test(text)) themes.push('reflection');
    
    if (themes.length === 0) themes.push('journal');
    
    let insights = '';
    if (themes.includes('procrastination')) {
      insights = 'Resistance detected. What\'s the smallest action you can take right now to break this pattern?';
    } else if (themes.includes('coding') && themes.includes('training')) {
      insights = 'Both iron and code require showing up. Which one are you avoiding, and why?';
    } else if (themes.includes('existential')) {
      insights = 'The void is just empty space. What will you create in it today?';
    } else {
      insights = 'Entry recorded. Look for patterns in your thinking over time.';
    }
    
    return {
      mood,
      themes: themes.slice(0, 4),
      insights
    };
  }

  buildContextFromHistory(previousEntries) {
    return previousEntries
      .slice(-3)
      .map(entry => `- ${entry.text.substring(0, 200)}...`)
      .join('\n');
  }

  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  selectMultiple(array, count) {
    return this.shuffleArray(array).slice(0, count);
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
    this.recentInsightsHistory = this.recentInsightsHistory || [];
    this.recentInsightsHistory.push(...newInsights);
    if (this.recentInsightsHistory.length > this.maxInsightsHistory) {
      this.recentInsightsHistory.splice(0, this.recentInsightsHistory.length - this.maxInsightsHistory);
    }
  }
}

module.exports = new AIService();