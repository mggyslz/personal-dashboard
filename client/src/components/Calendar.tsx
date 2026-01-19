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
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 rounded w-1/3 bg-gray-200"></div>
            <div className="h-6 rounded w-16 bg-gray-200"></div>
          </div>
          <div className="h-32 rounded bg-gray-200"></div>
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
        className={`h-32 border-2 border-black p-2 ${isToday ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors overflow-hidden`}
      >
        <div className={`text-sm font-black mb-1 ${isToday ? 'text-black underline' : 'text-gray-700'}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-20">
          {dayEvents.map(event => (
            <div
              key={event.id}
              className="text-xs p-1 border border-black bg-white text-black truncate hover:bg-gray-100 transition-colors cursor-pointer"
              title={`${event.title} at ${formatTime(event.start)}`}
            >
              <div className="font-black truncate">{event.title}</div>
              <div className="text-xs text-gray-700 font-bold truncate">
                {formatTime(event.start)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 h-full bg-white">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 border-2 border-black">
            <CalendarIcon className="text-black" size={20} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-black text-black">CALENDAR</h2>
        </div>
        <div className="px-3 py-1 border-2 border-black text-sm font-bold">
          {currentDate.getFullYear()}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1 border-2 border-black font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          ←
        </button>
        <h3 className="font-black text-black text-lg border-2 border-black px-4 py-1 bg-white">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
        </h3>
        <button
          onClick={() => changeMonth(1)}
          className="px-3 py-1 border-2 border-black font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
          <div key={i} className="text-center text-xs font-black text-black py-2 border-b-2 border-black">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
    </div>
  );
}