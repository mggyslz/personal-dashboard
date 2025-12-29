const db = require('../sqlite');

class OutputRepository {
  async getEntries(limit = 50) {
    const sql = `
      SELECT 
        e.id,
        e.date,
        e.type,
        e.count,
        e.notes,
        e.created_at,
        e.updated_at,
        t.unit,
        t.color,
        t.target
      FROM output_entries e
      LEFT JOIN output_types t ON e.type = t.name
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT ?
    `;
    const entries = await db.all(sql, [limit]);
    return entries.map(this.mapEntry);
  }

  async createEntry(entry) {
    const { date, type, count, notes } = entry;
    
    // First, get a new UUID
    const id = await this.generateUUID();
    
    const sql = `
      INSERT INTO output_entries (id, date, type, count, notes)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.run(sql, [
      id,
      date,
      type,
      count,
      notes || null
    ]);
    
    // Return the complete entry by ID
    return this.getEntryById(id);
  }

  async generateUUID() {
    // Generate a UUID similar to what SQLite would generate
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async getEntryById(id) {
    const sql = `
      SELECT 
        e.id,
        e.date,
        e.type,
        e.count,
        e.notes,
        e.created_at,
        e.updated_at,
        t.unit,
        t.color,
        t.target
      FROM output_entries e
      LEFT JOIN output_types t ON e.type = t.name
      WHERE e.id = ?
    `;
    const entry = await db.get(sql, [id]);
    return entry ? this.mapEntry(entry) : null;
  }

  async deleteEntry(id) {
    const sql = 'DELETE FROM output_entries WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }

  async getTypes() {
    const sql = 'SELECT * FROM output_types ORDER BY name';
    const types = await db.all(sql);
    return types.map(this.mapType);
  }

  async createType(type) {
    const { name, unit, target, color } = type;
    const id = `type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sql = `
      INSERT INTO output_types (id, name, unit, target, color)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.run(sql, [
      id,
      name,
      unit,
      target,
      color
    ]);
    return this.getTypeById(id);
  }

  async getTypeById(id) {
    const sql = 'SELECT * FROM output_types WHERE id = ?';
    const type = await db.get(sql, [id]);
    return type ? this.mapType(type) : null;
  }

  async getTypeByName(name) {
    const sql = 'SELECT * FROM output_types WHERE name = ?';
    const type = await db.get(sql, [name]);
    return type ? this.mapType(type) : null;
  }

  async updateType(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `
      UPDATE output_types 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.run(sql, [...values, id]);
    return this.getTypeById(id);
  }

  async deleteType(id) {
    const sql = 'DELETE FROM output_types WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }

  async getEntriesByDate(date) {
    const sql = `
      SELECT 
        e.id,
        e.date,
        e.type,
        e.count,
        e.notes,
        e.created_at,
        e.updated_at,
        t.unit,
        t.color,
        t.target
      FROM output_entries e
      LEFT JOIN output_types t ON e.type = t.name
      WHERE e.date = ?
      ORDER BY e.created_at DESC
    `;
    const entries = await db.all(sql, [date]);
    return entries.map(this.mapEntry);
  }

  async getTypeStats(date, typeName) {
    const sql = `
      SELECT 
        COALESCE(SUM(count), 0) as total,
        COUNT(*) as entries
      FROM output_entries 
      WHERE date = ? AND type = ?
    `;
    const stats = await db.get(sql, [date, typeName]);
    
    const type = await this.getTypeByName(typeName);
    const target = type ? type.target : 0;
    
    return {
      todayTotal: stats.total,
      entriesCount: stats.entries,
      target,
      percentage: target > 0 ? Math.min((stats.total / target) * 100, 100) : 0
    };
  }

  async updateDailyStats(date) {
    // Calculate total output for the day
    const entries = await this.getEntriesByDate(date);
    const totalOutput = entries.reduce((sum, entry) => sum + entry.count, 0);
    
    // Check if all types met their targets
    const types = await this.getTypes();
    let allTargetsMet = true;
    
    for (const type of types) {
      const typeEntries = entries.filter(e => e.type === type.name);
      const typeTotal = typeEntries.reduce((sum, entry) => sum + entry.count, 0);
      
      if (typeTotal < type.target) {
        allTargetsMet = false;
        break;
      }
    }
    
    // Update or create daily stats
    const checkSql = 'SELECT * FROM output_daily_stats WHERE date = ?';
    const existing = await db.get(checkSql, [date]);
    
    if (existing) {
      const updateSql = `
        UPDATE output_daily_stats 
        SET total_output = ?, entries_count = ?
        WHERE date = ?
      `;
      await db.run(updateSql, [totalOutput, entries.length, date]);
    } else {
      const insertSql = `
        INSERT INTO output_daily_stats (date, total_output, entries_count)
        VALUES (?, ?, ?)
      `;
      await db.run(insertSql, [date, totalOutput, entries.length]);
    }
    
    // Update streak
    if (allTargetsMet) {
      await this.updateStreak(date);
    } else {
      await this.resetStreak(date);
    }
  }

  async updateStreak(date) {
    // Get streak from previous day
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    const prevStatsSql = 'SELECT streak_days FROM output_daily_stats WHERE date = ?';
    const prevStats = await db.get(prevStatsSql, [prevDateStr]);
    
    const currentStreak = prevStats ? prevStats.streak_days + 1 : 1;
    
    const updateSql = 'UPDATE output_daily_stats SET streak_days = ? WHERE date = ?';
    await db.run(updateSql, [currentStreak, date]);
  }

  async resetStreak(date) {
    const updateSql = 'UPDATE output_daily_stats SET streak_days = 0 WHERE date = ?';
    await db.run(updateSql, [date]);
  }

  async calculateStreak() {
    const sql = `
      SELECT streak_days 
      FROM output_daily_stats 
      WHERE date = DATE('now')
    `;
    const result = await db.get(sql);
    return result ? result.streak_days : 0;
  }

  async getDailyStats(date) {
    const entries = await this.getEntriesByDate(date);
    const totalOutput = entries.reduce((sum, entry) => sum + entry.count, 0);
    
    const streakSql = 'SELECT streak_days FROM output_daily_stats WHERE date = ?';
    const streakResult = await db.get(streakSql, [date]);
    
    const types = await this.getTypes();
    const typeStats = {};
    
    for (const type of types) {
      typeStats[type.name] = await this.getTypeStats(date, type.name);
    }
    
    return {
      date,
      totalOutput,
      streak: streakResult ? streakResult.streak_days : 0,
      entriesCount: entries.length,
      typeStats
    };
  }

  mapEntry(dbEntry) {
    return {
      id: dbEntry.id,
      date: dbEntry.date,
      type: dbEntry.type,
      count: dbEntry.count,
      notes: dbEntry.notes,
      unit: dbEntry.unit,
      color: dbEntry.color,
      target: dbEntry.target,
      created_at: dbEntry.created_at,
      updated_at: dbEntry.updated_at
    };
  }

  mapType(dbType) {
    return {
      id: dbType.id,
      name: dbType.name,
      unit: dbType.unit,
      target: dbType.target,
      color: dbType.color,
      created_at: dbType.created_at,
      updated_at: dbType.updated_at
    };
  }
}

module.exports = new OutputRepository();