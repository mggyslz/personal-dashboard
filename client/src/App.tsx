import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import JournalPage from './pages/JournalPage';
import NewsPage from './pages/NewsPage';
import NotesPage from './pages/NotesPage';
import PomodoroPage from './pages/PomodoroPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <Sidebar />
        <MainContent />
      </div>
    </Router>
  );
}

function MainContent() {
  const [greeting, setGreeting] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const location = useLocation();

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

  // Get page title based on current route
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/calendar': return 'Calendar';
      case '/journal': return 'Journal';
      case '/news': return 'News';
      case '/notes': return 'Notes';
      case '/pomodoro': return 'Pomodoro';
      default: return 'Dashboard';
    }
  };

  return (
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
        {/* Header with Page Navigation */}
        <header className="pt-12 pb-8 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-4">
              <h1 className="text-6xl font-light tracking-tight text-gray-900">
                {greeting}
              </h1>
              <span className="text-6xl font-thin text-gray-400">,</span>
              <h2 className="text-6xl font-thin text-gray-700">Miguel</h2>
            </div>
            
            {/* Page Navigation */}
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200/50 shadow-sm">
                <NavLink to="/" label="Dashboard" />
                <NavLink to="/calendar" label="Calendar" />
                <NavLink to="/journal" label="Journal" />
                <NavLink to="/news" label="News" />
                <NavLink to="/notes" label="Notes" />
                <NavLink to="/pomodoro" label="Pomodoro" />
              </nav>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-gray-500 text-lg font-light tracking-wide">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <span className="text-lg font-light text-gray-700">
              {getPageTitle()}
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/pomodoro" element={<PomodoroPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-gray-900 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );
}

export default App;