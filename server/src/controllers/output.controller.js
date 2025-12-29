const outputRepo = require('../db/repositories/output.repo');

class OutputController {
  async getEntries(req, res) {
    try {
      const { limit = 50 } = req.query;
      const entries = await outputRepo.getEntries(parseInt(limit));
      res.json(entries);
    } catch (error) {
      console.error('Get output entries error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createEntry(req, res) {
    try {
      const { date, type, count, notes } = req.body;

      if (!date || !type || count === undefined) {
        return res.status(400).json({ 
          error: 'Date, type, and count are required' 
        });
      }

      if (count < 1) {
        return res.status(400).json({ 
          error: 'Count must be at least 1' 
        });
      }

      // Check if output type exists
      const outputType = await outputRepo.getTypeByName(type);
      if (!outputType) {
        return res.status(404).json({ 
          error: `Output type "${type}" not found` 
        });
      }

      const entry = await outputRepo.createEntry({
        date,
        type,
        count,
        notes
      });

      // Update daily stats
      await outputRepo.updateDailyStats(date);

      res.status(201).json(entry);
    } catch (error) {
      console.error('Create output entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteEntry(req, res) {
    try {
      const { id } = req.params;
      const deleted = await outputRepo.deleteEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
      console.error('Delete output entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTypes(req, res) {
    try {
      const types = await outputRepo.getTypes();
      res.json(types);
    } catch (error) {
      console.error('Get output types error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createType(req, res) {
    try {
      const { name, unit, target, color } = req.body;

      if (!name || !unit || target === undefined) {
        return res.status(400).json({ 
          error: 'Name, unit, and target are required' 
        });
      }

      if (target < 1) {
        return res.status(400).json({ 
          error: 'Target must be at least 1' 
        });
      }

      // Check if type already exists
      const existingType = await outputRepo.getTypeByName(name);
      if (existingType) {
        return res.status(409).json({ 
          error: `Output type "${name}" already exists` 
        });
      }

      const type = await outputRepo.createType({
        name: name.trim(),
        unit: unit.trim(),
        target,
        color: color || 'blue'
      });

      res.status(201).json(type);
    } catch (error) {
      console.error('Create output type error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateType(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ 
          error: 'No fields to update' 
        });
      }

      // Check if type exists
      const existingType = await outputRepo.getTypeById(id);
      if (!existingType) {
        return res.status(404).json({ error: 'Output type not found' });
      }

      // If updating name, check if new name conflicts
      if (updates.name && updates.name !== existingType.name) {
        const conflictType = await outputRepo.getTypeByName(updates.name);
        if (conflictType) {
          return res.status(409).json({ 
            error: `Output type "${updates.name}" already exists` 
          });
        }
      }

      const updatedType = await outputRepo.updateType(id, updates);
      res.json(updatedType);
    } catch (error) {
      console.error('Update output type error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteType(req, res) {
    try {
      const { id } = req.params;
      
      // Check if type exists
      const existingType = await outputRepo.getTypeById(id);
      if (!existingType) {
        return res.status(404).json({ error: 'Output type not found' });
      }

      const deleted = await outputRepo.deleteType(id);
      res.json({ 
        message: 'Output type deleted successfully',
        deletedType: existingType
      });
    } catch (error) {
      console.error('Delete output type error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const stats = await outputRepo.getDailyStats(targetDate);
      res.json(stats);
    } catch (error) {
      console.error('Get output stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getStreak(req, res) {
    try {
      const streak = await outputRepo.calculateStreak();
      res.json(streak);
    } catch (error) {
      console.error('Get output streak error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new OutputController();