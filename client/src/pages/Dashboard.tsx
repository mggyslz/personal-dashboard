import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Clock from '../components/Clock';
import Weather from '../components/Weather';
import Quote from '../components/Quotes';
import TimeTracker from '../components/TimeTracker';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  Newspaper, 
  FileText, 
  Timer,
  Settings,
  CheckCircle,
  File,
  Clock as ClockIcon,
  TrendingUp
} from 'lucide-react';

interface DashboardStats {
  completedTasks: number;
  activeNotes: number;
  pomodoroSessions: number;
  journalEntries: number;
  upcomingEvents: number;
  totalReminders: number;
}

export default function Dashboard() {
  const [quickStats, setQuickStats] = useState<DashboardStats>({
    completedTasks: 0,
    activeNotes: 0,
    pomodoroSessions: 0,
    journalEntries: 0,
    upcomingEvents: 0,
    totalReminders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todaysDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from all endpoints in parallel
      const [
        reminders,
        notes,
        journalEntries,
        calendarEvents,
      ] = await Promise.all([
        api.getReminders(),
        api.getNotes(),
        api.getEntries(),
        api.getCalendarEvents(),
      ]);

      // Calculate statistics
      const completedReminders = Array.isArray(reminders) 
        ? reminders.filter((r: any) => r.completed === 1).length 
        : 0;

      const activeNotesCount = Array.isArray(notes) ? notes.length : 0;
      const journalEntriesCount = Array.isArray(journalEntries) ? journalEntries.length : 0;
      
      const todayEvents = Array.isArray(calendarEvents) 
        ? calendarEvents.filter((event: any) => {
            const eventDate = new Date(event.start).toISOString().split('T')[0];
            return eventDate === todaysDate;
          }).length 
        : 0;

      // Get pomodoro sessions from localStorage (or could be from API)
      const pomodoroSessions = parseInt(localStorage.getItem('pomodoroSessions') || '0');

      setQuickStats({
        completedTasks: completedReminders,
        activeNotes: activeNotesCount,
        pomodoroSessions: pomodoroSessions,
        journalEntries: journalEntriesCount,
        upcomingEvents: todayEvents,
        totalReminders: Array.isArray(reminders) ? reminders.length : 0,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to localStorage data
      const fallbackStats = {
        completedTasks: parseInt(localStorage.getItem('completedTasks') || '0'),
        activeNotes: parseInt(localStorage.getItem('activeNotes') || '0'),
        pomodoroSessions: parseInt(localStorage.getItem('pomodoroSessions') || '0'),
        journalEntries: parseInt(localStorage.getItem('journalEntries') || '0'),
        upcomingEvents: 0,
        totalReminders: 0,
      };
      
      setQuickStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  };

  const productivityStats = [
    {
      label: 'Productivity Today',
      value: `${Math.min(100, Math.round((quickStats.completedTasks / Math.max(quickStats.totalReminders, 1)) * 100))}%`,
      description: 'Reminders completed',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      label: 'Focus Sessions',
      value: quickStats.pomodoroSessions,
      description: 'Pomodoro completed',
      icon: Timer,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      label: 'Active Notes',
      value: quickStats.activeNotes,
      description: 'Notes in progress',
      icon: File,
      color: 'bg-violet-50 text-violet-600 border-violet-200'
    },
    {
      label: 'Journal Entries',
      value: quickStats.journalEntries,
      description: 'Total reflections',
      icon: BookOpen,
      color: 'bg-green-50 text-green-600 border-green-200'
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for welcome section */}
        <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200/50 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200/50 rounded w-1/2"></div>
            <div className="flex gap-4 pt-4">
              <div className="h-16 bg-gray-200/50 rounded w-1/4"></div>
              <div className="h-16 bg-gray-200/50 rounded w-1/4"></div>
              <div className="h-16 bg-gray-200/50 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        {/* Loading skeleton for widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="lg:col-span-4">
              <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200/50 rounded w-1/4"></div>
                  <div className="h-20 bg-gray-200/50 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section with Real Stats */}
      <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-light text-gray-800 mb-2">Welcome Back</h3>
            <p className="text-gray-500 font-light">
              Here's your productivity overview for today.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 font-light">Today</div>
            <div className="text-lg font-medium text-gray-800">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              })}
            </div>
          </div>
        </div>

        {/* Productivity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {productivityStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className={`p-4 rounded-2xl border ${stat.color} hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white/50">
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {stat.label}
                  </span>
                </div>
                <div className="text-2xl font-light">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Essential Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Clock />
        </div>
        <div className="lg:col-span-4">
          <Weather />
        </div>
        <div className="lg:col-span-4">
          <Quote />
        </div>
      </div>


      {/* Time Tracker and Mini Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Tracker - Left Side */}
        <div className="lg:col-span-1">
          <TimeTracker />
        </div>
        
        {/* Mini Calendar - Right Side */}
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
          
          {/* Small Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs font-light text-gray-400 py-1">
                {day}
              </div>
            ))}
            
            {/* Calculate days in month */}
            {(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = today.getMonth();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const daysInMonth = lastDay.getDate();
              const startingDayOfWeek = firstDay.getDay();
              const days = [];
              
              // Empty days for the start of the month
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(<div key={`empty-${i}`} className="h-6"></div>);
              }
              
              // Days of the month
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
              
              return days;
            })()}
          </div>
          
          {/* Upcoming events */}
          <div className="pt-4 border-t border-gray-200/50">
            <h4 className="text-sm font-light text-gray-700 mb-3">Upcoming</h4>
            <div className="space-y-2">
              {quickStats.upcomingEvents > 0 ? (
                <div className="text-sm text-gray-600 font-light">
                  {quickStats.upcomingEvents} event{quickStats.upcomingEvents !== 1 ? 's' : ''} today
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
      </div>

      {/* Today's Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-gradient-to-r from-blue-50/50 to-blue-100/30 rounded-3xl p-6 border border-blue-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <CheckCircle className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-light text-gray-700">Reminders</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-medium text-gray-800">{quickStats.completedTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-medium text-gray-800">
                {Math.max(0, quickStats.totalReminders - quickStats.completedTasks)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Today's Events</span>
              <span className="font-medium text-gray-800">{quickStats.upcomingEvents}</span>
            </div>
          </div>
        </div>

        {/* Writing Summary */}
        <div className="bg-gradient-to-r from-green-50/50 to-green-100/30 rounded-3xl p-6 border border-green-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              <BookOpen className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-light text-gray-700">Writing Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Journal Entries</span>
              <span className="font-medium text-gray-800">{quickStats.journalEntries}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Notes</span>
              <span className="font-medium text-gray-800">{quickStats.activeNotes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pomodoro Focus</span>
              <span className="font-medium text-gray-800">{quickStats.pomodoroSessions} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}