import { useState, useEffect } from 'react';
import Weather from './components/Weather';
import Calendar from './components/Calendar';
import News from './components/News';
import Reminders from './components/Reminders';
import Quote from './components/Quotes';
import Journal from './components/Journal';
import Clock from './components/Clock';
import Sidebar from './components/Sidebar';
import Notes from './components/Notes';
import Pomodoro from './components/Pomodoro';
import './App.css';

function App() {
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      setGreeting('Good Morning');
      setTimeOfDay('morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
      setTimeOfDay('afternoon');
    } else {
      setGreeting('Good Evening');
      setTimeOfDay('evening');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <Sidebar />

      {/* Main Content - Apple-like Layout */}
      <div className="ml-20">
        {/* Dynamic Background */}
        <div className={`absolute inset-0 -z-10 transition-all duration-1000 ease-in-out ${
          timeOfDay === 'morning' 
            ? 'bg-gradient-to-br from-blue-50 via-cyan-50/30 to-white' 
            : timeOfDay === 'afternoon'
            ? 'bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-white'
            : 'bg-gradient-to-br from-indigo-50/30 via-violet-50/20 to-gray-50'
        }`} />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 -z-10 opacity-5 bg-[linear-gradient(90deg,#80808012_1px,transparent_1px),linear-gradient(180deg,#80808012_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="max-w-[1800px] mx-auto px-6">
          {/* Header - Apple Style */}
          <header className="pt-12 pb-8 px-4">
            <div className="flex items-baseline gap-4">
              <h1 className="text-6xl font-light tracking-tight text-gray-900">
                {greeting}
              </h1>
              <span className="text-6xl font-thin text-gray-400">,</span>
              <h2 className="text-6xl font-thin text-gray-700">Miguel</h2>
            </div>
            <p className="text-gray-500 text-lg font-light mt-2 tracking-wide">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </header>

          {/* Main Dashboard Grid */}
          <main className="pb-16">
            {/* Top Row - Essential Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* Clock - Left Side */}
              <div className="lg:col-span-3">
                <Clock />
              </div>

              {/* Weather - Center */}
              <div className="lg:col-span-3">
                <Weather />
              </div>

              {/* Calendar - Right */}
              <div className="lg:col-span-6">
                <Calendar />
              </div>
            </div>

            {/* Middle Row - Productivity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* Reminders */}
              <div className="lg:col-span-4">
                <Reminders />
              </div>

              {/* Journal */}
              <div className="lg:col-span-5">
                <Journal />
              </div>

              {/* Quote */}
              <div className="lg:col-span-3">
                <Quote />
              </div>
            </div>

            {/* Bottom Row - News Full Width */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* News - Takes full width */}
              <div className="lg:col-span-12">
                <News />
              </div>
            </div>

            {/* Row for Notes and Pomodoro Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* Notes - Half width on large screens */}
              <div className="lg:col-span-6">
                <Notes />
              </div>

              {/* Pomodoro Timer - Half width on large screens */}
              <div className="lg:col-span-6">
                <Pomodoro />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;