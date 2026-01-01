import React from 'react';
import { CalendarIcon } from 'lucide-react';
import MiniCalendar from './MiniCalendar';

interface CalendarSectionProps {
  upcomingEvents: number;
}

export default function CalendarSection({ upcomingEvents }: CalendarSectionProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-gray-200/50 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="text-gray-400" size={18} />
        <h3 className="text-lg font-light text-gray-700">Today's Calendar</h3>
      </div>
      
      <div className="text-center mb-4">
        <div className="text-2xl font-light text-gray-900 mb-1">
          {new Date().getDate()}
        </div>
        <div className="text-sm text-gray-600 font-light">
          {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric'
          })}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
      </div>
      
      <MiniCalendar />
      
      <div className="pt-4 border-t border-gray-200/50">
        <h4 className="text-sm font-light text-gray-700 mb-3">Upcoming</h4>
        <div className="space-y-2">
          {upcomingEvents > 0 ? (
            <div className="text-sm text-gray-600 font-light">
              {upcomingEvents} event{upcomingEvents !== 1 ? 's' : ''} today
            </div>
          ) : (
            <div className="text-sm text-gray-400 font-light">No events today</div>
          )}
          <a 
            href="/calendar" 
            className="inline-block text-sm text-blue-600 hover:text-blue-800 font-light"
          >
            View full calendar →
          </a>
        </div>
      </div>
    </div>
  );
}