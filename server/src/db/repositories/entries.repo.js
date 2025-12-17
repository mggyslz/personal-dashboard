const db = require('../sqlite');

class EntriesRepository {
  async create(entry) {
    const { date, text, mood, themes, insights } = entry;
    const sql = `
      INSERT INTO entries (date, text, mood, themes, insights)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await db.run(sql, [date, text, mood, themes, insights]);
    return this.findById(result.id);
  }

  async findAll() {
    const sql = 'SELECT * FROM entries ORDER BY date DESC';
    return await db.all(sql);
  }

  async findById(id) {
    const sql = 'SELECT * FROM entries WHERE id = ?';
    return await db.get(sql, [id]);
  }

  async findByDateRange(startDate, endDate) {
    const sql = `
      SELECT * FROM entries 
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC
    `;
    return await db.all(sql, [startDate, endDate]);
  }

  async update(id, entry) {
    const { date, text, mood, themes, insights } = entry;
    const sql = `
      UPDATE entries 
      SET date = ?, text = ?, mood = ?, themes = ?, insights = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, [date, text, mood, themes, insights, id]);
    return this.findById(id);
  }

  async delete(id) {
    const sql = 'DELETE FROM entries WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }

  async getMoodStats() {
    const sql = `
      SELECT mood, COUNT(*) as count 
      FROM entries 
      WHERE mood IS NOT NULL
      GROUP BY mood
    `;
    return await db.all(sql);
  }
}

module.exports = new EntriesRepository();