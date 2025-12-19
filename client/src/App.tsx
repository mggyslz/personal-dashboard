import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Calendar from './components/Calendar';
import News from './components/News';
import Reminders from './components/Reminders';
import Quote from './components/Quotes';  
import Journal from './components/Journal';
import Spotify from './components/Spotify';
import './App.css';

function App() {
  const [greeting, setGreeting] = useState('');

    useEffect(() => {
      const hour = new Date().getHours();

    if (hour < 12) 
      setGreeting("Rise & grind!");
    else if (hour === 12) 
      setGreeting("Midday hustle!");
    else if (hour < 18) 
      setGreeting("Keep pushing!");
    else 
      setGreeting("Evening chill.");
    }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-[1600px] mx-auto">
        <header className="px-8 py-12">
          <h1 className="text-5xl font-light text-gray-800 mb-2">{greeting}, Mggy</h1>
          <p className="text-gray-500 text-lg font-light">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        <main className="px-8 pb-12">
          <div className="space-y-8">
            {/* Top Row - Weather, Calendar, Quote */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Weather />
              <Calendar />
              <Quote />
            </div>

            {/* Middle Row - Reminders and Journal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Reminders />
              <Journal />
            </div>

            {/* Bottom Row - News and Spotify */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <News />
              </div>
              <Spotify />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;