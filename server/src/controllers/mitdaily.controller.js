const mitDailyRepo = require('../db/repositories/mitdaily.repo');

class MITDailyController {
  async getTodayTask(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const task = await mitDailyRepo.findByDate(today);
      
      if (!task) {
        return res.json({ 
          date: today,
          task: '',
          completed: false,
          exists: false
        });
      }
      
      res.json({
        ...task,
        exists: true
      });
    } catch (error) {
      console.error('Get today task error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async setTodayTask(req, res) {
    try {
      const { task } = req.body;
      const today = new Date().toISOString().split('T')[0];

      if (!task || task.trim() === '') {
        return res.status(400).json({ 
          error: 'Task is required' 
        });
      }

      const existingTask = await mitDailyRepo.findByDate(today);
      
      let result;
      if (existingTask) {
        // Update existing task
        result = await mitDailyRepo.update(existingTask.id, {
          task: task.trim(),
          completed: 0 // Reset completion when task changes
        });
      } else {
        // Create new task
        result = await mitDailyRepo.create({
          date: today,
          task: task.trim(),
          completed: 0
        });
      }

      // Update streak after task creation
      await mitDailyRepo.updateStreak();

      res.status(201).json(result);
    } catch (error) {
      console.error('Set today task error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async toggleComplete(req, res) {
    try {
      const { id } = req.params;
      const { completed } = req.body;

      if (completed === undefined) {
        return res.status(400).json({ 
          error: 'Completed status is required' 
        });
      }

      const task = await mitDailyRepo.findById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Check if task is for today
      const today = new Date().toISOString().split('T')[0];
      if (task.date !== today) {
        return res.status(400).json({ 
          error: 'Can only update completion for today\'s task' 
        });
      }

      const updatedTask = await mitDailyRepo.update(id, {
        completed: completed ? 1 : 0
      });

      // Update streak after completion change
      await mitDailyRepo.updateStreak();

      res.json(updatedTask);
    } catch (error) {
      console.error('Toggle complete error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getHistory(req, res) {
    try {
      const { limit = 30 } = req.query; // Default to last 30 days
      const history = await mitDailyRepo.getHistory(parseInt(limit));
      
      // Get streak info
      const streak = await mitDailyRepo.getStreak();
      
      res.json({
        history,
        streak
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getStreakStats(req, res) {
    try {
      const stats = await mitDailyRepo.getDetailedStreakStats();
      res.json(stats);
    } catch (error) {
      console.error('Get streak stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const deleted = await mitDailyRepo.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Update streak after deletion
      await mitDailyRepo.updateStreak();

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getWeeklyStats(req, res) {
    try {
      const stats = await mitDailyRepo.getWeeklyCompletion();
      res.json(stats);
    } catch (error) {
      console.error('Get weekly stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMonthlyStats(req, res) {
    try {
      const stats = await mitDailyRepo.getMonthlyStats();
      res.json(stats);
    } catch (error) {
      console.error('Get monthly stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MITDailyController();