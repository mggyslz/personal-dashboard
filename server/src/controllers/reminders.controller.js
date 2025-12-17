const remindersRepo = require('../db/repositories/reminders.repo');

class RemindersController {
  async create(req, res) {
    try {
      const { text, date, time } = req.body;

      if (!text || !date) {
        return res.status(400).json({ 
          error: 'Text and date are required' 
        });
      }

      const reminder = await remindersRepo.create({ text, date, time: time || '09:00' });
      res.status(201).json(reminder);
    } catch (error) {
      console.error('Create reminder error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const reminders = await remindersRepo.findAll();
      res.json(reminders);
    } catch (error) {
      console.error('Get reminders error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getActive(req, res) {
    try {
      const reminders = await remindersRepo.findActive();
      res.json(reminders);
    } catch (error) {
      console.error('Get active reminders error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { text, date, time, completed } = req.body;
      const { id } = req.params;

      if (!text || !date) {
        return res.status(400).json({ 
          error: 'Text and date are required' 
        });
      }

      const reminder = await remindersRepo.update(id, {
        text,
        date,
        time: time || '09:00',
        completed: completed ? 1 : 0
      });

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      res.json(reminder);
    } catch (error) {
      console.error('Update reminder error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async toggleComplete(req, res) {
    try {
      const reminder = await remindersRepo.toggleComplete(req.params.id);
      
      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      res.json(reminder);
    } catch (error) {
      console.error('Toggle reminder error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await remindersRepo.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
      console.error('Delete reminder error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RemindersController();