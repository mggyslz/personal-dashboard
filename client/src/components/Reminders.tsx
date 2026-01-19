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
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 rounded w-1/3 bg-gray-200"></div>
            <div className="h-6 rounded w-16 bg-gray-200"></div>
          </div>
          <div className="h-20 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  const completedCount = reminders.filter(r => r.completed === 1).length;
  const totalCount = reminders.length;

  return (
    <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full bg-white">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 border-2 border-black">
            <Bell className="text-black" size={20} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-black">REMINDERS</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 border-2 border-black text-sm font-bold">
            {completedCount}/{totalCount}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-2 border-2 border-black font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            {showForm ? <X size={18} strokeWidth={2} className="text-black" /> : <Plus size={18} strokeWidth={2} className="text-black" />}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 space-y-3">
          <input
            type="text"
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            placeholder="WHAT DO YOU NEED TO REMEMBER?"
            className="w-full px-4 py-3 border-2 border-black font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-black font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-32 px-4 py-3 border-2 border-black font-bold focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 border-2 border-black bg-black text-white font-bold hover:bg-white hover:text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            ADD REMINDER
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {reminders.length === 0 ? (
          <div className="border-2 border-black p-4 text-center">
            <p className="font-black text-black">NO REMINDERS YET</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`flex items-center gap-4 p-4 border-2 ${reminder.completed === 1 ? 'border-gray-400 bg-gray-50' : 'border-black bg-white'} hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group`}
            >
              <button
                onClick={() => handleToggle(reminder.id)}
                className={`w-6 h-6 border-2 ${reminder.completed === 1 ? 'border-black bg-black' : 'border-black'} flex items-center justify-center font-bold hover:scale-110 transition-transform`}
              >
                {reminder.completed === 1 && <span className="text-white text-sm">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-bold ${reminder.completed === 1
                      ? 'line-through text-gray-600'
                      : 'text-black'
                    }`}
                >
                  {reminder.text.toUpperCase()}
                </p>
                <p className="text-xs font-bold text-gray-700 mt-1">
                  {new Date(reminder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} AT {reminder.time}
                </p>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="p-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}