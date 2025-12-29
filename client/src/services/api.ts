const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* =========================
   DTOs
========================= */

// Journal
interface CreateEntryDto {
  text: string;
  date: string;
}

// Reminders
interface CreateReminderDto {
  text: string;
  date: string;
  time?: string;
}

// Notes
interface CreateNoteDto {
  title: string;
  content?: string;
  category?: string;
  color?: string;
  pinned?: boolean;
}

interface UpdateNoteDto {
  title?: string;
  content?: string;
  category?: string;
  color?: string;
  pinned?: boolean;
}

// AI Summary
interface SummaryRequestDto {
  text: string;
  maxLength?: number;
}

interface SummaryResponseDto {
  summary: string;
  originalLength: number;
  summaryLength: number;
  readTimeSaved: number; // in minutes
}

interface CreateDeepWorkSessionDto {
  task: string;
  duration?: number;
  time_left?: number;
  is_active?: boolean;
  is_task_locked?: boolean;
}

interface UpdateDeepWorkSessionDto {
  task?: string;
  duration?: number;
  time_left?: number;
  is_active?: boolean;
  is_task_locked?: boolean;
  session_output?: string;
  completed?: boolean;
}

interface CompleteSessionDto {
  session_output: string;
}

interface MITDailyTaskDto {
  date: string;
  task: string;
  completed: boolean;
  exists?: boolean;
}

interface MITDailyStreakDto {
  current_streak: number;
  longest_streak: number;
  streak_percentage: number;
  last_30_days: Array<{
    date: string;
    completed: boolean | null;
    has_task: boolean;
  }>;
  weekly_stats: Array<{
    week_number: string;
    total_days: number;
    completed_days: number;
    completion_rate: number;
  }>;
  monthly_stats: Array<{
    month: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
  }>;
}

interface SetMITTaskDto {
  task: string;
}

interface ToggleCompleteDto {
  completed: boolean;
}

interface OutputEntryDto {
  id: string;
  date: string;
  type: string;
  count: number;
  notes?: string;
  unit?: string;
  color?: string;
  target?: number;
  created_at: string;
  updated_at: string;
}

interface OutputTypeDto {
  id: string;
  name: string;
  unit: string;
  target: number;
  color: string;
  created_at: string;
  updated_at: string;
}

interface OutputStatsDto {
  date: string;
  totalOutput: number;
  streak: number;
  entriesCount: number;
  typeStats: {
    [key: string]: {
      todayTotal: number;
      entriesCount: number;
      target: number;
      percentage: number;
    };
  };
}

interface CreateOutputEntryDto {
  date: string;
  type: string;
  count: number;
  notes?: string;
}

interface CreateOutputTypeDto {
  name: string;
  unit: string;
  target: number;
  color?: string;
}

interface UpdateOutputTypeDto {
  name?: string;
  unit?: string;
  target?: number;
  color?: string;
}

/* =========================
   API Service
========================= */

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /* =========================
     Journal Entries
  ========================= */

  async getEntries() {
    return this.request('/entries');
  }

  async getEntry(id: number) {
    return this.request(`/entries/${id}`);
  }

  async createEntry(data: CreateEntryDto) {
    return this.request('/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntry(id: number, data: CreateEntryDto) {
    return this.request(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntry(id: number) {
    return this.request(`/entries/${id}`, {
      method: 'DELETE',
    });
  }

  async getMoodStats() {
    return this.request('/entries/stats/mood');
  }

  /* =========================
     Reminders
  ========================= */

  async getReminders() {
    return this.request('/reminders');
  }

  async getActiveReminders() {
    return this.request('/reminders/active');
  }

  async createReminder(data: CreateReminderDto) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReminder(id: number, data: any) {
    return this.request(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleReminder(id: number) {
    return this.request(`/reminders/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteReminder(id: number) {
    return this.request(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  /* =========================
    Deep Work Sessions
  ========================= */

  async createDeepWorkSession(data: CreateDeepWorkSessionDto) {
    return this.request('/deepwork/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActiveSession() {
    return this.request('/deepwork/sessions/active');
  }

  async updateDeepWorkSession(id: number, data: UpdateDeepWorkSessionDto) {
    return this.request(`/deepwork/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeSession(id: number, data: CompleteSessionDto) {
    return this.request(`/deepwork/sessions/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getDeepWorkStats() {
    return this.request('/deepwork/stats');
  }

  async getCompletedSessions() {
    return this.request('/deepwork/sessions/completed');
  }

  async deleteDeepWorkSession(id: number) {
    return this.request(`/deepwork/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async getDeepWorkSessions() {
    return this.request('/deepwork/sessions');
  }

/* =========================
   MIT Daily
========================= */

async getTodayMITTask() {
  return this.request<MITDailyTaskDto>('/mit/today');
}

async setTodayMITTask(data: SetMITTaskDto) {
  return this.request<MITDailyTaskDto>('/mit/today', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async toggleMITComplete(id: number, data: ToggleCompleteDto) {
  return this.request<MITDailyTaskDto>(`/mit/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async getMITHistory(limit: number = 30) {
  const query = `?limit=${limit}`;
  return this.request<{
    history: MITDailyTaskDto[];
    streak: { current_streak: number; longest_streak: number };
  }>(`/mit/history${query}`);
}

async getMITStreakStats() {
  return this.request<MITDailyStreakDto>('/mit/streak');
}

async getMITWeeklyStats() {
  return this.request('/mit/weekly');
}

async getMITMonthlyStats() {
  return this.request('/mit/monthly');
}

async deleteMITTask(id: number) {
  return this.request(`/mit/${id}`, {
    method: 'DELETE',
  });
}
/* =========================
   Output Tracker
========================= */

async getOutputEntries(limit: number = 50) {
  const query = `?limit=${limit}`;
  return this.request<OutputEntryDto[]>(`/output/entries${query}`);
}

async getOutputEntry(id: string) {
  return this.request<OutputEntryDto>(`/output/entries/${id}`);
}

async createOutputEntry(data: CreateOutputEntryDto) {
  return this.request<OutputEntryDto>('/output/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async deleteOutputEntry(id: string) {
  return this.request(`/output/entries/${id}`, {
    method: 'DELETE',
  });
}

async getOutputTypes() {
  return this.request<OutputTypeDto[]>('/output/types');
}

async createOutputType(data: CreateOutputTypeDto) {
  return this.request<OutputTypeDto>('/output/types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async updateOutputType(id: string, data: UpdateOutputTypeDto) {
  return this.request<OutputTypeDto>(`/output/types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async deleteOutputType(id: string) {
  return this.request(`/output/types/${id}`, {
    method: 'DELETE',
  });
}

async getOutputStats(date?: string) {
  const query = date ? `?date=${date}` : '';
  return this.request<OutputStatsDto>(`/output/stats${query}`);
}

async getOutputStreak() {
  return this.request<number>('/output/streak');
}

  /* =========================
     Notes
  ========================= */

  async getNotes() {
    return this.request('/notes');
  }

  async getNote(id: number) {
    return this.request(`/notes/${id}`);
  }

  async createNote(data: CreateNoteDto) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: number, data: UpdateNoteDto) {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: number) {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async togglePinNote(id: number) {
    return this.request(`/notes/${id}/toggle-pin`, {
      method: 'PATCH',
    });
  }

  async getNotesByCategory(category: string) {
    return this.request(`/notes/category/${category}`);
  }

  async getCategories() {
    return this.request('/notes/categories');
  }

  /* =========================
     AI Analysis
  ========================= */

  async analyzeText(text: string) {
    return this.request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async summarizeNote(text: string, maxLength: number = 150) {
    return this.request<SummaryResponseDto>('/notes/summarize', {
      method: 'POST',
      body: JSON.stringify({ text, maxLength }),
    });
  }

  /* =========================
     Weather
  ========================= */

  async getWeather(city?: string) {
    const query = city ? `?city=${city}` : '';
    return this.request(`/weather${query}`);
  }

  /* =========================
     Calendar
  ========================= */

  async getCalendarEvents() {
    return this.request('/calendar');
  }

  /* =========================
     News
  ========================= */

  async getNews(
    country?: string,
    category?: string,
    pageSize?: number
  ) {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (category) params.append('category', category);
    if (pageSize) params.append('pageSize', pageSize.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/news${query}`);
  }

  /* =========================
     Quotes
  ========================= */

  async getRandomQuote() {
    return this.request('/quotes');
  }

  async getDailyQuote() {
    return this.request('/quotes/daily');
  }
}

export const api = new ApiService();