const db = require('../sqlite');

class SettingsRepository {
  async get(key) {
    const sql = 'SELECT value FROM settings WHERE key = ?';
    const result = await db.get(sql, [key]);
    return result ? result.value : null;
  }

  async set(key, value) {
    const sql = `
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `;
    await db.run(sql, [key, value]);
    return { key, value };
  }

  async getAll() {
    const sql = 'SELECT * FROM settings';
    return await db.all(sql);
  }

  async delete(key) {
    const sql = 'DELETE FROM settings WHERE key = ?';
    const result = await db.run(sql, [key]);
    return result.changes > 0;
  }
}

module.exports = new SettingsRepository();