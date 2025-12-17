const entriesRepo = require('../db/repositories/entries.repo');
const aiService = require('../services/ai.service');

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

      // Create entry with analysis
      const entry = await entriesRepo.create({
        date,
        text,
        mood: analysis.mood,
        themes: JSON.stringify(analysis.themes),
        insights: analysis.insights
      });

      res.status(201).json(entry);
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

      // Re-analyze with AI
      const analysis = await aiService.analyze(text);

      const entry = await entriesRepo.update(id, {
        date,
        text,
        mood: analysis.mood,
        themes: JSON.stringify(analysis.themes),
        insights: analysis.insights
      });

      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
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
      const deleted = await entriesRepo.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
      console.error('Delete entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMoodStats(req, res) {
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