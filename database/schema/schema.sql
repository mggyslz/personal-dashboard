-- =========================
-- Journal entries table
-- =========================
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  mood TEXT,
  themes TEXT,
  insights TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Reminders table
-- =========================
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time TEXT DEFAULT '09:00', -- HH:MM format
  text TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Notes table (quick notes / todos)
-- =========================
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  color TEXT DEFAULT '#3B82F6', -- Default blue
  pinned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Settings table
-- =========================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Deep Work sessions table
-- =========================
CREATE TABLE IF NOT EXISTS deep_work_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  time_left INTEGER NOT NULL, -- in seconds
  is_active INTEGER DEFAULT 0,
  is_task_locked INTEGER DEFAULT 0,
  session_output TEXT,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Deep Work statistics table
-- =========================
CREATE TABLE IF NOT EXISTS deep_work_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  total_sprints INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  total_outputs INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- MIT Daily tasks table
-- =========================
CREATE TABLE IF NOT EXISTS mit_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  task TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- MIT Daily streaks table
-- =========================
CREATE TABLE IF NOT EXISTS mit_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_updated DATE DEFAULT CURRENT_DATE
);

-- =========================
-- Indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);

CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);

CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);

CREATE INDEX IF NOT EXISTS idx_deep_work_sessions_active ON deep_work_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_deep_work_sessions_completed ON deep_work_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_deep_work_stats_date ON deep_work_stats(date);

CREATE INDEX IF NOT EXISTS idx_mit_tasks_date ON mit_tasks(date);
CREATE INDEX IF NOT EXISTS idx_mit_tasks_completed ON mit_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_mit_tasks_completed_date ON mit_tasks(completed, date);