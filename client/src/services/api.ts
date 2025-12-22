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