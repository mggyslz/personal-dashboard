import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface TimeEntry {
  id: string;
  activity: string;
  startTime: number;
  endTime?: number;
  duration: number;
}

export default function TimeTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentActivity, setCurrentActivity] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!currentActivity.trim()) return;
    
    setIsTracking(true);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const handlePause = () => {
    setIsTracking(false);
  };

  const handleReset = () => {
    if (startTime && currentActivity) {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        activity: currentActivity,
        startTime: startTime,
        endTime: Date.now(),
        duration: elapsedTime
      };
      
      setEntries([newEntry, ...entries]);
    }
    
    setIsTracking(false);
    setCurrentActivity('');
    setElapsedTime(0);
    setStartTime(null);
  };

  const getTotalTimeToday = () => {
    const today = new Date().toDateString();
    return entries
      .filter(entry => new Date(entry.startTime).toDateString() === today)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  // Calculate progress for the circular timer (max 1 hour = 100%)
  const maxSeconds = 3600; // 1 hour
  const progress = Math.min((elapsedTime / maxSeconds) * 100, 100);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="h-full backdrop-blur-xl bg-white/40 rounded-3xl p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 border border-white/60">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100/60 to-amber-50/40 backdrop-blur-sm flex items-center justify-center border border-amber-200/30">
            <Clock className="text-amber-600" size={20} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-light text-gray-700">Time Tracker</h2>
        </div>
      </div>

      {/* Circular Timer */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-48 h-48 mb-6">
          {/* Background circle */}
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200/40"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="90"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-thin text-gray-800 tracking-tight mb-1">
              {formatTime(elapsedTime).substring(0, 5)}
            </div>
            <div className="text-sm text-gray-500 font-light">
              {currentActivity || 'Not tracking'}
            </div>
          </div>
        </div>

        {/* Activity Input */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={currentActivity}
            onChange={(e) => setCurrentActivity(e.target.value)}
            placeholder="What are you working on?"
            disabled={isTracking}
            className="w-full px-4 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 text-gray-700 placeholder-gray-400 font-light focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isTracking ? (
            <button
              onClick={handleStart}
              disabled={!currentActivity.trim()}
              className="w-14 h-14 flex items-center justify-center bg-white/60 backdrop-blur-sm hover:bg-white/80 disabled:bg-gray-100/40 disabled:cursor-not-allowed text-gray-700 disabled:text-gray-400 rounded-2xl border border-white/60 transition-all shadow-sm hover:shadow-md"
            >
              <Play size={20} strokeWidth={2} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="w-14 h-14 flex items-center justify-center bg-white/60 backdrop-blur-sm hover:bg-white/80 text-gray-700 rounded-2xl border border-white/60 transition-all shadow-sm hover:shadow-md"
            >
              <Pause size={20} strokeWidth={2} fill="currentColor" />
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="w-14 h-14 flex items-center justify-center bg-white/60 backdrop-blur-sm hover:bg-white/80 text-gray-700 rounded-2xl border border-white/60 transition-all shadow-sm hover:shadow-md"
          >
            <RotateCcw size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="pt-6 border-t border-gray-200/30">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40">
            <div className="text-2xl font-light text-gray-800">
              {formatTime(getTotalTimeToday()).substring(0, 5)}
            </div>
            <div className="text-xs text-gray-500 font-light mt-1">Today</div>
          </div>
          <div className="text-center p-3 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/40">
            <div className="text-2xl font-light text-gray-800">
              {entries.filter(e => new Date(e.startTime).toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-xs text-gray-500 font-light mt-1">Sessions</div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {entries.slice(0, 3).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal text-gray-700 truncate">
                  {entry.activity}
                </p>
                <p className="text-xs text-gray-500 font-light">
                  {new Date(entry.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className="text-sm font-light text-gray-600 ml-3">
                {formatTime(entry.duration).substring(0, 5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}