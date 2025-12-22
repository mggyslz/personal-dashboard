import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Bell, CheckCircle, Coffee } from 'lucide-react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const POMODORO_SETTINGS = {
  focus: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export default function Pomodoro() {
  const [timeLeft, setTimeLeft] = useState(POMODORO_SETTINGS.focus);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playNotificationSound = useCallback(() => {
    if (isPlayingSound) {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.play().catch(console.error);
    }
  }, [isPlayingSound]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(POMODORO_SETTINGS[newMode]);
    setIsActive(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsActive(false);
            
            // Play sound when timer completes
            playNotificationSound();
            
            // Automatically switch to next mode
            if (mode === 'focus') {
              const newCount = completedPomodoros + 1;
              setCompletedPomodoros(newCount);
              
              if (newCount % 4 === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              switchMode('focus');
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, completedPomodoros, playNotificationSound, switchMode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(POMODORO_SETTINGS[mode]);
  };

  const handleModeChange = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(POMODORO_SETTINGS[newMode]);
  };

  const getProgressPercentage = () => {
    const totalTime = POMODORO_SETTINGS[mode];
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'focus': return 'from-rose-500/90 to-rose-600';
      case 'shortBreak': return 'from-emerald-500/90 to-emerald-600';
      case 'longBreak': return 'from-blue-500/90 to-blue-600';
      default: return 'from-gray-500/90 to-gray-600';
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'focus': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 flex items-center justify-center">
            <div className="text-rose-600 font-light text-xs">🍅</div>
          </div>
          <h2 className="text-lg font-light text-gray-700">Pomodoro Timer</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <CheckCircle size={16} strokeWidth={1.5} className="text-gray-400" />
          <span className="text-sm font-light text-gray-600">
            {completedPomodoros} completed
          </span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative mb-8">
        {/* Progress Circle */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={`url(#gradient-${mode})`}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient-focus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="gradient-shortBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="gradient-longBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-thin mb-1 ${
              mode === 'focus' ? 'text-rose-700' : 
              mode === 'shortBreak' ? 'text-emerald-700' : 
              'text-blue-700'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm font-light text-gray-500">
              {getModeLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => handleModeChange('focus')}
          className={`px-4 py-2 rounded-xl font-light transition-all ${
            mode === 'focus'
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => handleModeChange('shortBreak')}
          className={`px-4 py-2 rounded-xl font-light transition-all ${
            mode === 'shortBreak'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => handleModeChange('longBreak')}
          className={`px-4 py-2 rounded-xl font-light transition-all ${
            mode === 'longBreak'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={toggleTimer}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-light transition-all ${
            isActive
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-gray-800 hover:bg-gray-900 text-white'
          }`}
        >
          {isActive ? (
            <>
              <Pause size={18} strokeWidth={1.5} />
              Pause
            </>
          ) : (
            <>
              <Play size={18} strokeWidth={1.5} />
              Start
            </>
          )}
        </button>
        
        <button
          onClick={resetTimer}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-light transition-all"
        >
          <RotateCcw size={18} strokeWidth={1.5} />
          Reset
        </button>
      </div>

      {/* Sound Toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Bell size={16} strokeWidth={1.5} className="text-gray-400" />
          <span className="text-sm font-light text-gray-600">Notification Sound</span>
        </div>
        <button
          onClick={() => setIsPlayingSound(!isPlayingSound)}
          className={`relative w-12 h-6 rounded-full transition-all ${
            isPlayingSound ? 'bg-rose-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              isPlayingSound ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Pomodoro Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-rose-50/50 to-rose-100/30 rounded-2xl border border-rose-200/50">
        <div className="flex items-start gap-3">
          <Coffee size={16} strokeWidth={1.5} className="text-rose-500 mt-0.5" />
          <div>
            <p className="text-sm font-light text-rose-800">
              <span className="font-normal">Tip:</span> After 4 focus sessions, take a longer 15-minute break to recharge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}