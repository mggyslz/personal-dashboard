const db = require('../sqlite');

class MITDailyRepository {
  async create(task) {
    const { date, task: taskText, completed } = task;
    const sql = `
      INSERT INTO mit_tasks (date, task, completed)
      VALUES (?, ?, ?)
    `;
    const result = await db.run(sql, [
      date,
      taskText,
      completed ? 1 : 0
    ]);
    return this.findById(result.id);
  }

  async findById(id) {
    const sql = 'SELECT * FROM mit_tasks WHERE id = ?';
    const task = await db.get(sql, [id]);
    return task ? this.mapTask(task) : null;
  }

  async findByDate(date) {
    const sql = 'SELECT * FROM mit_tasks WHERE date = ?';
    const task = await db.get(sql, [date]);
    return task ? this.mapTask(task) : null;
  }

  async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `
      UPDATE mit_tasks 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await db.run(sql, [...values, id]);
    return this.findById(id);
  }

  async delete(id) {
    const sql = 'DELETE FROM mit_tasks WHERE id = ?';
    const result = await db.run(sql, [id]);
    return result.changes > 0;
  }

  async getHistory(limit = 30) {
    const sql = `
      SELECT * FROM mit_tasks 
      ORDER BY date DESC 
      LIMIT ?
    `;
    const tasks = await db.all(sql, [limit]);
    return tasks.map(task => this.mapTask(task));
  }

  async updateStreak() {
    // Calculate current streak
    const sql = `
      WITH RECURSIVE dates(date, completed) AS (
        SELECT date, completed 
        FROM mit_tasks 
        WHERE date <= DATE('now')
        ORDER BY date DESC
      ),
      streak_calc AS (
        SELECT 
          date,
          completed,
          CASE 
            WHEN completed = 1 THEN 1
            ELSE 0
          END as streak_day,
          ROW_NUMBER() OVER (ORDER BY date DESC) as rn
        FROM dates
        ORDER BY date DESC
      ),
      streak_groups AS (
        SELECT 
          *,
          rn - ROW_NUMBER() OVER (PARTITION BY streak_day ORDER BY date DESC) as grp
        FROM streak_calc
        WHERE streak_day = 1
      ),
      current_streak AS (
        SELECT COUNT(*) as streak_length
        FROM streak_groups
        WHERE grp = 0
      ),
      all_streaks AS (
        SELECT grp, COUNT(*) as streak_length
        FROM streak_groups
        GROUP BY grp
      ),
      longest_streak AS (
        SELECT MAX(streak_length) as longest_streak
        FROM all_streaks
      )
      SELECT 
        (SELECT streak_length FROM current_streak) as current_streak,
        (SELECT longest_streak FROM longest_streak) as longest_streak
    `;

    const result = await db.get(sql);
    
    // Update streaks table
    const updateSql = `
      INSERT OR REPLACE INTO mit_streaks (id, current_streak, longest_streak, last_updated)
      VALUES (
        1,
        COALESCE(?, 0),
        COALESCE(?, (SELECT longest_streak FROM mit_streaks WHERE id = 1)),
        DATE('now')
      )
    `;
    
    await db.run(updateSql, [
      result?.current_streak || 0,
      result?.longest_streak || 0
    ]);
  }

  async getStreak() {
    const sql = 'SELECT * FROM mit_streaks WHERE id = 1';
    let streak = await db.get(sql);
    
    if (!streak) {
      // Initialize streak record
      const initSql = `
        INSERT INTO mit_streaks (id, current_streak, longest_streak, last_updated)
        VALUES (1, 0, 0, DATE('now'))
      `;
      await db.run(initSql);
      streak = { current_streak: 0, longest_streak: 0 };
    }
    
    return streak;
  }

  async getDetailedStreakStats() {
    const streak = await this.getStreak();
    
    // Get last 30 days completion
    const historySql = `
      SELECT date, completed 
      FROM mit_tasks 
      WHERE date >= DATE('now', '-30 days')
      ORDER BY date
    `;
    const last30Days = await db.all(historySql);
    
    // Get weekly stats
    const weeklySql = `
      SELECT 
        strftime('%W', date) as week_number,
        COUNT(*) as total_days,
        SUM(completed) as completed_days,
        ROUND(CAST(SUM(completed) AS FLOAT) / COUNT(*) * 100, 1) as completion_rate
      FROM mit_tasks
      WHERE date >= DATE('now', '-90 days')
      GROUP BY week_number
      ORDER BY week_number DESC
      LIMIT 12
    `;
    const weeklyStats = await db.all(weeklySql);
    
    // Get monthly completion rate
    const monthlySql = `
      SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(*) as total_days,
        SUM(completed) as completed_days,
        ROUND(CAST(SUM(completed) AS FLOAT) / COUNT(*) * 100, 1) as completion_rate
      FROM mit_tasks
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `;
    const monthlyStats = await db.all(monthlySql);
    
    return {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_30_days: this.formatCalendarData(last30Days),
      weekly_stats: weeklyStats,
      monthly_stats: monthlyStats,
      streak_percentage: streak.current_streak > 0 ? 
        Math.min(100, Math.round((streak.current_streak / 30) * 100)) : 0
    };
  }

  async getWeeklyCompletion() {
    const sql = `
      SELECT 
        date,
        completed,
        CASE strftime('%w', date)
          WHEN '0' THEN 'Sunday'
          WHEN '1' THEN 'Monday'
          WHEN '2' THEN 'Tuesday'
          WHEN '3' THEN 'Wednesday'
          WHEN '4' THEN 'Thursday'
          WHEN '5' THEN 'Friday'
          WHEN '6' THEN 'Saturday'
        END as day_name
      FROM mit_tasks
      WHERE date >= DATE('now', '-28 days')
      ORDER BY date
    `;
    return await db.all(sql);
  }

  async getMonthlyStats() {
    const sql = `
      SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(*) as total_tasks,
        SUM(completed) as completed_tasks,
        ROUND(CAST(SUM(completed) AS FLOAT) / COUNT(*) * 100, 1) as completion_rate
      FROM mit_tasks
      GROUP BY month
      ORDER BY month DESC
    `;
    return await db.all(sql);
  }

  mapTask(dbTask) {
    return {
      id: dbTask.id,
      date: dbTask.date,
      task: dbTask.task,
      completed: dbTask.completed === 1,
      created_at: dbTask.created_at,
      updated_at: dbTask.updated_at
    };
  }

  formatCalendarData(tasks) {
    const result = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const task = tasks.find(t => t.date === dateStr);
      result.push({
        date: dateStr,
        completed: task ? task.completed === 1 : null,
        has_task: !!task
      });
    }
    
    return result;
  }
}

module.exports = new MITDailyRepository();