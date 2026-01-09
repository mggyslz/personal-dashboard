const db = require('../sqlite');

class DeepWorkRepository {
  async create(session) {
    console.log('Creating session:', session);
    
    const { task, duration, time_left, is_active, is_task_locked, session_output = '', completed = false } = session;
    const sql = `
      INSERT INTO deep_work_sessions 
      (task, duration, time_left, is_active, is_task_locked, session_output, completed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const result = await db.run(sql, [
      task,
      duration || 3600,
      time_left || 3600,
      is_active ? 1 : 0,
      is_task_locked ? 1 : 0,
      session_output,
      completed ? 1 : 0
    ]);
    
    console.log('Insert result:', result);
    return this.findById(result.lastID);
  }

  async findById(id) {
    console.log('Finding session by ID:', id);
    const sql = 'SELECT * FROM deep_work_sessions WHERE id = ?';
    const session = await db.get(sql, [id]);
    console.log('Found session:', session);
    return this.normalizeSession(session);
  }

  async findAll() {
    const sql = 'SELECT * FROM deep_work_sessions ORDER BY created_at DESC';
    const sessions = await db.all(sql);
    return sessions.map(session => this.normalizeSession(session));
  }

  async findActiveSession() {
    const sql = 'SELECT * FROM deep_work_sessions WHERE is_active = 1 AND completed = 0 LIMIT 1';
    const session = await db.get(sql);
    return this.normalizeSession(session);
  }

  async update(id, updates) {
    console.log('Updating session', id, 'with:', updates);
    
    // Convert boolean values to integers for SQLite
    const sqliteUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'boolean') {
        sqliteUpdates[key] = value ? 1 : 0;
      } else if (value === undefined || value === null) {
        // Skip undefined/null values
        continue;
      } else {
        sqliteUpdates[key] = value;
      }
    }

    const fields = Object.keys(sqliteUpdates);
    const values = Object.values(sqliteUpdates);

    if (fields.length === 0) {
      return this.findById(id);
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `
      UPDATE deep_work_sessions 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await db.run(sql, [...values, id]);
    return this.findById(id);
  }

  async delete(id) {
    const sql = 'DELETE FROM deep_work_sessions WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }

  async getCompletedSessions() {
    const sql = 'SELECT * FROM deep_work_sessions WHERE completed = 1 ORDER BY updated_at DESC';
    const sessions = await db.all(sql);
    return sessions.map(session => this.normalizeSession(session));
  }

  async createStat(stat) {
    const { date, total_sprints, total_minutes, total_outputs } = stat;
    console.log('createStat called with:', stat);
    
    const sql = `
      INSERT OR REPLACE INTO deep_work_stats (date, total_sprints, total_minutes, total_outputs)
      VALUES (?, ?, ?, ?)
    `;
    
    try {
      const result = await db.run(sql, [
        date, 
        total_sprints || 0, 
        total_minutes || 0, 
        total_outputs || 0
      ]);
      console.log('createStat result:', result);
      
      const createdStat = await this.getDailyStats(date);
      console.log('Created stat record:', createdStat);
      return createdStat;
    } catch (error) {
      console.error('Error in createStat:', error);
      throw error;
    }
  }

  async updateStat(date, updates) {
    console.log('updateStat called with:', { date, updates });
    
    const { total_sprints = 0, total_minutes = 0, total_outputs = 0 } = updates;
    
    // First, check if record exists
    const existing = await this.getDailyStats(date);
    console.log('Existing stat in updateStat:', existing);
    
    if (existing) {
      console.log('Incrementing existing stat...');
      const newSprints = (existing.total_sprints || 0) + total_sprints;
      const newMinutes = (existing.total_minutes || 0) + total_minutes;
      const newOutputs = (existing.total_outputs || 0) + total_outputs;
      
      console.log('New values:', {
        newSprints,
        newMinutes,
        newOutputs
      });
      
      const sql = `
        UPDATE deep_work_stats 
        SET 
          total_sprints = ?,
          total_minutes = ?,
          total_outputs = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE date = ?
      `;
      
      const result = await db.run(sql, [
        newSprints,
        newMinutes,
        newOutputs,
        date
      ]);
      console.log('Update stat result:', result);
    } else {
      console.log('No existing stat, creating new one...');
      await this.createStat({
        date,
        total_sprints,
        total_minutes,
        total_outputs
      });
    }
    
    return this.getDailyStats(date);
  }

  async getDailyStats(date) {
    const sql = 'SELECT * FROM deep_work_stats WHERE date = ?';
    const stat = await db.get(sql, [date]);
    if (stat) {
      return {
        ...stat,
        total_sprints: Number(stat.total_sprints || 0),
        total_minutes: Number(stat.total_minutes || 0),
        total_outputs: Number(stat.total_outputs || 0)
      };
    }
    return null;
  }

  async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total_sprints,
        COALESCE(SUM(duration) / 60, 0) as total_minutes,
        COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as total_outputs
      FROM deep_work_sessions
      WHERE completed = 1
    `;
    const result = await db.get(sql);
    return {
      total_sprints: result?.total_sprints || 0,
      total_minutes: result?.total_minutes || 0,
      total_outputs: result?.total_outputs || 0
    };
  }

  normalizeSession(session) {
    if (!session) {
      console.log('normalizeSession: session is null/undefined');
      return null;
    }
    
    console.log('normalizeSession: Raw session:', session);
    
    const normalized = {
      ...session,
      id: Number(session.id),
      duration: Number(session.duration),
      time_left: Number(session.time_left),
      is_active: Boolean(session.is_active),
      is_task_locked: Boolean(session.is_task_locked),
      completed: Boolean(session.completed),
      session_output: session.session_output || ''
    };
    
    console.log('normalizeSession: Normalized:', normalized);
    return normalized;
  }
}

module.exports = new DeepWorkRepository();