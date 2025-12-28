const db = require('../sqlite');

class DeepWorkRepository {
  async create(session) {
    const { task, duration, time_left, is_active, is_task_locked } = session;
    const sql = `
      INSERT INTO deep_work_sessions (task, duration, time_left, is_active, is_task_locked)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await db.run(sql, [
      task,
      duration,
      time_left,
      is_active ? 1 : 0,
      is_task_locked ? 1 : 0
    ]);
    return this.findById(result.id);
  }

  async findById(id) {
    const sql = 'SELECT * FROM deep_work_sessions WHERE id = ?';
    return await db.get(sql, [id]);
  }

  async findActiveSession() {
    const sql = 'SELECT * FROM deep_work_sessions WHERE is_active = 1 LIMIT 1';
    return await db.get(sql);
  }

  async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields.map(field => {
      if (field === 'is_active' || field === 'is_task_locked' || field === 'completed') {
        return `${field} = ?`;
      }
      return `${field} = ?`;
    }).join(', ');
    
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
    const sql = 'SELECT * FROM deep_work_sessions WHERE completed = 1 ORDER BY created_at DESC';
    return await db.all(sql);
  }

  async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_sprints,
        SUM(duration) / 60 as total_minutes,
        COUNT(session_output) as total_outputs
      FROM deep_work_sessions 
      WHERE completed = 1
    `;
    return await db.get(sql);
  }

  async createStat(stat) {
    const { date, total_sprints, total_minutes, total_outputs } = stat;
    const sql = `
      INSERT INTO deep_work_stats (date, total_sprints, total_minutes, total_outputs)
      VALUES (?, ?, ?, ?)
    `;
    return await db.run(sql, [date, total_sprints, total_minutes, total_outputs]);
  }

  async getDailyStats(date) {
    const sql = 'SELECT * FROM deep_work_stats WHERE date = ?';
    return await db.get(sql, [date]);
  }
  
  async findAll() {
    const sql = 'SELECT * FROM deep_work_sessions ORDER BY created_at DESC';
    return await db.all(sql);
  }
}

module.exports = new DeepWorkRepository();