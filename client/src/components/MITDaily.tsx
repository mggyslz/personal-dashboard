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
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Component with Neobrutalism Style */}
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-black">
              <Target className="text-black" size={20} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-black">MOST IMPORTANT TASK</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
            >
              <BarChart3 size={16} strokeWidth={2} />
              STATS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Card */}
            <div className="border-2 border-black bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 border-2 border-black">
                    <Calendar size={20} strokeWidth={2} className="text-black" />
                  </div>
                  <span className="text-lg font-black text-black">{currentDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 border-2 border-red-600 bg-red-100">
                    <Flame size={20} strokeWidth={2} className="text-red-900" />
                  </div>
                  <span className="font-black text-black">
                    {streakStats?.current_streak || 0} DAY STREAK
                  </span>
                </div>
              </div>

              {!isSubmitted ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-black text-black mb-3">
                      WHAT IS YOUR MOST IMPORTANT TASK TODAY?
                    </label>
                    <textarea
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="Define the single task that will make today successful..."
                      className="w-full h-40 p-4 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 resize-none text-black placeholder-gray-500 font-bold"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitTask}
                      disabled={!task.trim()}
                      className={`px-8 py-3 border-2 font-black transition-all text-lg ${
                        task.trim()
                          ? 'border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          : 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none'
                      }`}
                    >
                      SET TODAY'S MIT
                    </button>
                  </div>
                </div>
              ) : todayTask && (
                <div className="space-y-6">
                  <div className="p-6 bg-yellow-100 border-2 border-black">
                    <div className="flex items-start gap-4">
                      <div className="p-2 border-2 border-black bg-white flex-shrink-0">
                        <Target size={24} strokeWidth={2} className="text-black" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-black mb-2">TODAY'S MOST IMPORTANT TASK</h3>
                        <p className="text-black text-lg font-bold leading-relaxed">{todayTask.task}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 ${todayTask.completed ? 'border-green-600 bg-green-500' : 'border-black bg-gray-300'}`} />
                      <span className={`font-black ${todayTask.completed ? 'text-green-900' : 'text-black'}`}>
                        {todayTask.completed ? 'TASK COMPLETED' : 'TASK PENDING'}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      {!todayTask.completed ? (
                        <button
                          onClick={markComplete}
                          className="px-6 py-3 border-2 border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black flex items-center gap-2"
                        >
                          <CheckCircle size={18} strokeWidth={2} />
                          MARK COMPLETE
                        </button>
                      ) : (
                        <button
                          onClick={markIncomplete}
                          className="px-6 py-3 border-2 border-black bg-gray-800 text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black flex items-center gap-2"
                        >
                          <XCircle size={18} strokeWidth={2} />
                          MARK INCOMPLETE
                        </button>
                      )}
                      <button
                        onClick={resetTask}
                        className="px-6 py-3 border-2 border-black bg-white text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
                      >
                        CHANGE TASK
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Philosophy Section */}
            <div className="p-6 bg-blue-100 border-2 border-black">
              <div className="flex items-start gap-4">
                <div className="p-2 border-2 border-black bg-white flex-shrink-0">
                  <TrendingUp size={20} strokeWidth={2} className="text-black" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-black mb-1">MIT PHILOSOPHY</h4>
                  <p className="text-sm text-black font-bold leading-relaxed">
                    The Most Important Task method emphasizes that accomplishing one significant task 
                    is more valuable than completing many trivial ones. This approach trains decision-making 
                    and prioritization skills, focusing on impact rather than activity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Sidebar */}
          <div className="border-2 border-black bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-black">STREAK OVERVIEW</h3>
              <div className="flex items-center gap-2 text-sm text-black">
                <div className="p-1 border-2 border-black">
                  <Award size={14} strokeWidth={2} />
                </div>
                <span className="font-black">LONGEST: {streakStats?.longest_streak || 0} DAYS</span>
              </div>
            </div>
            
            {/* Streak Display */}
            <div className="space-y-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2 border-2 border-red-600 bg-red-100">
                    <Flame size={24} strokeWidth={2} className="text-red-900" />
                  </div>
                  <div className="text-4xl font-black text-black">{streakStats?.current_streak || 0}</div>
                </div>
                <div className="text-sm text-black mb-4 font-black">CURRENT STREAK</div>
                
                {/* Streak Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-black mb-1 font-black">
                    <span>PROGRESS</span>
                    <span>{streakStats?.streak_percentage || 0}%</span>
                  </div>
                  <div className="h-4 bg-white border-2 border-black overflow-hidden">
                    <div 
                      className="h-full bg-black transition-all duration-1000"
                      style={{ width: `${streakStats?.streak_percentage || 0}%` }}
                    />
                  </div>
                </div>
                
                {/* Streak Calendar Heatmap */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-sm text-black mb-3 font-black">
                    <div className="p-1 border-2 border-black">
                      <CalendarDays size={14} strokeWidth={2} />
                    </div>
                    <span>LAST 30 DAYS</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getStreakHeatmap().map((day, index) => (
                      <div
                        key={index}
                        className={`aspect-square border ${
                          day.completed === true
                            ? 'border-black bg-black'
                            : day.completed === false
                            ? 'border-red-600 bg-red-400'
                            : day.has_task
                            ? 'border-black bg-gray-300'
                            : 'border-gray-400 bg-gray-100'
                        } ${
                          day.date === currentDate ? 'ring-2 ring-black' : ''
                        }`}
                        title={`${day.date}: ${day.completed === true ? 'Completed' : day.completed === false ? 'Not completed' : 'No task'}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-black mt-2 font-black">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-black bg-black"></div>
                      DONE
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-red-600 bg-red-400"></div>
                      MISSED
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-black bg-gray-300"></div>
                      TASK
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 ring-2 ring-black"></div>
                      TODAY
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Modal - Neobrutalism Style */}
      {showStatsModal && streakStats && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStatsModal(false)}></div>
          
          {/* Modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-black flex items-center justify-center">
                    <BarChart3 className="text-black" size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black">MIT STATISTICS</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                >
                  <XCircle size={20} strokeWidth={2} />
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Streak Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-yellow-100 border-2 border-black">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 border-2 border-red-600 bg-red-100">
                        <Flame size={24} strokeWidth={2} className="text-red-900" />
                      </div>
                      <h3 className="text-lg font-black text-black">CURRENT STREAK</h3>
                    </div>
                    <div className="text-5xl font-black text-black mb-2">
                      {streakStats.current_streak}
                    </div>
                    <p className="text-sm text-black font-black">DAYS IN A ROW</p>
                  </div>
                  
                  <div className="p-6 bg-blue-100 border-2 border-black">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 border-2 border-black bg-white">
                        <Award size={24} strokeWidth={2} className="text-black" />
                      </div>
                      <h3 className="text-lg font-black text-black">LONGEST STREAK</h3>
                    </div>
                    <div className="text-5xl font-black text-black mb-2">
                      {streakStats.longest_streak}
                    </div>
                    <p className="text-sm text-black font-black">ALL-TIME RECORD</p>
                  </div>
                  
                  <div className="p-6 bg-green-100 border-2 border-black">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 border-2 border-black bg-white">
                        <TrendingUp size={24} strokeWidth={2} className="text-black" />
                      </div>
                      <h3 className="text-lg font-black text-black">CONSISTENCY</h3>
                    </div>
                    <div className="text-5xl font-black text-black mb-2">
                      {streakStats.streak_percentage}%
                    </div>
                    <p className="text-sm text-black font-black">OF LAST 30 DAYS</p>
                  </div>
                </div>

                {/* Weekly Performance */}
                <div>
                  <h3 className="text-lg font-black text-black mb-4 pb-2 border-b-2 border-black">
                    WEEKLY COMPLETION RATES
                  </h3>
                  <div className="space-y-4">
                    {streakStats.weekly_stats.slice(0, 8).map((week) => (
                      <div key={week.week_number} className="p-4 bg-white border-2 border-black">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black text-black">WEEK {week.week_number}</span>
                          <span className="font-black text-black">{week.completion_rate}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-4 bg-white border-2 border-black overflow-hidden">
                            <div 
                              className="h-full bg-black transition-all duration-1000"
                              style={{ width: `${week.completion_rate}%` }}
                            />
                          </div>
                          <span className="text-sm text-black font-black">
                            {week.completed_days}/{week.total_days} DAYS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Stats */}
                <div>
                  <h3 className="text-lg font-black text-black mb-4 pb-2 border-b-2 border-black">
                    MONTHLY PERFORMANCE
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {streakStats.monthly_stats.slice(0, 6).map((month) => (
                      <div key={month.month} className="p-4 bg-white border-2 border-black">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-black text-black">{month.month}</h4>
                            <p className="text-sm text-black mt-1 font-bold">
                              {month.completed_tasks} OF {month.total_tasks} TASKS COMPLETED
                            </p>
                          </div>
                          <div className="text-2xl font-black text-black">
                            {month.completion_rate}%
                          </div>
                        </div>
                        <div className="h-4 bg-white border-2 border-black overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-black to-gray-900 transition-all duration-1000"
                            style={{ width: `${month.completion_rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
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