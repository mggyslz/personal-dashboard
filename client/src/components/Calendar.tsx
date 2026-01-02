import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar as CalendarIcon } from 'lucide-react';
import { eventEmitter } from '../utils/eventEmitter';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string;
  type?: string;
  completed?: number;
  reminderId?: number;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadEvents();
    
    const handleReminderAdded = () => {
      loadEvents();
    };
    
    eventEmitter.on('reminderAdded', handleReminderAdded);
    
    return () => {
      eventEmitter.off('reminderAdded', handleReminderAdded);
    };
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getCalendarEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return events.filter(event => {
      const eventDateStr = event.start.split('T')[0];
      return eventDateStr === dateStr;
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const changeMonth = (increment: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const days = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 bg-transparent"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = getEventsForDate(date);
    const isToday = dateStr === todayStr;

    days.push(
      <div
        key={day}
        className={`h-32 rounded-xl p-2 ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50/50 border border-transparent'} hover:bg-gray-100/80 transition-colors overflow-hidden`}
      >
        <div className={`text-sm font-light mb-1 ${isToday ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-20">
          {dayEvents.map(event => (
            <div
              key={event.id}
              className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate hover:bg-blue-200 transition-colors cursor-pointer"
              title={`${event.title} at ${formatTime(event.start)}`}
            >
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-xs text-blue-600 font-light truncate">
                {formatTime(event.start)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-gray-400" size={20} strokeWidth={1.5} />
          <h2 className="text-lg font-light text-gray-700">Calendar</h2>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 font-light"
        >
          ←
        </button>
        <h3 className="font-light text-gray-700">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="px-3 py-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 font-light"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-light text-gray-400 py-2">
            {day}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
}