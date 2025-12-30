import { useState, useEffect } from 'react';
import { Target, CheckCircle, Calendar, TrendingUp, XCircle, Award, Flame, BarChart3, CalendarDays } from 'lucide-react';
import { api } from '../services/api';

interface MITDailyTask {
  id: number;
  date: string;
  task: string;
  completed: boolean;
  exists?: boolean;
  created_at: string;
  updated_at: string;
}

interface MITStreakStats {
  current_streak: number;
  longest_streak: number;
  streak_percentage: number;
  last_30_days: Array<{
    date: string;
    completed: boolean | null;
    has_task: boolean;
  }>;
  weekly_stats: Array<{
    week_number: string;
    total_days: number;
    completed_days: number;
    completion_rate: number;
  }>;
  monthly_stats: Array<{
    month: string;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
  }>;
}

export default function MITDaily() {
  const [task, setTask] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayTask, setTodayTask] = useState<MITDailyTask | null>(null);
  const [history, setHistory] = useState<MITDailyTask[]>([]);
  const [streakStats, setStreakStats] = useState<MITStreakStats | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const currentDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayTask();
    loadHistory();
    loadStreakStats();
  }, []);

  const loadTodayTask = async () => {
    try {
      setIsLoading(true);
      const todayTaskData = await api.getTodayMITTask();
      
      if (todayTaskData.exists) {
        setTodayTask(todayTaskData);
        setTask(todayTaskData.task);
        setIsSubmitted(true);
      } else {
        setTodayTask(null);
        setIsSubmitted(false);
      }
    } catch (error) {
      console.error('Error loading today task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const historyData = await api.getMITHistory(30);
      setHistory(historyData.history || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  };

  const loadStreakStats = async () => {
    try {
      const stats = await api.getMITStreakStats();
      setStreakStats(stats);
    } catch (error) {
      console.error('Error loading streak stats:', error);
    }
  };

  const handleSubmitTask = async () => {
    if (task.trim()) {
      try {
        const result = await api.setTodayMITTask({ task: task.trim() });
        setTodayTask(result);
        setIsSubmitted(true);
        await loadHistory();
        await loadStreakStats();
      } catch (error) {
        console.error('Error setting task:', error);
        alert('Failed to set task. Please try again.');
      }
    }
  };

  const markComplete = async () => {
    if (!todayTask) return;
    
    try {
      const result = await api.toggleMITComplete(todayTask.id, { completed: true });
      setTodayTask(result);
      await loadHistory();
      await loadStreakStats();
    } catch (error) {
      console.error('Error marking complete:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const markIncomplete = async () => {
    if (!todayTask) return;
    
    try {
      const result = await api.toggleMITComplete(todayTask.id, { completed: false });
      setTodayTask(result);
      await loadHistory();
      await loadStreakStats();
    } catch (error) {
      console.error('Error marking incomplete:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const resetTask = async () => {
    if (!todayTask) {
      setTask('');
      setIsSubmitted(false);
      return;
    }
    
    try {
      await api.deleteMITTask(todayTask.id);
      setTask('');
      setIsSubmitted(false);
      setTodayTask(null);
      await loadHistory();
      await loadStreakStats();
    } catch (error) {
      console.error('Error resetting task:', error);
      alert('Failed to reset task. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date(currentDate);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const getDayOfWeek = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getStreakHeatmap = () => {
    if (!streakStats) return [];
    
    return streakStats.last_30_days.map(day => ({
      ...day,
      dayOfWeek: getDayOfWeek(day.date)
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200/50 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200/50 rounded"></div>
            <div className="h-64 bg-gray-200/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center">
                <Target size={24} strokeWidth={1.5} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-light text-gray-800">
                  Most Important Task
                </h1>
                <p className="text-sm text-gray-500 font-light mt-1">
                  Define the single task that will determine your day
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-light transition-all"
              >
                <BarChart3 size={18} />
                Stats
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
          {/* Main Task Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar size={20} strokeWidth={1.5} className="text-gray-400" />
                  <span className="text-lg font-light text-gray-700">{currentDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame size={20} strokeWidth={1.5} className="text-red-500" />
                  <span className="font-medium text-gray-800">
                    {streakStats?.current_streak || 0} day streak
                  </span>
                </div>
              </div>

              {!isSubmitted ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-light text-gray-700 mb-3">
                      What is your Most Important Task today?
                    </label>
                    <textarea
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="Define the single task that will make today successful..."
                      className="w-full h-40 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitTask}
                      disabled={!task.trim()}
                      className={`px-8 py-3 rounded-xl font-light transition-all text-lg ${
                        task.trim()
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Set Today's MIT
                    </button>
                  </div>
                </div>
              ) : todayTask && (
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-2xl border border-amber-200">
                    <div className="flex items-start gap-4">
                      <Target size={24} strokeWidth={1.5} className="text-amber-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-medium text-amber-800 mb-2">Today's Most Important Task</h3>
                        <p className="text-gray-800 text-lg font-light leading-relaxed">{todayTask.task}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${todayTask.completed ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className={`font-medium ${todayTask.completed ? 'text-green-700' : 'text-gray-700'}`}>
                        {todayTask.completed ? 'Task Completed' : 'Task Pending'}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      {!todayTask.completed ? (
                        <button
                          onClick={markComplete}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-light transition-colors flex items-center gap-2"
                        >
                          <CheckCircle size={18} strokeWidth={1.5} />
                          Mark Complete
                        </button>
                      ) : (
                        <button
                          onClick={markIncomplete}
                          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-light transition-colors flex items-center gap-2"
                        >
                          <XCircle size={18} strokeWidth={1.5} />
                          Mark Incomplete
                        </button>
                      )}
                      <button
                        onClick={resetTask}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-light transition-colors"
                      >
                        Change Task
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Philosophy Section */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-2xl border border-gray-200">
              <div className="flex items-start gap-4">
                <TrendingUp size={20} strokeWidth={1.5} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-1">MIT Philosophy</h4>
                  <p className="text-sm font-light text-gray-600 leading-relaxed">
                    The Most Important Task method emphasizes that accomplishing one significant task 
                    is more valuable than completing many trivial ones. This approach trains decision-making 
                    and prioritization skills, focusing on impact rather than activity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light text-gray-700">Task History</h3>
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Award size={16} />
                <span>Longest: {streakStats?.longest_streak || 0} days</span>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {history.length > 0 ? (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-xl border ${
                      entry.date === currentDate
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-gray-200 bg-gray-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`text-sm font-medium ${
                          entry.date === currentDate ? 'text-amber-700' : 'text-gray-600'
                        }`}>
                          {formatDate(entry.date)}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {getDayOfWeek(entry.date)}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        entry.completed ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {entry.completed ? (
                          <CheckCircle size={14} strokeWidth={2} />
                        ) : (
                          <XCircle size={14} strokeWidth={2} />
                        )}
                      </div>
                    </div>
                    <p className="text-gray-800 text-sm font-light leading-relaxed line-clamp-2">
                      {entry.task}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No task history yet.</p>
              )}
            </div>

            {/* Streak Display */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Flame size={24} className="text-red-500" />
                  <div className="text-4xl font-light text-gray-800">{streakStats?.current_streak || 0}</div>
                </div>
                <div className="text-sm text-gray-600 mb-4">Current Streak</div>
                
                {/* Streak Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{streakStats?.streak_percentage || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000"
                      style={{ width: `${streakStats?.streak_percentage || 0}%` }}
                    />
                  </div>
                </div>
                
                {/* Streak Calendar Heatmap */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                    <CalendarDays size={16} />
                    <span>Last 30 Days</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getStreakHeatmap().map((day, index) => (
                      <div
                        key={index}
                        className={`aspect-square rounded-sm ${
                          day.completed === true
                            ? 'bg-green-500'
                            : day.completed === false
                            ? 'bg-red-400'
                            : day.has_task
                            ? 'bg-gray-300'
                            : 'bg-gray-100'
                        } ${
                          day.date === currentDate ? 'ring-2 ring-amber-400' : ''
                        }`}
                        title={`${day.date}: ${day.completed === true ? 'Completed' : day.completed === false ? 'Not completed' : 'No task'}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Completed</span>
                    <span>Missed</span>
                    <span>No Task</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      {showStatsModal && streakStats && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-light text-gray-800 flex items-center gap-3">
                <BarChart3 size={24} strokeWidth={1.5} className="text-amber-600" />
                MIT Statistics & Insights
              </h2>
              <button 
                onClick={() => setShowStatsModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 md:p-8 max-h-[calc(90vh-100px)] overflow-y-auto space-y-8">
              
              {/* Streak Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-2xl border border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame size={24} className="text-red-500" />
                    <h3 className="text-lg font-medium text-red-800">Current Streak</h3>
                  </div>
                  <div className="text-5xl font-light text-red-900 mb-2">
                    {streakStats.current_streak}
                  </div>
                  <p className="text-sm text-red-700/80">days in a row</p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={24} className="text-amber-600" />
                    <h3 className="text-lg font-medium text-amber-800">Longest Streak</h3>
                  </div>
                  <div className="text-5xl font-light text-amber-900 mb-2">
                    {streakStats.longest_streak}
                  </div>
                  <p className="text-sm text-amber-700/80">all-time record</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp size={24} className="text-green-600" />
                    <h3 className="text-lg font-medium text-green-800">Consistency</h3>
                  </div>
                  <div className="text-5xl font-light text-green-900 mb-2">
                    {streakStats.streak_percentage}%
                  </div>
                  <p className="text-sm text-green-700/80">of last 30 days</p>
                </div>
              </div>

              {/* Weekly Performance */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">
                  Weekly Completion Rates
                </h3>
                <div className="space-y-4">
                  {streakStats.weekly_stats.slice(0, 8).map((week) => (
                    <div key={week.week_number} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">Week {week.week_number}</span>
                        <span className="font-medium text-gray-800">{week.completion_rate}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-1000"
                            style={{ width: `${week.completion_rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {week.completed_days}/{week.total_days} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Stats */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">
                  Monthly Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streakStats.monthly_stats.slice(0, 6).map((month) => (
                    <div key={month.month} className="p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-800">{month.month}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {month.completed_tasks} of {month.total_tasks} tasks completed
                          </p>
                        </div>
                        <div className="text-2xl font-light text-gray-800">
                          {month.completion_rate}%
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000"
                          style={{ width: `${month.completion_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-2xl border border-blue-200">
                <div className="flex items-start gap-4">
                  <Target size={20} strokeWidth={1.5} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Tips for Maintaining Your Streak</h4>
                    <ul className="text-sm font-light text-blue-700/90 space-y-1">
                      <li>• Set your MIT first thing in the morning</li>
                      <li>• Break large tasks into smaller, actionable steps</li>
                      <li>• Focus on completing one task before starting another</li>
                      <li>• Review your MIT at the end of each day</li>
                      <li>• Don't break the chain - consistency builds momentum</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}