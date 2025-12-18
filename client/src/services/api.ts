// client/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface CreateEntryDto {
  text: string;
  date: string;
}

interface CreateReminderDto {
  text: string;
  date: string;
  time?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

  // Journal Entries
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

  // Reminders
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

  // AI Analysis
  async analyzeText(text: string) {
    return this.request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Weather
  async getWeather(city?: string) {
    const query = city ? `?city=${city}` : '';
    return this.request(`/weather${query}`);
  }

  // Calendar
  async getCalendarEvents() {
    return this.request('/calendar');
  }

  // News
  
  async getNews(country?: string, category?: string, pageSize?: number) {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (category) params.append('category', category);
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<NewsArticle[]>(`/news${query}`);
  }

  // Quotes
  async getRandomQuote() {
    return this.request('/quotes');
  }

  async getDailyQuote() {
    return this.request('/quotes/daily');
  }
}

export const api = new ApiService();