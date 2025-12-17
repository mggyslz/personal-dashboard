import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Reminder {
  id: number;
  text: string;
  date: string;
  completed: number;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await api.getReminders();
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim() || !newDate) return;

    try {
      await api.createReminder({
        text: newReminder,
        date: newDate,
      });
      setNewReminder('');
      setNewDate('');
      loadReminders();
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.toggleReminder(id);
      loadReminders();
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReminder(id);
      loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Reminders</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Reminders</h2>

      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <input
          type="text"
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
          placeholder="Add a reminder..."
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Add Reminder
        </button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {reminders.length === 0 ? (
          <p className="text-gray-500">No reminders yet</p>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="checkbox"
                  checked={reminder.completed === 1}
                  onChange={() => handleToggle(reminder.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p
                    className={`${
                      reminder.completed === 1
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                  >
                    {reminder.text}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(reminder.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="text-red-500 hover:text-red-700 px-2"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}