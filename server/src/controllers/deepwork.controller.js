const deepWorkRepo = require('../db/repositories/deepwork.repo');

class DeepWorkController {
  async createSession(req, res) {
    try {
      const { task, duration, time_left, is_active, is_task_locked } = req.body;

      if (!task || task.trim() === '') {
        return res.status(400).json({ 
          error: 'Task is required' 
        });
      }

      const session = await deepWorkRepo.create({
        task: task.trim(),
        duration: duration || 3600,
        time_left: time_left || (duration || 3600),
        is_active: is_active || false,
        is_task_locked: is_task_locked || false,
        session_output: '',
        completed: false
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
      res.json(session || null);
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
      console.log('completeSession called:', req.params.id, req.body);
      
      const { id } = req.params;
      const { session_output } = req.body;

      if (!session_output || session_output.trim() === '') {
        console.log('Missing session output');
        return res.status(400).json({ 
          error: 'Session output is required for completion' 
        });
      }

      console.log('Getting existing session...');
      const existingSession = await deepWorkRepo.findById(id);
      console.log('Existing session:', existingSession);
      
      if (!existingSession) {
        console.log('Session not found');
        return res.status(404).json({ error: 'Session not found' });
      }

      console.log('Updating session to complete...');
      const session = await deepWorkRepo.update(id, {
        session_output: session_output.trim(),
        completed: true,
        is_active: false,
        time_left: 0,
        is_task_locked: false
      });
      
      console.log('Updated session:', session);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Update statistics - FIXED: Properly increment stats
      await this.updateStats(session);
      
      // Also update the aggregated stats table
      await this.updateAggregatedStats();
      
      console.log('Session completed successfully');
      
      res.json(session);
    } catch (error) {
      console.error('Complete session error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: error.message });
    }
  }

  async updateAggregatedStats() {
    try {
      // Calculate total stats from all completed sessions
      const completedSessions = await deepWorkRepo.getCompletedSessions();
      
      let totalSprints = 0;
      let totalMinutes = 0;
      let totalOutputs = 0;
      
      completedSessions.forEach(session => {
        totalSprints++;
        totalMinutes += Math.floor(session.duration / 60);
        totalOutputs++; // Each completed session has an output
      });
      
      // Update or create the stats record with ID 1 (or a fixed ID for aggregated stats)
      const stats = {
        total_sprints: totalSprints,
        total_minutes: totalMinutes,
        total_outputs: totalOutputs
      };
      
      // Assuming you have a method to update aggregated stats
      await deepWorkRepo.updateAggregatedStats(stats);
      
      console.log('Aggregated stats updated:', stats);
    } catch (error) {
      console.error('Error updating aggregated stats:', error);
      throw error;
    }
  }

  async updateStats(session) {
    try {
      // Use the session's created_at date or today's date
      const sessionDate = new Date(session.created_at || Date.now()).toISOString().split('T')[0];
      console.log('=== updateStats called ===');
      console.log('Date for stats:', sessionDate);
      console.log('Session duration:', session.duration, 'seconds');
      console.log('Session duration in minutes:', Math.floor(session.duration / 60));
      
      // Get existing stats for today
      const existingStat = await deepWorkRepo.getDailyStats(sessionDate);
      console.log('Existing stat in table:', existingStat);
      
      if (existingStat) {
        console.log('Updating existing stat...');
        console.log('Current values:', {
          sprints: existingStat.total_sprints,
          minutes: existingStat.total_minutes,
          outputs: existingStat.total_outputs
        });
        
        const updatedStat = await deepWorkRepo.updateStat(sessionDate, {
          total_sprints: 1, // Increment by 1
          total_minutes: Math.floor(session.duration / 60), // Add minutes
          total_outputs: 1  // Increment outputs by 1
        });
        console.log('Updated stat result:', updatedStat);
      } else {
        console.log('Creating new stat record...');
        const newStat = await deepWorkRepo.createStat({
          date: sessionDate,
          total_sprints: 1,
          total_minutes: Math.floor(session.duration / 60),
          total_outputs: 1
        });
        console.log('Created new stat:', newStat);
      }
      
      // Verify the update
      const verifyStat = await deepWorkRepo.getDailyStats(sessionDate);
      console.log('Verify updated stat:', verifyStat);
    } catch (error) {
      console.error('Error updating stats:', error);
      throw error;
    }
  }

  async getStats(req, res) {
    try {
      const stats = await deepWorkRepo.getStats();
      res.json(stats);
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
      const { id } = req.params;
      const deleted = await deepWorkRepo.delete(id);
      
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

  async initializeStats(req, res) {
    try {
      // This is a debug endpoint to manually fix stats
      const today = new Date().toISOString().split('T')[0];
      console.log('Initializing stats for date:', today);
      
      // Get all completed sessions
      const completedSessions = await deepWorkRepo.getCompletedSessions();
      console.log('Total completed sessions:', completedSessions.length);
      
      let totalSprints = 0;
      let totalMinutes = 0;
      
      completedSessions.forEach(session => {
        const sessionDate = new Date(session.created_at).toISOString().split('T')[0];
        if (sessionDate === today) {
          totalSprints++;
          totalMinutes += Math.floor(session.duration / 60);
        }
      });
      
      console.log('Calculated stats:', {
        totalSprints,
        totalMinutes,
        date: today
      });
      
      const stat = await deepWorkRepo.createStat({
        date: today,
        total_sprints: totalSprints,
        total_minutes: totalMinutes,
        total_outputs: totalSprints
      });
      
      res.json({
        message: 'Stats initialized',
        stats: stat
      });
    } catch (error) {
      console.error('Initialize stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async fixAllStats(req, res) {
    try {
      console.log('Fixing all stats...');
      
      // Get all completed sessions
      const completedSessions = await deepWorkRepo.getCompletedSessions();
      console.log('Total completed sessions found:', completedSessions.length);
      
      let totalSprints = 0;
      let totalMinutes = 0;
      
      completedSessions.forEach(session => {
        totalSprints++;
        totalMinutes += Math.floor(session.duration / 60);
        console.log(`Session ${session.id}: ${Math.floor(session.duration / 60)} minutes`);
      });
      
      // Update aggregated stats
      await deepWorkRepo.updateAggregatedStats({
        total_sprints: totalSprints,
        total_minutes: totalMinutes,
        total_outputs: totalSprints
      });
      
      console.log('Fixed stats:', { totalSprints, totalMinutes });
      
      res.json({
        message: 'Stats fixed successfully',
        stats: {
          total_sprints: totalSprints,
          total_minutes: totalMinutes,
          total_outputs: totalSprints
        }
      });
    } catch (error) {
      console.error('Fix stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getDailyStats(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const stats = await deepWorkRepo.getDailyStats(targetDate);
      res.json(stats || {
        date: targetDate,
        total_sprints: 0,
        total_minutes: 0,
        total_outputs: 0
      });
    } catch (error) {
      console.error('Get daily stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DeepWorkController();