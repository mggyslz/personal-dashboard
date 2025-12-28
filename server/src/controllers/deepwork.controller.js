const deepWorkRepo = require('../db/repositories/deepwork.repo');

class DeepWorkController {
  async createSession(req, res) {
    try {
      const { task, duration, time_left, is_active, is_task_locked } = req.body;

      if (!task) {
        return res.status(400).json({ 
          error: 'Task is required' 
        });
      }

      const session = await deepWorkRepo.create({
        task,
        duration: duration || 3600, // default 60 minutes
        time_left: time_left || 3600,
        is_active: is_active || false,
        is_task_locked: is_task_locked || false
      });
      
      res.status(201).json(session);
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getActiveSession(req, res) {
    try {
      const session = await deepWorkRepo.findActiveSession();
      res.json(session || {});
    } catch (error) {
      console.error('Get active session error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateSession(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const session = await deepWorkRepo.update(id, updates);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Update session error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async completeSession(req, res) {
    try {
      const { id } = req.params;
      const { session_output } = req.body;

      if (!session_output) {
        return res.status(400).json({ 
          error: 'Session output is required for completion' 
        });
      }

      const session = await deepWorkRepo.update(id, {
        session_output,
        completed: 1,
        is_active: 0
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const stats = await deepWorkRepo.getStats();
      
      await deepWorkRepo.createStat({
        date: today,
        total_sprints: stats.total_sprints,
        total_minutes: stats.total_minutes,
        total_outputs: stats.total_outputs
      });

      res.json(session);
    } catch (error) {
      console.error('Complete session error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await deepWorkRepo.getStats();
      res.json(stats || { total_sprints: 0, total_minutes: 0, total_outputs: 0 });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCompletedSessions(req, res) {
    try {
      const sessions = await deepWorkRepo.getCompletedSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Get completed sessions error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteSession(req, res) {
    try {
      const deleted = await deepWorkRepo.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllSessions(req, res) {
    try {
      const sessions = await deepWorkRepo.findAll();
      res.json(sessions);
    } catch (error) {
      console.error('Get all sessions error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DeepWorkController();