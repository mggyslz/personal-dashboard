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
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Weather />
        <Calendar />
        <News />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Reminders />
        <Quote />
      </div>

      <div className="mb-4">
        <Journal />
      </div>
    </div>
  );
}

export default App;