import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Bell, CheckCircle, Coffee, Timer } from 'lucide-react';

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 flex items-center justify-center">
              <Timer size={24} strokeWidth={1.5} className="text-rose-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-gray-800">Pomodoro Timer</h1>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            
            {/* Left Column - Timer Display */}
            <div className="flex flex-col items-center justify-center p-4 md:p-8">
              {/* Progress Circle */}
              <div className="relative mb-8">
                <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
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
                    <div className={`text-6xl md:text-7xl font-thin mb-2 ${
                      mode === 'focus' ? 'text-rose-700' : 
                      mode === 'shortBreak' ? 'text-emerald-700' : 
                      'text-blue-700'
                    }`}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className={`text-lg font-light ${
                      mode === 'focus' ? 'text-rose-600' : 
                      mode === 'shortBreak' ? 'text-emerald-600' : 
                      'text-blue-600'
                    }`}>
                      {getModeLabel()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-4 bg-gray-50/80 rounded-2xl p-4 w-full max-w-md">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} strokeWidth={1.5} className="text-gray-400" />
                  <span className="text-sm font-light text-gray-600">
                    Completed: <span className="font-medium text-gray-800">{completedPomodoros}</span>
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-sm font-light text-gray-600">
                  Next: <span className="font-medium text-gray-800">
                    {completedPomodoros % 4 === 0 ? 'Long Break' : 'Short Break'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Controls */}
            <div className="flex flex-col p-4 md:p-8">
              {/* Mode Selector */}
              <div className="mb-8">
                <h3 className="text-lg font-light text-gray-700 mb-4">Select Timer Mode</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleModeChange('focus')}
                    className={`flex-1 px-6 py-4 rounded-xl font-light transition-all flex items-center justify-center gap-2 ${
                      mode === 'focus'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${mode === 'focus' ? 'bg-rose-500' : 'bg-gray-400'}`}></div>
                    Focus (25 min)
                  </button>
                  <button
                    onClick={() => handleModeChange('shortBreak')}
                    className={`flex-1 px-6 py-4 rounded-xl font-light transition-all flex items-center justify-center gap-2 ${
                      mode === 'shortBreak'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                    Short Break (5 min)
                  </button>
                  <button
                    onClick={() => handleModeChange('longBreak')}
                    className={`flex-1 px-6 py-4 rounded-xl font-light transition-all flex items-center justify-center gap-2 ${
                      mode === 'longBreak'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${mode === 'longBreak' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                    Long Break (15 min)
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="mb-8">
                <h3 className="text-lg font-light text-gray-700 mb-4">Timer Controls</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={toggleTimer}
                    className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-light transition-all text-lg ${
                      isActive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-900 text-white'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Pause size={20} strokeWidth={1.5} />
                        Pause Timer
                      </>
                    ) : (
                      <>
                        <Play size={20} strokeWidth={1.5} />
                        Start Timer
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetTimer}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-light transition-all text-lg"
                  >
                    <RotateCcw size={20} strokeWidth={1.5} />
                    Reset Timer
                  </button>
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="mb-8">
                <h3 className="text-lg font-light text-gray-700 mb-4">Settings</h3>
                <div className="bg-gray-50/80 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={20} strokeWidth={1.5} className="text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Notification Sound</span>
                        <p className="text-xs font-light text-gray-500">Play sound when timer ends</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPlayingSound(!isPlayingSound)}
                      className={`relative w-14 h-7 rounded-full transition-all ${
                        isPlayingSound ? 'bg-rose-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                          isPlayingSound ? 'left-8' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pomodoro Tips */}
              <div className="p-6 bg-gradient-to-r from-rose-50/60 to-rose-100/40 rounded-2xl border border-rose-200/50">
                <div className="flex items-start gap-4">
                  <Coffee size={20} strokeWidth={1.5} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-rose-800 mb-1">Pomodoro Technique Tip</h4>
                    <p className="text-sm font-light text-rose-700/90">
                      Complete 4 focus sessions (25 min each) and then take a longer 15-minute break. 
                      This rhythm helps maintain productivity while preventing burnout.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm font-light text-gray-500">
            Pomodoro Technique: 25 min work • 5 min break • 15 min break every 4 sessions
          </p>
        </div>
      </div>
  );
}