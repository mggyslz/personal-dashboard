const entriesRepo = require('../db/repositories/entries.repo');
const aiService = require('../services/ai.service');
const moodRepo = require('../db/repositories/mood.repo');

class EntriesController {
  async create(req, res) {
    try {
      const { text, date } = req.body;

      if (!text || !date) {
        return res.status(400).json({
          error: 'Text and date are required'
        });
      }

      // Analyze with AI
      const analysis = await aiService.analyze(text);

      // Create journal entry with analysis
      const entry = await entriesRepo.create({
        date,
        text,
        mood: analysis.mood,
        themes: JSON.stringify(analysis.themes),
        insights: analysis.insights
      });

      // Auto-track mood with current time
      try {
        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
        
        await moodRepo.create({
          entry_date: date,
          mood: analysis.mood,
          time: timeString,
          intensity: 5,
          factors: JSON.stringify(analysis.themes || []),
          note: text.substring(0, 100),
          journal_entry_id: entry.id
        });
      } catch (error) {
        console.error('Auto-track mood from journal failed:', error);
        // Deliberately swallowed — journal creation must succeed
      }

      // Parse themes for response
      const responseEntry = {
        ...entry,
        themes: analysis.themes
      };

      res.status(201).json(responseEntry);
    } catch (error) {
      console.error('Create entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const entries = await entriesRepo.findAll();
      
      // Parse JSON fields
      const parsedEntries = entries.map(entry => ({
        ...entry,
        themes: entry.themes ? JSON.parse(entry.themes) : []
      }));

      res.json(parsedEntries);
    } catch (error) {
      console.error('Get entries error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const entry = await entriesRepo.findById(req.params.id);
      
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      entry.themes = entry.themes ? JSON.parse(entry.themes) : [];
      res.json(entry);
    } catch (error) {
      console.error('Get entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { text, date } = req.body;
      const { id } = req.params;

      if (!text || !date) {
        return res.status(400).json({ 
          error: 'Text and date are required' 
        });
      }

      // Get existing entry
      const existingEntry = await entriesRepo.findById(id);
      if (!existingEntry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      // Re-analyze with AI
      const analysis = await aiService.analyze(text);

      // Update journal entry
      const entry = await entriesRepo.update(id, {
        date,
        text,
        mood: analysis.mood,
        themes: JSON.stringify(analysis.themes),
        insights: analysis.insights
      });

      // Update mood entry if it exists
      try {
        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // Find existing mood entry for this journal entry
        const existingMood = await moodRepo.findByJournalEntryId(id);
        
        if (existingMood) {
          // Update existing mood entry
          await moodRepo.create({
            entry_date: date,
            mood: analysis.mood,
            time: timeString,
            intensity: 5,
            factors: JSON.stringify(analysis.themes || []),
            note: text.substring(0, 100),
            journal_entry_id: id
          });
        } else {
          // Create new mood entry
          await moodRepo.create({
            entry_date: date,
            mood: analysis.mood,
            time: timeString,
            intensity: 5,
            factors: JSON.stringify(analysis.themes || []),
            note: text.substring(0, 100),
            journal_entry_id: id
          });
        }
      } catch (moodError) {
        console.error('Update mood from journal failed:', moodError);
        // Continue - journal update should succeed regardless
      }

      entry.themes = JSON.parse(entry.themes);
      res.json(entry);
    } catch (error) {
      console.error('Update entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Get entry first
      const entry = await entriesRepo.findById(id);
      
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      // Note: Mood entries will be automatically deleted due to CASCADE constraint
      // But we can also explicitly delete them
      try {
        await moodRepo.deleteByJournalEntryId(id);
      } catch (moodError) {
        console.error('Auto-delete mood from journal failed:', moodError);
        // Continue - journal deletion should still proceed
      }

      // Delete the journal entry (cascade will handle mood entries)
      const deleted = await entriesRepo.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
      console.error('Delete entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMoodEntriesStats(req, res) {
    try {
      const stats = await entriesRepo.getMoodStats();
      res.json(stats);
    } catch (error) {
      console.error('Get mood stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new EntriesController();