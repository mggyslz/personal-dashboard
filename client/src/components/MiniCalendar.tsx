import React from 'react';

export default function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const days = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-6"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate();
    days.push(
      <div
        key={day}
        className={`h-6 flex items-center justify-center rounded-lg text-xs transition-colors ${
          isToday
            ? 'bg-blue-100 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1 mb-4">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
        <div key={i} className="text-center text-xs font-light text-gray-400 py-1">
          {day}
        </div>
      ))}
      {days}
    </div>
  );
}