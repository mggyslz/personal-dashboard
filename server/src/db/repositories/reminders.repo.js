const db = require('../sqlite');

class RemindersRepository {
  async create(reminder) {
    const { date, text } = reminder;
    const sql = `
      INSERT INTO reminders (date, text, completed)
      VALUES (?, ?, 0)
    `;
    const result = await db.run(sql, [date, text]);
    return this.findById(result.id);
  }

  async findAll() {
    const sql = 'SELECT * FROM reminders ORDER BY date ASC';
    return await db.all(sql);
  }

  async findById(id) {
    const sql = 'SELECT * FROM reminders WHERE id = ?';
    return await db.get(sql, [id]);
  }

  async findActive() {
    const sql = `
      SELECT * FROM reminders 
      WHERE completed = 0 
      ORDER BY date ASC
    `;
    return await db.all(sql);
  }

  async update(id, reminder) {
    const { date, text, completed } = reminder;
    const sql = `
      UPDATE reminders 
      SET date = ?, text = ?, completed = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, [date, text, completed, id]);
    return this.findById(id);
  }

  async toggleComplete(id) {
    const sql = `
      UPDATE reminders 
      SET completed = NOT completed,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, [id]);
    return this.findById(id);
  }

  async delete(id) {
    const sql = 'DELETE FROM reminders WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }
}

module.exports = new RemindersRepository();