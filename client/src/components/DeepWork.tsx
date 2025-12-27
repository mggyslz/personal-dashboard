import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Target, CheckCircle, Clock } from 'lucide-react';

const SPRINT_DURATIONS = {
  '60-min': 60 * 60,
  '90-min': 90 * 60,
  '120-min': 120 * 60,
};

type SprintDuration = keyof typeof SPRINT_DURATIONS;

export default function DeepWorkSprint() {
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATIONS['60-min']);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState<SprintDuration>('60-min');
  const [task, setTask] = useState('');
  const [isTaskLocked, setIsTaskLocked] = useState(false);
  const [sessionOutput, setSessionOutput] = useState('');
  const [showOutputCheck, setShowOutputCheck] = useState(false);
  const [completedSprints, setCompletedSprints] = useState(0);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsActive(false);
            setShowOutputCheck(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const startSprint = () => {
    if (task.trim() && !isTaskLocked) {
      setIsTaskLocked(true);
      setIsActive(true);
    }
  };

  const resetSprint = () => {
    setIsActive(false);
    setTimeLeft(SPRINT_DURATIONS[duration]);
    setIsTaskLocked(false);
    setShowOutputCheck(false);
    setSessionOutput('');
  };

  const handleDurationChange = (newDuration: SprintDuration) => {
    if (!isActive && !isTaskLocked) {
      setDuration(newDuration);
      setTimeLeft(SPRINT_DURATIONS[newDuration]);
    }
  };

  const submitOutput = () => {
    if (sessionOutput.trim()) {
      setCompletedSprints(prev => prev + 1);
      setShowOutputCheck(false);
      setTask('');
      setIsTaskLocked(false);
      setTimeLeft(SPRINT_DURATIONS[duration]);
    }
  };

  const getProgressPercentage = () => {
    const totalTime = SPRINT_DURATIONS[duration];
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center">
              <Target size={24} strokeWidth={1.5} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-light text-gray-800">
                Deep Work Sprint
              </h1>
              <p className="text-sm text-gray-500 font-light mt-1">
                Single-task focus with output verification
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Left Column - Timer & Task */}
          <div className="flex flex-col space-y-8">
            {/* Session Status */}
            <div className={`p-6 rounded-2xl border ${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className={`font-medium ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                    {isActive ? 'IN SESSION' : 'SESSION READY'}
                  </span>
                </div>
                <div className="text-3xl font-light text-gray-800">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Task Input */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-4">Session Task</h3>
              <textarea
                value={task}
                onChange={(e) => !isTaskLocked && setTask(e.target.value)}
                placeholder="Define your single task for this sprint..."
                className="w-full h-32 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isTaskLocked}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  {isTaskLocked ? 'Task locked for session' : 'Task will be locked when session starts'}
                </span>
                {task.trim() && !isTaskLocked && (
                  <button
                    onClick={() => setIsTaskLocked(true)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Lock Task
                  </button>
                )}
              </div>
            </div>

            {/* Duration Selection */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-4">Sprint Duration</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SPRINT_DURATIONS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleDurationChange(key as SprintDuration)}
                    disabled={isActive || isTaskLocked}
                    className={`px-4 py-3 rounded-xl font-light transition-all flex flex-col items-center ${
                      duration === key
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${(isActive || isTaskLocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Clock size={18} strokeWidth={1.5} className="mb-1" />
                    <span>{key.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Controls & Output */}
          <div className="flex flex-col space-y-8">
            {/* Session Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-4">Session Control</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startSprint}
                  disabled={!task.trim() || isActive || isTaskLocked}
                  className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-light transition-all text-lg ${
                    task.trim() && !isActive && !isTaskLocked
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause size={20} strokeWidth={1.5} />
                      Pause Sprint
                    </>
                  ) : (
                    <>
                      <Play size={20} strokeWidth={1.5} />
                      Start Sprint
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetSprint}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-light transition-all text-lg"
                >
                  <RotateCcw size={20} strokeWidth={1.5} />
                  Reset Session
                </button>
              </div>
            </div>

            {/* Output Verification */}
            {showOutputCheck && (
              <div className="bg-white rounded-2xl border border-blue-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={24} strokeWidth={1.5} className="text-blue-600" />
                  <h3 className="text-lg font-light text-gray-700">Session Output Review</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Document what you accomplished during this sprint. This reinforces completion and provides a record of progress.
                </p>
                <textarea
                  value={sessionOutput}
                  onChange={(e) => setSessionOutput(e.target.value)}
                  placeholder="What did you actually accomplish? Be specific..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />
                <div className="flex justify-end">
                  <button
                    onClick={submitOutput}
                    disabled={!sessionOutput.trim()}
                    className={`px-6 py-3 rounded-xl font-light transition-all ${
                      sessionOutput.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Complete Sprint
                  </button>
                </div>
              </div>
            )}

            {/* Progress Stats */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <div className="text-2xl font-light text-gray-800 mb-1">{completedSprints}</div>
                  <div className="text-sm text-gray-600">Sprints Completed</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                  <div className="text-2xl font-light text-gray-800 mb-1">
                    {duration.replace('-min', '')}
                  </div>
                  <div className="text-sm text-gray-600">Minutes Per Sprint</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Session Progress</span>
                  <span className="font-medium text-gray-800">{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="p-6 bg-gradient-to-r from-indigo-50/60 to-indigo-100/40 rounded-2xl border border-indigo-200/50">
              <div className="flex items-start gap-4">
                <Target size={20} strokeWidth={1.5} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-indigo-800 mb-1">Deep Work Methodology</h4>
                  <p className="text-sm font-light text-indigo-700/90">
                    Each sprint consists of a single, uninterrupted focus session followed by output verification. 
                    This method emphasizes quality of work over quantity of sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}