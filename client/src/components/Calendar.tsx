import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Upcoming Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-500">No upcoming events</p>
      ) : (
        <div className="space-y-3">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="border-l-4 border-gray-600 pl-3 py-1">
              <h3 className="font-semibold text-gray-800">{event.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {formatTime(event.start)} - {formatTime(event.end)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}