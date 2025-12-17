import { useState, useEffect } from 'react';
import { api } from '../services/api';

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
  const [view, setView] = useState<'month' | 'list'>('month');

  useEffect(() => {
    loadEvents();
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

  // FIX: Use local date comparison to avoid timezone issues
  const getEventsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return events.filter(event => {
      // Extract just the date part from ISO string
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

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = getEventsForDate(date);
      const isToday = dateStr === todayStr;

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 overflow-hidden ${
            isToday ? 'bg-blue-50' : 'bg-white'
          } hover:bg-gray-50`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${
                  event.type === 'reminder'
                    ? event.completed
                      ? 'bg-gray-200 text-gray-600 line-through'
                      : 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
                title={event.title}
              >
                {formatTime(event.start)} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedEvents.length === 0 ? (
          <p className="text-gray-500">No upcoming events</p>
        ) : (
          sortedEvents.map((event) => {
            // FIX: Parse date correctly to avoid timezone shift
            const eventDate = new Date(event.start);
            const localDateStr = eventDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            return (
              <div
                key={event.id}
                className={`border-l-4 pl-3 py-2 ${
                  event.type === 'reminder'
                    ? event.completed
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <h3 className={`font-semibold text-gray-800 ${event.completed ? 'line-through' : ''}`}>
                  {event.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {localDateStr} • {formatTime(event.start)} - {formatTime(event.end)}
                </p>
                {event.description && (
                  <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Calendar</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Calendar</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === 'month' ? 'list' : 'month')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            {view === 'month' ? 'List' : 'Month'}
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="px-3 py-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <h3 className="font-semibold text-gray-800">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              className="px-3 py-1 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2 bg-gray-100">
                {day}
              </div>
            ))}
            {renderMonthView()}
          </div>
        </>
      ) : (
        renderListView()
      )}
    </div>
  );
}