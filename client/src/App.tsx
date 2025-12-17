import { useState, useEffect } from 'react';
import Weather from './components/Weather.tsx';
import Calendar from './components/Calendar.tsx';
import News from './components/News.tsx';
import Reminders from './components/Reminders.tsx';
import Quote from './components/Quotes.tsx';
import Journal from './components/Journal.tsx';
import './App.css';

function App() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="p-4 bg-white shadow">
        <h1 className="text-4xl font-bold text-gray-800">{greeting}, Miggy!</h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 overflow-auto space-y-4">
        {/* Top row: Weather, Calendar, News */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Weather />
          <Calendar />
          <News />
        </div>

        {/* Middle row: Reminders and Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Reminders />
          <Quote />
        </div>

        {/* Bottom row: Journal */}
        <div>
          <Journal />
        </div>
      </main>
    </div>
  );
}

export default App;
