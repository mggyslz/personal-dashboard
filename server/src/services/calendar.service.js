const remindersRepo = require('../db/repositories/reminders.repo');

class CalendarService {
  /**
   * Get calendar events from reminders
   */
  async getEvents() {
    // Get all reminders and convert them to calendar events
    const reminders = await remindersRepo.findAll();
    const reminderEvents = reminders.map(reminder => this.convertReminderToEvent(reminder));
    
    return reminderEvents;
  }

  convertReminderToEvent(reminder) {
    // Parse date and time
    const [hours, minutes] = (reminder.time || '09:00').split(':');
    
    // IMPORTANT: Use the date string directly to avoid timezone issues
    const dateStr = reminder.date; // e.g., "2024-12-21"
    const eventDate = new Date(`${dateStr}T${reminder.time || '09:00'}:00`);
    
    // End time is 1 hour after start by default
    const endDate = new Date(eventDate);
    endDate.setHours(endDate.getHours() + 1);

    return {
      id: `reminder-${reminder.id}`,
      title: reminder.text,
      start: eventDate.toISOString(),
      end: endDate.toISOString(),
      description: reminder.completed ? 'Completed' : 'Pending',
      type: 'reminder',
      completed: reminder.completed,
      reminderId: reminder.id
    };
  }
}

module.exports = new CalendarService();