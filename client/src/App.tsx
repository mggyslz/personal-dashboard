import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Calendar from './components/Calendar';
import News from './components/News';
import Reminders from './components/Reminders';
import Quote from './components/Quotes';  
import Journal from './components/Journal';
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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="p-6 bg-white shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800">{greeting}, Mggy!</h1>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Weather />
            <Calendar />
            <News />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Reminders />
            <Quote />
          </div>

          <div>
            <Journal />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;