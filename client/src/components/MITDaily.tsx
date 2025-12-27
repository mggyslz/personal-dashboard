import { useState, useEffect } from 'react';
import { Target, CheckCircle, Calendar, TrendingUp, XCircle, Award } from 'lucide-react';

interface MITEntry {
  date: string;
  task: string;
  completed: boolean;
}

export default function MITDaily() {
  const [task, setTask] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<MITEntry[]>([
    { date: '2024-01-18', task: 'Complete project proposal', completed: true },
    { date: '2024-01-17', task: 'Finalize quarterly report', completed: true },
    { date: '2024-01-16', task: 'Prepare client presentation', completed: false },
  ]);

  const currentDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Calculate streak from history
    let currentStreak = 0;
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
    
    for (const entry of sortedHistory) {
      if (entry.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  }, [history]);

  const handleSubmitTask = () => {
    if (task.trim()) {
      setIsSubmitted(true);
      const todayEntry = history.find(entry => entry.date === currentDate);
      
      if (!todayEntry) {
        setHistory(prev => [
          { date: currentDate, task: task.trim(), completed: false },
          ...prev
        ]);
      }
    }
  };

  const markComplete = () => {
    setHistory(prev => prev.map(entry => 
      entry.date === currentDate 
        ? { ...entry, completed: true }
        : entry
    ));
  };

  const markIncomplete = () => {
    setHistory(prev => prev.map(entry => 
      entry.date === currentDate 
        ? { ...entry, completed: false }
        : entry
    ));
  };

  const resetTask = () => {
    setTask('');
    setIsSubmitted(false);
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const todayEntry = history.find(entry => entry.date === currentDate);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
        <div className="p-6 md:p-8">
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
                  <Award size={20} strokeWidth={1.5} className="text-amber-500" />
                  <span className="font-medium text-gray-800">{streak} day streak</span>
                </div>
              </div>

              {!isSubmitted && !todayEntry ? (
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
              ) : todayEntry && (
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-2xl border border-amber-200">
                    <div className="flex items-start gap-4">
                      <Target size={24} strokeWidth={1.5} className="text-amber-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-medium text-amber-800 mb-2">Today's Most Important Task</h3>
                        <p className="text-gray-800 text-lg font-light leading-relaxed">{todayEntry.task}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${todayEntry.completed ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className={`font-medium ${todayEntry.completed ? 'text-green-700' : 'text-gray-700'}`}>
                        {todayEntry.completed ? 'Task Completed' : 'Task Pending'}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      {!todayEntry.completed ? (
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
            <h3 className="text-lg font-light text-gray-700 mb-6">Task History</h3>
            
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    entry.date === currentDate
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-gray-200 bg-gray-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      entry.date === currentDate ? 'text-amber-700' : 'text-gray-600'
                    }`}>
                      {formatDate(entry.date)}
                    </span>
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
                  <p className="text-gray-800 text-sm font-light leading-relaxed">
                    {entry.task}
                  </p>
                </div>
              ))}
            </div>

            {/* Streak Display */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-light text-gray-800 mb-2">{streak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
                <div className="mt-3 flex justify-center space-x-1">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        i < streak
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Streak continues only when daily MIT is completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}