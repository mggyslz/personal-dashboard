import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Target, CheckCircle, Clock, Save, History, Check, X } from 'lucide-react';
import { api } from '../services/api'; // Import your API service

const SPRINT_DURATIONS = {
  '60-min': 60 * 60,
  '90-min': 90 * 60,
  '120-min': 120 * 60,
};

type SprintDuration = keyof typeof SPRINT_DURATIONS;

interface DeepWorkSession {
  id: number;
  task: string;
  duration: number;
  time_left: number;
  is_active: boolean;
  is_task_locked: boolean;
  session_output: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function DeepWorkSprint() {
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATIONS['60-min']);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState<SprintDuration>('60-min');
  const [task, setTask] = useState('');
  const [isTaskLocked, setIsTaskLocked] = useState(false);
  const [sessionOutput, setSessionOutput] = useState('');
  const [showOutputCheck, setShowOutputCheck] = useState(false);
  const [completedSprints, setCompletedSprints] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [allSessions, setAllSessions] = useState<DeepWorkSession[]>([]);

  // Load active session on component mount
  useEffect(() => {
    loadActiveSession();
    loadStats();
    loadAllSessions();
  }, []);

  const loadActiveSession = async () => {
    try {
      setIsLoading(true);
      const session = await api.getActiveSession();

      if (session && session.id) {
        setCurrentSessionId(session.id);
        setTask(session.task || '');
        setTimeLeft(session.time_left || SPRINT_DURATIONS['60-min']);
        setIsActive(session.is_active || false);
        setIsTaskLocked(session.is_task_locked || false);

        // Find matching duration
        const sessionDuration = session.duration || SPRINT_DURATIONS['60-min'];
        const durationKey = Object.keys(SPRINT_DURATIONS).find(
          key => SPRINT_DURATIONS[key as SprintDuration] === sessionDuration
        ) as SprintDuration;
        if (durationKey) {
          setDuration(durationKey);
        }
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await api.getDeepWorkStats();
      setCompletedSprints(stats.total_sprints || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAllSessions = async () => {
    try {
      const sessions = await api.getDeepWorkSessions();
      setAllSessions(sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setAllSessions([]);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0 && currentSessionId) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;

          // Update session in backend every 10 seconds
          if (newTimeLeft % 10 === 0 && currentSessionId) {
            updateSessionTime(newTimeLeft);
          }

          if (newTimeLeft <= 1) {
            clearInterval(interval);
            completeSessionTimer();
            return 0;
          }
          return newTimeLeft;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, currentSessionId]);

  const updateSessionTime = async (newTimeLeft: number) => {
    if (!currentSessionId) return;

    try {
      await api.updateDeepWorkSession(currentSessionId, {
        time_left: newTimeLeft
      });
    } catch (error) {
      console.error('Error updating session time:', error);
    }
  };

  const startSprint = async () => {
    if (task.trim()) {
      try {
        let sessionId = currentSessionId;

        if (!sessionId) {
          // Create new session
          const session = await api.createDeepWorkSession({
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: SPRINT_DURATIONS[duration],
            is_active: true,
            is_task_locked: true
          });
          sessionId = session.id;
          setCurrentSessionId(sessionId);
        } else {
          // Update existing session
          await api.updateDeepWorkSession(sessionId, {
            is_active: true,
            is_task_locked: true
          });
        }

        setIsTaskLocked(true);
        setIsActive(true);
        await loadAllSessions();
      } catch (error) {
        console.error('Error starting sprint:', error);
        alert('Failed to start sprint. Please try again.');
      }
    }
  };

  const pauseSprint = async () => {
    if (!currentSessionId) return;

    try {
      await api.updateDeepWorkSession(currentSessionId, {
        is_active: false,
        time_left: timeLeft
      });
      setIsActive(false);
      await loadAllSessions();
    } catch (error) {
      console.error('Error pausing sprint:', error);
    }
  };

  const completeSessionTimer = () => {
    setIsActive(false);
    setShowOutputCheck(true);
  };

  const resetSprint = async () => {
    if (currentSessionId) {
      try {
        await api.deleteDeepWorkSession(currentSessionId);
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }

    setIsActive(false);
    setTimeLeft(SPRINT_DURATIONS[duration]);
    setIsTaskLocked(false);
    setShowOutputCheck(false);
    setSessionOutput('');
    setCurrentSessionId(null);
    await loadAllSessions();
  };

  const handleDurationChange = async (newDuration: SprintDuration) => {
    if (!isActive && !isTaskLocked) {
      setDuration(newDuration);
      setTimeLeft(SPRINT_DURATIONS[newDuration]);

      if (currentSessionId) {
        try {
          await api.updateDeepWorkSession(currentSessionId, {
            duration: SPRINT_DURATIONS[newDuration],
            time_left: SPRINT_DURATIONS[newDuration]
          });
        } catch (error) {
          console.error('Error updating duration:', error);
        }
      }
    }
  };

  const submitOutput = async () => {
    if (sessionOutput.trim() && currentSessionId) {
      try {
        await api.completeSession(currentSessionId, {
          session_output: sessionOutput.trim()
        });

        // Refresh stats and sessions
        await loadStats();
        await loadAllSessions();

        setShowOutputCheck(false);
        setTask('');
        setIsTaskLocked(false);
        setTimeLeft(SPRINT_DURATIONS[duration]);
        setCurrentSessionId(null);
        setSessionOutput('');
      } catch (error) {
        console.error('Error completing session:', error);
        alert('Failed to submit session output. Please try again.');
      }
    }
  };

  const saveTask = async () => {
    if (task.trim()) {
      try {
        if (currentSessionId) {
          // Update existing session
          await api.updateDeepWorkSession(currentSessionId, {
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: timeLeft
          });
        } else {
          // Create new session without starting it
          const session = await api.createDeepWorkSession({
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: SPRINT_DURATIONS[duration],
            is_active: false,
            is_task_locked: false
          });
          setCurrentSessionId(session.id);
        }

        await loadAllSessions();
        alert('Task saved successfully!');
      } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task. Please try again.');
      }
    }
  };

  const getProgressPercentage = () => {
    const totalTime = SPRINT_DURATIONS[duration];
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const continueSession = async (session: DeepWorkSession) => {
    if (session.completed) return;

    // Reset current state
    setIsActive(false);
    setShowOutputCheck(false);
    setSessionOutput('');

    // Load session data
    setCurrentSessionId(session.id);
    setTask(session.task || '');
    setTimeLeft(session.time_left || SPRINT_DURATIONS['60-min']);
    setIsActive(session.is_active || false);
    setIsTaskLocked(session.is_task_locked || false);

    // Find matching duration
    const sessionDuration = session.duration || SPRINT_DURATIONS['60-min'];
    const durationKey = Object.keys(SPRINT_DURATIONS).find(
      key => SPRINT_DURATIONS[key as SprintDuration] === sessionDuration
    ) as SprintDuration;
    if (durationKey) {
      setDuration(durationKey);
    }
    
    setShowHistoryModal(false);
  };

  const deleteSession = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this session? This action cannot be undone.')) return;

    try {
      await api.deleteDeepWorkSession(id);

      // If deleting current session, reset main state
      if (currentSessionId === id) {
        resetSprint();
      } else {
        await loadAllSessions();
        await loadStats();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session.');
    }
  };

  const completedSessions = allSessions.filter(s => s.completed);
  const incompleteSessions = allSessions.filter(s => !s.completed && s.id !== currentSessionId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
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
          <div className="flex items-center justify-between">
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
            <div className="flex gap-3">
              <button
                onClick={saveTask}
                disabled={!task.trim() || isActive}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-light transition-all ${
                  task.trim() && !isActive
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-light transition-all"
              >
                <History size={18} />
                History
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Left Column - Timer & Task */}
          <div className="flex flex-col space-y-8">
            {/* Session Status */}
            <div className={`p-6 rounded-2xl border ${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className={`font-medium ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                    {isActive ? 'IN SESSION' : currentSessionId ? 'SESSION SAVED' : 'SESSION READY'}
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
                  {isTaskLocked ? 'Task locked for session' : currentSessionId ? 'Task saved' : 'Enter a task to begin'}
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
                  onClick={isActive ? pauseSprint : startSprint}
                  disabled={!task.trim()}
                  className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-light transition-all text-lg ${
                    task.trim()
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

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-light text-gray-800 flex items-center gap-3">
                <History size={24} strokeWidth={1.5} className="text-indigo-600" />
                Session History
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 md:p-8 max-h-[calc(90vh-100px)] overflow-y-auto space-y-8">
              {/* Incomplete/Saved Sessions */}
              {incompleteSessions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">
                    In-Progress / Saved Sessions ({incompleteSessions.length})
                  </h3>
                  <div className="space-y-4">
                    {incompleteSessions.map((session) => (
                      <div key={session.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-yellow-800 truncate">{session.task}</h4>
                          <div className="text-sm text-yellow-600 mt-1 flex gap-4">
                            <span>Time Left: {formatTime(session.time_left)}</span>
                            <span>Duration: {Math.floor(session.duration / 60)} min</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <button
                            onClick={() => continueSession(session)}
                            className="px-3 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                          >
                            Continue
                          </button>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-2 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Sessions */}
              <div>
                <h3 className={`text-lg font-medium text-gray-700 mb-4 border-b pb-2 ${incompleteSessions.length > 0 ? 'mt-8' : ''}`}>
                  Completed Sprints ({completedSessions.length})
                </h3>
                <div className="space-y-4">
                  {completedSessions.map((session) => (
                    <div key={session.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-green-800 truncate">{session.task}</h4>
                          <p className="text-sm text-green-700 mt-1 line-clamp-2">Output: {session.session_output}</p>
                          <div className="flex gap-3 mt-2">
                            <span className="text-xs text-green-600 flex items-center">
                              <Check size={14} className="mr-1" />
                              {Math.floor(session.duration / 60)} min
                            </span>
                            <span className="text-xs text-green-600">
                              {formatDate(session.created_at)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="p-1 ml-4 text-gray-400 hover:text-red-700 transition-colors flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {completedSessions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No completed sprints yet. Start your first session!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}