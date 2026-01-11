const moodRepo = require('../db/repositories/mood.repo');
const entriesRepo = require('../db/repositories/entries.repo');

class MoodController {
  async getMoodSummary(req, res) {
    try {
      // Get mood entries from mood tracking table
      const moodEntries = await moodRepo.getRecent(30);
      
      if (moodEntries.length === 0) {
        // Fallback to journal entries if no mood entries
        const journalEntries = await entriesRepo.findAll();
        
        if (journalEntries.length === 0) {
          return res.json({ 
            currentMood: null,
            message: 'No mood data found',
            recommendations: ['Start by writing a journal entry']
          });
        }

        // Use latest journal entry
        const latestEntry = journalEntries[0];
        const recommendations = MoodController.getMoodRecommendations(latestEntry.mood);
        
        return res.json({
          currentMood: latestEntry.mood,
          currentThemes: latestEntry.themes ? JSON.parse(latestEntry.themes) : [],
          currentInsights: latestEntry.insights,
          moodDistribution: MoodController.getMoodDistributionFromEntries(journalEntries),
          totalEntries: journalEntries.length,
          recommendations
        });
      }

      // Use mood tracking data
      const latestMood = moodEntries[0];
      
      // Get mood distribution
      const moodStats = await moodRepo.getMoodStats('30d');
      const moodDistribution = {};
      moodStats.forEach(stat => {
        moodDistribution[stat.mood] = stat.count;
      });

      // Get journal entry for themes/insights if available
      let currentThemes = [];
      let currentInsights = '';
      
      if (latestMood.journal_entry_id) {
        const journalEntry = await entriesRepo.findById(latestMood.journal_entry_id);
        if (journalEntry) {
          currentThemes = journalEntry.themes ? JSON.parse(journalEntry.themes) : [];
          currentInsights = journalEntry.insights || '';
        }
      }

      const recommendations = MoodController.getMoodRecommendations(latestMood.mood);

      res.json({
        currentMood: latestMood.mood,
        currentThemes,
        currentInsights,
        moodDistribution,
        totalEntries: moodEntries.length,
        recommendations
      });
    } catch (error) {
      console.error('Get mood summary error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMoodHistory(req, res) {
    try {
      const { limit = 30 } = req.query;
      const moodEntries = await moodRepo.getRecent(parseInt(limit));
      
      const moodHistory = await Promise.all(
        moodEntries.map(async (moodEntry) => {
          let themes = [];
          let insights = '';
          
          // Get corresponding journal entry for themes
          if (moodEntry.journal_entry_id) {
            const journalEntry = await entriesRepo.findById(moodEntry.journal_entry_id);
            if (journalEntry) {
              themes = journalEntry.themes ? JSON.parse(journalEntry.themes) : [];
              insights = journalEntry.insights || '';
            }
          }

          return {
            entry_date: moodEntry.entry_date,
            time: moodEntry.time,
            mood: moodEntry.mood,
            intensity: moodEntry.intensity,
            themes,
            insights,
            note: moodEntry.note,
            journal_entry_id: moodEntry.journal_entry_id
          };
        })
      );

      res.json(moodHistory);
    } catch (error) {
      console.error('Get mood history error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMoodAnalysis(req, res) {
    try {
      const moodEntries = await moodRepo.getRecent(365); // Last year
      
      if (moodEntries.length === 0) {
        return res.json({
          total: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          averageMood: 'No data',
          positivePercentage: 0,
          streak: 0
        });
      }

      const moodValues = {
        'Very Positive': 3,
        'Positive': 2,
        'Slightly Positive': 1,
        'Neutral': 0,
        'Slightly Negative': -1,
        'Negative': -2,
        'Very Negative': -3
      };

      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      let totalValue = 0;

      moodEntries.forEach(entry => {
        const value = moodValues[entry.mood] || 0;
        totalValue += value;
        
        if (value > 0) positiveCount++;
        else if (value < 0) negativeCount++;
        else neutralCount++;
      });

      const averageValue = totalValue / moodEntries.length;
      
      // Convert average value back to mood label
      let averageMood = 'Neutral';
      if (averageValue > 1.5) averageMood = 'Very Positive';
      else if (averageValue > 0.5) averageMood = 'Positive';
      else if (averageValue > 0) averageMood = 'Slightly Positive';
      else if (averageValue < -1.5) averageMood = 'Very Negative';
      else if (averageValue < -0.5) averageMood = 'Negative';
      else if (averageValue < 0) averageMood = 'Slightly Negative';

      const streak = MoodController.calculateMoodStreak(moodEntries);

      res.json({
        total: moodEntries.length,
        positiveCount,
        negativeCount,
        neutralCount,
        averageMood,
        positivePercentage: Math.round((positiveCount / moodEntries.length) * 100),
        streak
      });
    } catch (error) {
      console.error('Get mood stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMoodChartData(req, res) {
    try {
      const { days = 30 } = req.query;
      const moodEntries = await moodRepo.getRecent(parseInt(days));
      
      const moodValues = {
        'Very Positive': 3,
        'Positive': 2,
        'Slightly Positive': 1,
        'Neutral': 0,
        'Slightly Negative': -1,
        'Negative': -2,
        'Very Negative': -3
      };

      const chartData = moodEntries
        .map(moodEntry => ({
          entry_date: moodEntry.entry_date,
          time: moodEntry.time,
          mood: moodEntry.mood,
          value: moodValues[moodEntry.mood] || 0,
          intensity: moodEntry.intensity,
          journal_entry_id: moodEntry.journal_entry_id
        }))
        .reverse(); // Oldest first for chart

      // Add themes for each mood entry
      const chartDataWithThemes = await Promise.all(
        chartData.map(async (data) => {
          let themes = [];
          if (data.journal_entry_id) {
            const journalEntry = await entriesRepo.findById(data.journal_entry_id);
            if (journalEntry && journalEntry.themes) {
              themes = JSON.parse(journalEntry.themes);
            }
          }
          return {
            ...data,
            themes
          };
        })
      );

      res.json(chartDataWithThemes);
    } catch (error) {
      console.error('Get mood chart data error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Helper method to get mood distribution from journal entries
  static getMoodDistributionFromEntries(entries) {
    const moodCounts = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });
    return moodCounts;
  }

  static getMoodRecommendations(mood) {
    const recommendations = {
      'Very Positive': [
        "Share your positivity with others",
        "Channel this energy into creative work",
        "Document what's working well"
      ],
      'Positive': [
        "Practice gratitude",
        "Do something kind for someone",
        "Enjoy this good feeling"
      ],
      'Slightly Positive': [
        "Nurture this mood with small joys",
        "Listen to uplifting music",
        "Acknowledge the small wins"
      ],
      'Neutral': [
        "Use this calm for reflection",
        "Try light exercise or meditation",
        "Find a small moment of joy"
      ],
      'Slightly Negative': [
        "Be gentle with yourself",
        "Talk to a friend or write about it",
        "Change your environment"
      ],
      'Negative': [
        "Practice self-care",
        "Journal about what's bothering you",
        "Reach out for support"
      ],
      'Very Negative': [
        "Be extra kind to yourself",
        "Consider professional support",
        "Focus on basic needs first"
      ]
    };

    return recommendations[mood] || [
      "Reflect on what you're feeling",
      "Consider writing about it in your journal",
      "Practice self-compassion"
    ];
  }

  static calculateMoodStreak(moodEntries) {
    if (moodEntries.length === 0) return 0;
    
    // Get unique dates from mood entries
    const uniqueDates = [...new Set(moodEntries.map(entry => entry.entry_date))];
    
    // Sort dates descending
    uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const entryDate = new Date(uniqueDates[i]);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

module.exports = new MoodController();