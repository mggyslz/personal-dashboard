import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import JournalPage from './pages/JournalPage';
import NewsPage from './pages/NewsPage';
import NotesPage from './pages/NotesPage';
import ProductivityPage from './pages/ProductivityPage';

import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FFFAF0]">
        <Sidebar />
        <MainContent />
      </div>
    </Router>
  );
}

function MainContent() {
  const location = useLocation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] =
    useState<'morning' | 'afternoon' | 'evening'>('morning');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      const hour = now.getHours();
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
    };

    updateTime();
    const interval = setInterval(updateTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/calendar':
        return 'Calendar';
      case '/journal':
        return 'Journal';
      case '/news':
        return 'News';
      case '/notes':
        return 'Notes';
      case '/productivity':
        return 'Productivity';
      default:
        return 'Dashboard';
    }
  };

  const getTimeOfDayColor = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'bg-[#FFD166]';
      case 'afternoon':
        return 'bg-[#EF476F]';
      case 'evening':
        return 'bg-[#118AB2]';
      default:
        return 'bg-[#06D6A0]';
    }
  };

  return (
    <div className="ml-20">
      <header className="p-6 border-b-4 border-black bg-white">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-black text-black">{greeting}</h1>
              <span className="text-5xl font-black text-black">,</span>
              <h2 className="text-5xl font-black text-black">Miguel</h2>
            </div>

            <div
              className={`px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white ${getTimeOfDayColor()}`}
            >
              <div className="text-sm font-bold text-black">NOW</div>
              <div className="text-xl font-black text-black">
                {currentTime.toLocaleTimeString('en-US', {
                  timeZone: 'Asia/Manila',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            </div>
          </div>

          <nav className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-1">
              <NavLink to="/" label="Dashboard" color="#FFD166" />
              <NavLink to="/calendar" label="Calendar" color="#EF476F" />
              <NavLink to="/journal" label="Journal" color="#06D6A0" />
              <NavLink to="/news" label="News" color="#118AB2" />
              <NavLink to="/notes" label="Notes" color="#9D4EDD" />
              <NavLink to="/productivity" label="Productivity" color="#FF9E6D" />
            </div>
            <div className="flex items-center gap-4">
            </div>
          </nav>
        </div>
      </header>

      <main className="p-6 bg-[#FFFAF0]">
        <div className="max-w-[1800px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/productivity" element={<ProductivityPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function NavLink({
  to,
  label,
  color,
}: {
  to: string;
  label: string;
  color: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      style={{ ['--nav-color' as any]: color }}
      className={`
        relative px-5 py-3 font-bold border-2 border-black
        transition-all duration-150 flex items-center gap-2
        text-black no-underline
        visited:text-black hover:text-black active:text-black focus:text-black
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        ${isActive ? 'bg-[var(--nav-color)]' : 'bg-white'}
        hover:bg-[var(--nav-color)]
        hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
        hover:translate-x-[2px] hover:translate-y-[2px]
      `}
    >
      {label}
    </Link>
  );
}

export default App;
