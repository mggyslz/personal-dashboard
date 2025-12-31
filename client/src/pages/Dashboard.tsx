import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Clock from '../components/Clock';
import Weather from '../components/Weather';
import Quote from '../components/Quotes';
import useDeepWork from '../hooks/useDeepWork'; // Add this import
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  Timer,
  Target,
  TrendingUp,
  BarChart3,
  Play,
  Flame,
  Hash,
  CheckCircle,
  Clock as ClockIcon
} from 'lucide-react';

interface DashboardStats {
  completedTasks: number;
  activeNotes: number;
  focusSessions: number;
  journalEntries: number;
  upcomingEvents: number;
  totalReminders: number;
  deepWorkSprints: number;
  mitCompleted: number;
  currentMIT: string | null;
  mitStreak: number;
  outputToday: number;
  outputStreak: number;
  outputTypes: Array<{name: string; todayTotal: number; target: number; color: string}>;
}

export default function Dashboard() {
  const [quickStats, setQuickStats] = useState<DashboardStats>({
    completedTasks: 0,
    activeNotes: 0,
    focusSessions: 0,
    journalEntries: 0,
    upcomingEvents: 0,
    totalReminders: 0,
    deepWorkSprints: 0,
    mitCompleted: 0,
    currentMIT: null,
    mitStreak: 0,
    outputToday: 0,
    outputStreak: 0,
    outputTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [todaysDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Use the custom hook
  const { 
    timeLeft: deepWorkTimeLeft, 
    isActive: deepWorkIsActive, 
    task: deepWorkTask, 
    formatTime, 
    getProgressPercentage,
    isLoading: deepWorkLoading 
  } = useDeepWork();

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
        mitTask,
        outputStats,
        mitStreakStats,
        outputTypes
      ] = await Promise.all([
        api.getReminders(),
        api.getNotes(),
        api.getEntries(),
        api.getCalendarEvents(),
        api.getTodayMITTask(),
        api.getOutputStats(todaysDate),
        api.getMITStreakStats(),
        api.getOutputTypes()
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

      // Get productivity stats from localStorage
      const deepWorkSprints = parseInt(localStorage.getItem('completedSprints') || '0');
      const mitStreakLocal = parseInt(localStorage.getItem('mitStreak') || '0');
      const outputStreakLocal = parseInt(localStorage.getItem('outputStreak') || '0');

      // Get MIT task and streak
      const currentMIT = mitTask?.exists ? mitTask.task : null;
      const mitCompleted = mitTask?.exists && mitTask.completed ? 1 : 0;
      const mitStreak = mitStreakStats?.current_streak || mitStreakLocal;

      // Get Output Tracker stats
      const outputToday = outputStats?.totalOutput || 0;
      const outputStreak = outputStreakLocal;
      
      // Prepare output types data for progress bars
      const outputTypesData = outputTypes.map(type => {
        const typeStats = outputStats?.typeStats?.[type.name] || { todayTotal: 0, target: type.target };
        return {
          name: type.name,
          todayTotal: typeStats.todayTotal,
          target: type.target,
          color: type.color
        };
      });

      setQuickStats({
        completedTasks: completedReminders,
        activeNotes: activeNotesCount,
        focusSessions: deepWorkSprints + outputStreak,
        journalEntries: journalEntriesCount,
        upcomingEvents: todayEvents,
        totalReminders: Array.isArray(reminders) ? reminders.length : 0,
        deepWorkSprints: deepWorkSprints,
        mitCompleted: mitCompleted,
        currentMIT: currentMIT,
        mitStreak: mitStreak,
        outputToday: outputToday,
        outputStreak: outputStreak,
        outputTypes: outputTypesData,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to localStorage data
      const fallbackStats = {
        completedTasks: parseInt(localStorage.getItem('completedTasks') || '0'),
        activeNotes: parseInt(localStorage.getItem('activeNotes') || '0'),
        focusSessions: parseInt(localStorage.getItem('focusSessions') || '0'),
        journalEntries: parseInt(localStorage.getItem('journalEntries') || '0'),
        upcomingEvents: 0,
        totalReminders: 0,
        deepWorkSprints: parseInt(localStorage.getItem('completedSprints') || '0'),
        mitCompleted: parseInt(localStorage.getItem('mitStreak') || '0'),
        currentMIT: null,
        mitStreak: parseInt(localStorage.getItem('mitStreak') || '0'),
        outputToday: 0,
        outputStreak: parseInt(localStorage.getItem('outputStreak') || '0'),
        outputTypes: [],
      };
      
      setQuickStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  };

  const getOutputProgressPercentage = (total: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((total / target) * 100, 100);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const productivityStats = [
    {
      label: 'Focus Sessions',
      value: quickStats.focusSessions,
      description: 'Deep work completed',
      icon: Timer,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      link: '/productivity'
    },
    {
      label: 'MIT Streak',
      value: quickStats.mitStreak,
      description: 'Days on target',
      icon: Target,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      link: '/productivity'
    },
    {
      label: 'Productivity Today',
      value: `${Math.min(100, Math.round((quickStats.completedTasks / Math.max(quickStats.totalReminders, 1)) * 100))}%`,
      description: 'Tasks completed',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      link: '/'
    },
    {
      label: 'Journal Entries',
      value: quickStats.journalEntries,
      description: 'Total reflections',
      icon: BookOpen,
      color: 'bg-green-50 text-green-600 border-green-200',
      link: '/journal'
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

  // Get DeepWork sprints from localStorage
  const deepWorkSprints = parseInt(localStorage.getItem('completedSprints') || '0');

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
              <a 
                key={index} 
                href={stat.link}
                className={`p-4 rounded-2xl border ${stat.color} hover:shadow-sm transition-all hover:scale-[1.02] cursor-pointer block`}
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
              </a>
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

      {/* Productivity Tools Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deep Work Timer Widget - UPDATED */}
        <a 
          href="/productivity#deepwork"
          className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 rounded-3xl p-6 border border-indigo-200/50 hover:border-indigo-300/50 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Timer size={18} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-light text-gray-700">Deep Work Sprint</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${deepWorkIsActive ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
              {deepWorkIsActive ? 'ACTIVE' : deepWorkTask ? 'READY' : 'SET TASK'}
            </span>
          </div>
          
          {/* Timer Display */}
          <div className="mb-4">
            <div className={`text-center py-6 rounded-2xl ${deepWorkIsActive ? 'bg-indigo-100/50 border border-indigo-200/50' : 'bg-gray-100/50 border border-gray-200/50'}`}>
              <div className="text-5xl font-light text-indigo-700 mb-2 font-mono">
                {deepWorkTimeLeft > 0 ? formatTime(deepWorkTimeLeft) : '--:--'}
              </div>
              <div className={`text-sm ${deepWorkIsActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                {deepWorkIsActive ? 'Time remaining' : deepWorkTask ? 'Session ready' : 'No active session'}
              </div>
            </div>
            
            {/* Progress bar - only show if there's a session */}
            {deepWorkTimeLeft > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${deepWorkIsActive ? 'bg-indigo-600' : 'bg-indigo-400'} transition-all duration-1000`}
                    style={{ 
                      width: `${getProgressPercentage()}%`,
                      background: deepWorkIsActive 
                        ? 'linear-gradient(90deg, #4f46e5, #7c3aed)' 
                        : '#818cf8'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Task and Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${deepWorkIsActive ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-700">Current Task</span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href="/productivity#deepwork"
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <ClockIcon size={16} />
                </a>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 font-light truncate px-1">
              {deepWorkTask || 'Click to set a task and start your first sprint...'}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200/50">
              <div className="flex items-center gap-1">
                <Timer size={12} />
                <span>{deepWorkSprints} sprints completed</span>
              </div>
              <div className={`flex items-center gap-1 ${deepWorkIsActive ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${deepWorkIsActive ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`} />
              </div>
            </div>
          </div>
        </a>

        {/* MIT Daily Widget - keep as is */}
        <a 
          href="/productivity#mit"
          className="bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-3xl p-6 border border-amber-200/50 hover:border-amber-300/50 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100">
                <Target size={18} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-light text-gray-700">Most Important Task</h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${quickStats.currentMIT ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {quickStats.currentMIT ? 'Set' : 'Not set'}
            </span>
          </div>
          
          {/* MIT Content */}
          <div className="space-y-4">
            {/* Task display */}
            <div className="bg-white/50 rounded-xl p-4 border border-amber-200/30">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle size={16} className={`mt-0.5 ${quickStats.mitCompleted ? 'text-green-500' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-700 font-light flex-1 line-clamp-2">
                  {quickStats.currentMIT || 'Your most important task for today will appear here...'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1 ${quickStats.mitCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${quickStats.mitCompleted ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                  {quickStats.mitCompleted ? 'Completed' : 'Pending'}
                </span>
                <span className="text-gray-500">Today</span>
              </div>
            </div>
            
            {/* Streak display */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Flame size={24} className="text-red-500" />
                <div className="text-4xl font-light text-gray-800">{quickStats.mitStreak}</div>
              </div>
              <div className="text-sm text-gray-600 mb-2">Current Streak</div>
              
              {/* Streak progress */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.min(100, Math.round((quickStats.mitStreak / 30) * 100))}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.round((quickStats.mitStreak / 30) * 100))}%` }}
                  />
                </div>
              </div>
              
              {/* Small heatmap */}
              <div className="mt-4">
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(7)].map((_, i) => {
                    const dayStreak = quickStats.mitStreak >= (7 - i);
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${dayStreak ? 'bg-red-500' : 'bg-gray-200'}`}
                      />
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
              </div>
            </div>
          </div>
        </a>

        {/* Output Tracker Widget - keep as is */}
        <a 
          href="/productivity#output"
          className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-3xl p-6 border border-blue-200/50 hover:border-blue-300/50 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <BarChart3 size={18} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-light text-gray-700">Output Tracker</h3>
            </div>
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-red-500" />
              <span className="text-xs font-medium text-gray-600">{quickStats.outputStreak} days</span>
            </div>
          </div>
          
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/50 rounded-xl p-3 border border-blue-200/30">
              <div className="text-2xl font-light text-blue-700 mb-1">{quickStats.outputToday}</div>
              <div className="text-xs text-gray-600">Today's output</div>
            </div>
            <div className="bg-white/50 rounded-xl p-3 border border-blue-200/30">
              <div className="text-2xl font-light text-blue-700 mb-1">{quickStats.outputTypes.length}</div>
              <div className="text-xs text-gray-600">Types tracked</div>
            </div>
          </div>
          
          {/* Progress bars */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Progress</h4>
            {quickStats.outputTypes.slice(0, 3).map((type, index) => {
              const percentage = getOutputProgressPercentage(type.todayTotal, type.target);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getColorClasses(type.color)}`} />
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">{type.name}</span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {type.todayTotal}/{type.target}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getColorClasses(type.color)} transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            
            {quickStats.outputTypes.length > 3 && (
              <div className="text-center pt-2">
                <span className="text-xs text-blue-600 hover:text-blue-800">
                  +{quickStats.outputTypes.length - 3} more types
                </span>
              </div>
            )}
            
            {quickStats.outputTypes.length === 0 && (
              <div className="text-center py-4">
                <Hash size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No output types configured</p>
              </div>
            )}
          </div>
          
          {/* Quick add */}
          <div className="mt-4 pt-4 border-t border-blue-200/30">
            <button className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-sm font-light transition-colors">
              + Add today's output
            </button>
          </div>
        </a>
      </div>

      {/* Calendar Section - keep as is */}
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
  );
}