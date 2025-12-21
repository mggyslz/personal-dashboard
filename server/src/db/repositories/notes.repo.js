const db = require('../sqlite');

class NotesRepository {
  async create(note) {
    const { title, content, category, color, pinned } = note;
    const sql = `
      INSERT INTO notes (title, content, category, color, pinned)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await db.run(sql, [
      title,
      content || '',
      category || 'general',
      color || '#3B82F6',
      pinned ? 1 : 0
    ]);
    return this.findById(result.id);
  }

  async findAll() {
    const sql = 'SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC';
    return await db.all(sql);
  }

  async findById(id) {
    const sql = 'SELECT * FROM notes WHERE id = ?';
    return await db.get(sql, [id]);
  }

  async findByCategory(category) {
    const sql = 'SELECT * FROM notes WHERE category = ? ORDER BY pinned DESC, updated_at DESC';
    return await db.all(sql, [category]);
  }

  async update(id, note) {
    const { title, content, category, color, pinned } = note;
    const sql = `
      UPDATE notes 
      SET title = ?, content = ?, category = ?, color = ?, pinned = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, [
      title,
      content,
      category,
      color,
      pinned ? 1 : 0,
      id
    ]);
    return this.findById(id);
  }

  async togglePin(id) {
    const sql = `
      UPDATE notes 
      SET pinned = NOT pinned,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, [id]);
    return this.findById(id);
  }

  async delete(id) {
    const sql = 'DELETE FROM notes WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }

  async getCategories() {
    const sql = 'SELECT DISTINCT category FROM notes ORDER BY category';
    const categories = await db.all(sql);
    return categories.map(c => c.category);
  }
}

module.exports = new NotesRepository();