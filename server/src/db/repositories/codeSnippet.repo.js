const db = require('../sqlite');

class CodeSnippetRepository {
  async create(snippet) {
    const { title, code, language, description } = snippet;
    const sql = `
      INSERT INTO code_snippets (title, code, language, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    const result = await db.run(sql, [
      title,
      code,
      language || 'javascript',
      description || ''
    ]);
    return this.findById(result.id);
  }

  async findAll() {
    const sql = 'SELECT * FROM code_snippets ORDER BY updated_at DESC';
    return await db.all(sql);
  }

  async findById(id) {
    const sql = 'SELECT * FROM code_snippets WHERE id = ?';
    return await db.get(sql, [id]);
  }

  async update(id, snippet) {
    const { title, code, language, description } = snippet;
    const sql = `
      UPDATE code_snippets 
      SET title = ?, code = ?, language = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, [
      title,
      code,
      language,
      description,
      id
    ]);
    return this.findById(id);
  }

  async delete(id) {
    const sql = 'DELETE FROM code_snippets WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }

  async getLanguages() {
    const sql = 'SELECT DISTINCT language FROM code_snippets ORDER BY language';
    const languages = await db.all(sql);
    return languages.map(l => l.language);
  }
}

module.exports = new CodeSnippetRepository();