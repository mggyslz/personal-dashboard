import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bell, Plus, X } from 'lucide-react';
import { eventEmitter } from '../utils/eventEmitter';

interface Reminder {
  id: number;
  text: string;
  date: string;
  time: string;
  completed: number;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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
        time: newTime,
      });
      setNewReminder('');
      setNewDate('');
      setNewTime('09:00');
      setShowForm(false);
      loadReminders();
      
      // Emit event to notify calendar
      eventEmitter.emit('reminderAdded');
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.toggleReminder(id);
      loadReminders();
      // Emit event to notify calendar
      eventEmitter.emit('reminderAdded');
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteReminder(id);
      loadReminders();
      // Emit event to notify calendar
      eventEmitter.emit('reminderAdded');
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bell className="text-gray-400" size={20} strokeWidth={1.5} />
          <h2 className="text-lg font-light text-gray-700">Reminders</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {showForm ? <X size={18} strokeWidth={1.5} className="text-gray-600" /> : <Plus size={18} strokeWidth={1.5} className="text-gray-600" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 space-y-3">
          <input
            type="text"
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            placeholder="What do you need to remember?"
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent font-light"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent font-light"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-32 px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent font-light"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-3 rounded-xl hover:bg-gray-900 transition-colors font-light"
          >
            Add Reminder
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {reminders.length === 0 ? (
          <p className="text-gray-400 font-light text-center py-8">No reminders yet</p>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/80 transition-colors group"
            >
              <input
                type="checkbox"
                checked={reminder.completed === 1}
                onChange={() => handleToggle(reminder.id)}
                className="w-5 h-5 rounded-lg accent-gray-800 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-light ${reminder.completed === 1
                      ? 'line-through text-gray-400'
                      : 'text-gray-800'
                    }`}
                >
                  {reminder.text}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-light">
                  {new Date(reminder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {reminder.time}
                </p>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 rounded-lg transition-all"
              >
                <X size={16} strokeWidth={1.5} className="text-gray-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}