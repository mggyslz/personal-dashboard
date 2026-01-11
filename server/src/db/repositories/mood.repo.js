const db = require('../sqlite');

class MoodRepository {
  async create(moodEntry) {
    const { entry_date, mood, time = null, intensity, factors, note, journal_entry_id = null } = moodEntry;
    const sql = `
      INSERT INTO mood_tracking 
      (entry_date, mood, time, intensity, factors, note, journal_entry_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    const result = await db.run(sql, [entry_date, mood, time, intensity, factors, note, journal_entry_id]);
    return this.findById(result.id);
  }

  async findById(id) {
    const sql = 'SELECT * FROM mood_tracking WHERE id = ?';
    return await db.get(sql, [id]);
  }

  async findByEntryDate(entry_date) {
    const sql = 'SELECT * FROM mood_tracking WHERE entry_date = ? ORDER BY time DESC';
    return await db.all(sql, [entry_date]);
  }

  async findByJournalEntryId(journal_entry_id) {
    const sql = 'SELECT * FROM mood_tracking WHERE journal_entry_id = ?';
    return await db.get(sql, [journal_entry_id]);
  }

  async findByDateRange(startDate, endDate) {
    const sql = `
      SELECT * FROM mood_tracking 
      WHERE entry_date BETWEEN ? AND ?
      ORDER BY entry_date DESC, time DESC
    `;
    return await db.all(sql, [startDate, endDate]);
  }

  async getRecent(limit = 30) {
    const sql = `
      SELECT * FROM mood_tracking 
      ORDER BY entry_date DESC, time DESC 
      LIMIT ?
    `;
    return await db.all(sql, [limit]);
  }

  async getMoodStats(timeframe = '30d') {
    let dateFilter = '';
    const params = [];
    
    if (timeframe === '7d') {
      dateFilter = 'WHERE entry_date >= date("now", "-7 days")';
    } else if (timeframe === '30d') {
      dateFilter = 'WHERE entry_date >= date("now", "-30 days")';
    } else if (timeframe === '90d') {
      dateFilter = 'WHERE entry_date >= date("now", "-90 days")';
    }
    
    const sql = `
      SELECT 
        mood,
        COUNT(*) as count,
        ROUND(AVG(intensity), 1) as avg_intensity
      FROM mood_tracking
      ${dateFilter}
      GROUP BY mood
      ORDER BY count DESC
    `;
    
    return await db.all(sql, params);
  }

  async getWeeklyAverages() {
    const sql = `
      SELECT 
        strftime('%Y-%W', entry_date) as week,
        mood,
        COUNT(*) as count,
        ROUND(AVG(intensity), 1) as avg_intensity
      FROM mood_tracking
      WHERE entry_date >= date("now", "-90 days")
      GROUP BY week, mood
      ORDER BY week DESC
    `;
    return await db.all(sql);
  }

  async getDailyMoods(days = 14) {
    const sql = `
      SELECT 
        entry_date,
        time,
        mood,
        intensity,
        factors,
        note,
        journal_entry_id
      FROM mood_tracking
      WHERE entry_date >= date("now", "-${days} days")
      ORDER BY entry_date DESC, time DESC
    `;
    return await db.all(sql);
  }

  async deleteByEntryDate(entry_date) {
    const sql = 'DELETE FROM mood_tracking WHERE entry_date = ?';
    const result = await db.run(sql, [entry_date]);
    return result.changes > 0;
  }

  async deleteByJournalEntryId(journal_entry_id) {
    const sql = 'DELETE FROM mood_tracking WHERE journal_entry_id = ?';
    const result = await db.run(sql, [journal_entry_id]);
    return result.changes > 0;
  }
}

module.exports = new MoodRepository();