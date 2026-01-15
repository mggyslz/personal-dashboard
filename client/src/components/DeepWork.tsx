import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Target, CheckCircle, Clock, Save, History, Check, X } from 'lucide-react';
import { api } from '../services/api'; // Adjust path as needed

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const isActiveRef = useRef(isActive);
  const timeLeftRef = useRef(timeLeft);

  // Keep refs in sync with state
  useEffect(() => {
    isActiveRef.current = isActive;
    timeLeftRef.current = timeLeft;
  }, [isActive, timeLeft]);

  useEffect(() => {
    loadActiveSession();
    loadStats();
    loadAllSessions();
  }, []);

  const loadActiveSession = async () => {
    try {
      setIsLoading(true);
      
      // Try to get active session from API first
      try {
        const activeSession = await api.getActiveSession();
        if (activeSession && activeSession.id) {
          setCurrentSessionId(activeSession.id);
          setTask(activeSession.task || '');
          setTimeLeft(activeSession.time_left || SPRINT_DURATIONS['60-min']);
          timeLeftRef.current = activeSession.time_left || SPRINT_DURATIONS['60-min'];
          setIsActive(activeSession.is_active || false);
          isActiveRef.current = activeSession.is_active || false;
          setIsTaskLocked(activeSession.is_task_locked || false);

          const sessionDuration = activeSession.duration || SPRINT_DURATIONS['60-min'];
          const durationKey = Object.keys(SPRINT_DURATIONS).find(
            key => SPRINT_DURATIONS[key as SprintDuration] === sessionDuration
          ) as SprintDuration;
          if (durationKey) {
            setDuration(durationKey);
          }

          if (activeSession.time_left <= 0 && activeSession.is_active) {
            setShowOutputCheck(true);
            setIsActive(false);
            isActiveRef.current = false;
          }
          return;
        }
      } catch (apiError) {
        console.log('No active session from API, falling back to sessionStorage');
      }

      // Fallback to sessionStorage
      const mockSession = JSON.parse(sessionStorage.getItem('activeDeepWorkSession') || 'null');

      if (mockSession && mockSession.id) {
        const savedTimestamp = parseInt(sessionStorage.getItem('deepWorkLastTick') || '0');
        const now = Date.now();
        const elapsedSeconds = mockSession.is_active && savedTimestamp > 0 
          ? Math.floor((now - savedTimestamp) / 1000) 
          : 0;

        const adjustedTimeLeft = Math.max(0, mockSession.time_left - elapsedSeconds);

        setCurrentSessionId(mockSession.id);
        setTask(mockSession.task || '');
        setTimeLeft(adjustedTimeLeft);
        timeLeftRef.current = adjustedTimeLeft;
        setIsActive(mockSession.is_active && adjustedTimeLeft > 0);
        isActiveRef.current = mockSession.is_active && adjustedTimeLeft > 0;
        setIsTaskLocked(mockSession.is_task_locked || false);

        if (adjustedTimeLeft <= 0 && mockSession.is_active) {
          setShowOutputCheck(true);
          setIsActive(false);
          isActiveRef.current = false;
        }

        const sessionDuration = mockSession.duration || SPRINT_DURATIONS['60-min'];
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
      console.log('Loaded stats from API:', stats);
      setCompletedSprints(stats.total_sprints || 0);
      
      // Also load daily stats
      const dailyStats = await api.getDeepWorkDailyStats();
      console.log('Daily stats:', dailyStats);
      
      // Force a refresh of welcome section stats
      // You might want to add a callback prop or use context to update parent
    } catch (error) {
      console.error('Error loading stats from API, using local:', error);
      const stats = JSON.parse(sessionStorage.getItem('deepWorkStats') || '{"total_sprints":0}');
      setCompletedSprints(stats.total_sprints || 0);
    }
  };

  const loadAllSessions = async () => {
    try {
      const sessions = await api.getDeepWorkSessions();
      setAllSessions(sessions || []);
    } catch (error) {
      console.error('Error loading sessions from API, using local:', error);
      const sessions = JSON.parse(sessionStorage.getItem('allDeepWorkSessions') || '[]');
      setAllSessions(sessions || []);
    }
  };

  const saveSessionState = useCallback((sessionData: any) => {
    sessionStorage.setItem('activeDeepWorkSession', JSON.stringify(sessionData));
    if (sessionData.is_active) {
      sessionStorage.setItem('deepWorkLastTick', Date.now().toString());
    }
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completeSessionTimer = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;
    setShowOutputCheck(true);
    
    if (currentSessionId) {
      const sessionData = {
        id: currentSessionId,
        task,
        duration: SPRINT_DURATIONS[duration],
        time_left: 0,
        is_active: false,
        is_task_locked: isTaskLocked,
        completed: false, // Not completed yet - needs output
      };
      saveSessionState(sessionData);
      
      // Update backend immediately when timer completes
      try {
        api.updateDeepWorkSession(currentSessionId, {
          task,
          duration: SPRINT_DURATIONS[duration],
          time_left: 0,
          is_active: false,
          is_task_locked: isTaskLocked,
        }).catch(console.error);
      } catch (error) {
        console.error('Failed to update session on completion:', error);
      }
    }
  }, [currentSessionId, task, duration, isTaskLocked, saveSessionState]);

  // Improved timer logic
  useEffect(() => {
    const updateTimer = () => {
      if (!isActiveRef.current || timeLeftRef.current <= 0) {
        return;
      }

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
      
      if (elapsedSeconds >= 1) {
        lastUpdateTimeRef.current = now;
        
        setTimeLeft(prev => {
          const newTimeLeft = Math.max(0, prev - elapsedSeconds);
          timeLeftRef.current = newTimeLeft;

          if (currentSessionId) {
            const sessionData = {
              id: currentSessionId,
              task,
              duration: SPRINT_DURATIONS[duration],
              time_left: newTimeLeft,
              is_active: newTimeLeft > 0,
              is_task_locked: isTaskLocked,
            };
            saveSessionState(sessionData);
            
            // Update session in backend
            try {
              api.updateDeepWorkSession(currentSessionId, {
                task,
                duration: SPRINT_DURATIONS[duration],
                time_left: newTimeLeft,
                is_active: newTimeLeft > 0,
                is_task_locked: isTaskLocked,
              }).catch(console.error);
            } catch (error) {
              console.error('Failed to update session in backend:', error);
            }
          }

          if (newTimeLeft <= 0) {
            completeSessionTimer();
            return 0;
          }

          return newTimeLeft;
        });
      }

      // Schedule next update
      timerRef.current = setTimeout(updateTimer, 100);
    };

    if (isActive && timeLeft > 0) {
      lastUpdateTimeRef.current = Date.now();
      timerRef.current = setTimeout(updateTimer, 100);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, timeLeft, currentSessionId, task, duration, isTaskLocked, saveSessionState, completeSessionTimer]);

  const startSprint = async () => {
    if (task.trim()) {
      try {
        let sessionId = currentSessionId;

        if (!sessionId) {
          // Create new session via API
          const newSession = await api.createDeepWorkSession({
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: SPRINT_DURATIONS[duration],
            is_active: true,
            is_task_locked: true,
          });
          
          sessionId = newSession.id;
          setCurrentSessionId(sessionId);
        } else {
          // Update existing session
          await api.updateDeepWorkSession(sessionId, {
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: timeLeft,
            is_active: true,
            is_task_locked: true,
          });
        }

        const sessionData = {
          id: sessionId,
          task,
          duration: SPRINT_DURATIONS[duration],
          time_left: timeLeft,
          is_active: true,
          is_task_locked: true,
        };
        saveSessionState(sessionData);

        setIsTaskLocked(true);
        setIsActive(true);
        isActiveRef.current = true;
        lastUpdateTimeRef.current = Date.now();
        await loadAllSessions();
      } catch (error) {
        console.error('Error starting sprint with API, falling back:', error);
        // Fallback to local storage
        fallbackStartSprint();
      }
    }
  };

  const fallbackStartSprint = async () => {
    let sessionId = currentSessionId;
    
    if (!sessionId) {
      sessionId = Date.now();
      setCurrentSessionId(sessionId);
      
      const newSession = {
        id: sessionId,
        task,
        duration: SPRINT_DURATIONS[duration],
        time_left: SPRINT_DURATIONS[duration],
        is_active: true,
        is_task_locked: true,
        session_output: '',
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const sessions = JSON.parse(sessionStorage.getItem('allDeepWorkSessions') || '[]');
      sessions.push(newSession);
      sessionStorage.setItem('allDeepWorkSessions', JSON.stringify(sessions));
    }

    const sessionData = {
      id: sessionId,
      task,
      duration: SPRINT_DURATIONS[duration],
      time_left: timeLeft,
      is_active: true,
      is_task_locked: true,
    };
    saveSessionState(sessionData);

    setIsTaskLocked(true);
    setIsActive(true);
    isActiveRef.current = true;
    lastUpdateTimeRef.current = Date.now();
    await loadAllSessions();
  };

  const pauseSprint = async () => {
    if (!currentSessionId) return;

    try {
      // Update backend
      await api.updateDeepWorkSession(currentSessionId, {
        task,
        duration: SPRINT_DURATIONS[duration],
        time_left: timeLeftRef.current,
        is_active: false,
        is_task_locked: isTaskLocked,
      });

      const sessionData = {
        id: currentSessionId,
        task,
        duration: SPRINT_DURATIONS[duration],
        time_left: timeLeftRef.current,
        is_active: false,
        is_task_locked: isTaskLocked,
      };
      saveSessionState(sessionData);
      
      setIsActive(false);
      isActiveRef.current = false;
      await loadAllSessions();
    } catch (error) {
      console.error('Error pausing sprint with API, using local:', error);
      const sessionData = {
        id: currentSessionId,
        task,
        duration: SPRINT_DURATIONS[duration],
        time_left: timeLeftRef.current,
        is_active: false,
        is_task_locked: isTaskLocked,
      };
      saveSessionState(sessionData);
      
      setIsActive(false);
      isActiveRef.current = false;
    }
  };

  const resetSprint = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentSessionId) {
      try {
        // Delete from backend
        await api.deleteDeepWorkSession(currentSessionId);
      } catch (error) {
        console.error('Error deleting session from backend:', error);
        // Fallback to local storage
        const sessions = JSON.parse(sessionStorage.getItem('allDeepWorkSessions') || '[]');
        const filtered = sessions.filter((s: any) => s.id !== currentSessionId);
        sessionStorage.setItem('allDeepWorkSessions', JSON.stringify(filtered));
      }
    }

    sessionStorage.removeItem('activeDeepWorkSession');
    sessionStorage.removeItem('deepWorkLastTick');

    setIsActive(false);
    isActiveRef.current = false;
    setTimeLeft(SPRINT_DURATIONS[duration]);
    timeLeftRef.current = SPRINT_DURATIONS[duration];
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
      timeLeftRef.current = SPRINT_DURATIONS[newDuration];

      if (currentSessionId) {
        try {
          await api.updateDeepWorkSession(currentSessionId, {
            task,
            duration: SPRINT_DURATIONS[newDuration],
            time_left: SPRINT_DURATIONS[newDuration],
            is_active: false,
            is_task_locked: false,
          });
        } catch (error) {
          console.error('Error updating duration in backend:', error);
        }
        
        const sessionData = {
          id: currentSessionId,
          task,
          duration: SPRINT_DURATIONS[newDuration],
          time_left: SPRINT_DURATIONS[newDuration],
          is_active: false,
          is_task_locked: false,
        };
        saveSessionState(sessionData);
      }
    }
  };

  const submitOutput = async () => {
    if (sessionOutput.trim() && currentSessionId) {
      try {
        // Call backend API to complete the session
        const completedSession = await api.completeSession(currentSessionId, {
          session_output: sessionOutput.trim()
        });

        // Check if session was actually completed
        if (completedSession && completedSession.completed) {
          // Also update the stats
          await loadStats();
          
          // Clear local storage
          sessionStorage.removeItem('activeDeepWorkSession');
          sessionStorage.removeItem('deepWorkLastTick');

          await loadAllSessions();

          setShowOutputCheck(false);
          setTask('');
          setIsTaskLocked(false);
          setTimeLeft(SPRINT_DURATIONS[duration]);
          timeLeftRef.current = SPRINT_DURATIONS[duration];
          setCurrentSessionId(null);
          setSessionOutput('');
        } else {
          console.error('Session completion failed on server');
          alert('Failed to complete session. Please try again.');
        }
      } catch (error) {
        console.error('Error completing session with API, falling back:', error);
        // Fallback to local storage
        fallbackToLocalStorage();
      }
    }
  };

  const fallbackToLocalStorage = async () => {
    const sessions = JSON.parse(sessionStorage.getItem('allDeepWorkSessions') || '[]');
    const updatedSessions = sessions.map((s: any) => 
      s.id === currentSessionId 
        ? { ...s, completed: true, session_output: sessionOutput.trim(), updated_at: new Date().toISOString() }
        : s
    );
    sessionStorage.setItem('allDeepWorkSessions', JSON.stringify(updatedSessions));

    const stats = JSON.parse(sessionStorage.getItem('deepWorkStats') || '{"total_sprints":0}');
    stats.total_sprints = (stats.total_sprints || 0) + 1;
    sessionStorage.setItem('deepWorkStats', JSON.stringify(stats));

    sessionStorage.removeItem('activeDeepWorkSession');
    sessionStorage.removeItem('deepWorkLastTick');

    await loadStats();
    await loadAllSessions();

    setShowOutputCheck(false);
    setTask('');
    setIsTaskLocked(false);
    setTimeLeft(SPRINT_DURATIONS[duration]);
    timeLeftRef.current = SPRINT_DURATIONS[duration];
    setCurrentSessionId(null);
    setSessionOutput('');
  };

  const saveTask = async () => {
    if (task.trim()) {
      try {
        if (currentSessionId) {
          // Update existing session in backend
          await api.updateDeepWorkSession(currentSessionId, {
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: timeLeft,
            is_active: false,
            is_task_locked: false,
          });
          
          const sessionData = {
            id: currentSessionId,
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: timeLeft,
            is_active: false,
            is_task_locked: false,
          };
          saveSessionState(sessionData);
        } else {
          // Create new session in backend
          const newSession = await api.createDeepWorkSession({
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: SPRINT_DURATIONS[duration],
            is_active: false,
            is_task_locked: false,
          });
          
          setCurrentSessionId(newSession.id);
          saveSessionState(newSession);
        }

        await loadAllSessions();
        alert('Task saved successfully!');
      } catch (error) {
        console.error('Error saving task with API, using local:', error);
        if (currentSessionId) {
          const sessions = JSON.parse(sessionStorage.getItem('allDeepWorkSessions') || '[]');
          const updatedSessions = sessions.map((s: any) =>
            s.id === currentSessionId
              ? { ...s, task, duration: SPRINT_DURATIONS[duration], time_left: timeLeft, updated_at: new Date().toISOString() }
              : s
          );
          sessionStorage.setItem('allDeepWorkSessions', JSON.stringify(updatedSessions));
          
          const sessionData = {
            id: currentSessionId,
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: timeLeft,
            is_active: false,
            is_task_locked: false,
          };
          saveSessionState(sessionData);
        } else {
          const sessionId = Date.now();
          const newSession = {
            id: sessionId,
            task,
            duration: SPRINT_DURATIONS[duration],
            time_left: SPRINT_DURATIONS[duration],
            is_active: false,
            is_task_locked: false,
            session_output: '',
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          const sessions = JSON.parse(sessionStorage.getItem('allDeepWorkSessions') || '[]');
          sessions.push(newSession);
          sessionStorage.setItem('allDeepWorkSessions', JSON.stringify(sessions));
          
          setCurrentSessionId(sessionId);
          saveSessionState(newSession);
        }
        alert('Task saved locally!');
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

    setIsActive(false);
    isActiveRef.current = false;
    setShowOutputCheck(false);
    setSessionOutput('');

    setCurrentSessionId(session.id);
    setTask(session.task || '');
    setTimeLeft(session.time_left || SPRINT_DURATIONS['60-min']);
    timeLeftRef.current = session.time_left || SPRINT_DURATIONS['60-min'];
    setIsActive(session.is_active || false);
    isActiveRef.current = session.is_active || false;
    setIsTaskLocked(session.is_task_locked || false);

    const sessionDuration = session.duration || SPRINT_DURATIONS['60-min'];
    const durationKey = Object.keys(SPRINT_DURATIONS).find(
      key => SPRINT_DURATIONS[key as SprintDuration] === sessionDuration
    ) as SprintDuration;
    if (durationKey) {
      setDuration(durationKey);
    }

    saveSessionState({
      id: session.id,
      task: session.task,
      duration: session.duration,
      time_left: session.time_left,
      is_active: session.is_active,
      is_task_locked: session.is_task_locked,
    });
    
    setShowHistoryModal(false);
  };

  const deleteSession = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this session? This action cannot be undone.')) return;

    try {
      // Delete from backend
      await api.deleteDeepWorkSession(id);

      if (currentSessionId === id) {
        resetSprint();
      } else {
        await loadAllSessions();
        await loadStats();
      }
    } catch (error) {
      console.error('Error deleting session from backend:', error);
      // Fallback to local storage
      try {
        const sessions = JSON.parse(sessionStorage.getItem('allDeepWorkSessions') || '[]');
        const filtered = sessions.filter((s: any) => s.id !== id);
        sessionStorage.setItem('allDeepWorkSessions', JSON.stringify(filtered));

        if (currentSessionId === id) {
          resetSprint();
        } else {
          await loadAllSessions();
          await loadStats();
        }
      } catch (localError) {
        console.error('Error deleting session locally:', localError);
        alert('Failed to delete session.');
      }
    }
  };

  const completedSessions = allSessions.filter(s => s.completed);
  const incompleteSessions = allSessions.filter(s => !s.completed && s.id !== currentSessionId);

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200/50 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200/50 rounded"></div>
            <div className="h-4 bg-gray-200/50 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Component with Glassmorphism */}
      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Target className="text-gray-400" size={20} strokeWidth={1.5} />
            <h2 className="text-lg font-light text-gray-700">Deep Work Sprint</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={saveTask}
              disabled={!task.trim() || isActive}
              className={`flex items-center gap-2 px-4 py-2 bg-gray-100/50 border border-gray-200/50 text-gray-600 rounded-xl hover:bg-gray-200/50 transition-colors font-light disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Save size={16} strokeWidth={1.5} />
              Save Task
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-light"
            >
              <History size={16} strokeWidth={1.5} />
              History
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Timer Card */}
            <div className={`p-6 rounded-2xl border ${isActive ? 'bg-green-50/50 border-green-200/50' : 'bg-gray-50/30 border-gray-200/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className={`font-light ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                    {isActive ? 'IN SESSION' : currentSessionId ? 'SESSION SAVED' : 'SESSION READY'}
                  </span>
                </div>
                <div className="text-3xl font-light text-gray-800">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Task Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-4">Session Task</h3>
              <textarea
                value={task}
                onChange={(e) => !isTaskLocked && setTask(e.target.value)}
                placeholder="Define your single task for this sprint..."
                className="w-full h-32 p-4 bg-white/50 border border-gray-200/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 placeholder-gray-400 font-light"
                disabled={isTaskLocked}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500 font-light">
                  {isTaskLocked ? 'Task locked for session' : currentSessionId ? 'Task saved' : 'Enter a task to begin'}
                </span>
                {task.trim() && !isTaskLocked && (
                  <button
                    onClick={() => setIsTaskLocked(true)}
                    className="px-4 py-2 text-sm bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 rounded-lg transition-colors font-light border border-gray-200/50"
                  >
                    Lock Task
                  </button>
                )}
              </div>
            </div>

            {/* Duration Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-4">Sprint Duration</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SPRINT_DURATIONS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleDurationChange(key as SprintDuration)}
                    disabled={isActive || isTaskLocked}
                    className={`px-4 py-3 rounded-xl font-light transition-all flex flex-col items-center ${
                      duration === key
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50/50 text-gray-600 hover:bg-gray-100/50 border border-gray-200/50'
                    } ${(isActive || isTaskLocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Clock size={18} strokeWidth={1.5} className="mb-1" />
                    <span>{key.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Controls Card */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
              <h3 className="text-lg font-light text-gray-700 mb-4">Session Control</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={isActive ? pauseSprint : startSprint}
                  disabled={!task.trim()}
                  className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-light transition-all text-lg ${
                    task.trim()
                      ? 'bg-gray-800 hover:bg-gray-900 text-white'
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
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 rounded-xl font-light transition-all text-lg border border-gray-200/50"
                >
                  <RotateCcw size={20} strokeWidth={1.5} />
                  Reset Session
                </button>
              </div>
            </div>

            {/* Output Review Card */}
            {showOutputCheck && (
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={24} strokeWidth={1.5} className="text-blue-600" />
                  <h3 className="text-lg font-light text-gray-700">Session Output Review</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 font-light">
                  Document what you accomplished during this sprint. This reinforces completion and provides a record of progress.
                </p>
                <textarea
                  value={sessionOutput}
                  onChange={(e) => setSessionOutput(e.target.value)}
                  placeholder="What did you actually accomplish? Be specific..."
                  className="w-full h-32 p-4 bg-white/50 border border-gray-200/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 placeholder-gray-400 font-light mb-4"
                />
                <div className="flex justify-end">
                  <button
                    onClick={submitOutput}
                    disabled={!sessionOutput.trim()}
                    className={`px-6 py-3 rounded-xl font-light transition-all ${
                      sessionOutput.trim()
                        ? 'bg-gray-800 hover:bg-gray-900 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Complete Sprint
                  </button>
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-gray-50/30 to-gray-100/20 rounded-2xl border border-gray-200/50 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-200/50">
                  <div className="text-2xl font-light text-gray-800 mb-1">{completedSprints}</div>
                  <div className="text-sm text-gray-600 font-light">Sprints Completed</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-xl border border-gray-200/50">
                  <div className="text-2xl font-light text-gray-800 mb-1">
                    {duration.replace('-min', '')}
                  </div>
                  <div className="text-sm text-gray-600 font-light">Minutes Per Sprint</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-light">Current Session Progress</span>
                  <span className="font-light text-gray-800">{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-800 transition-all duration-1000 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}></div>
          
          {/* Modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100/50 flex items-center justify-center border border-gray-200/50">
                    <History className="text-gray-600" size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-light text-gray-800">Session History</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-8">
                {incompleteSessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-light text-gray-600 uppercase tracking-wider mb-4">
                      In-Progress / Saved Sessions ({incompleteSessions.length})
                    </h4>
                    <div className="space-y-4">
                      {incompleteSessions.map((session) => (
                        <div key={session.id} className="p-4 bg-yellow-50/50 rounded-xl border border-yellow-200/50 flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-light text-yellow-800 truncate">{session.task}</h5>
                            <div className="text-sm text-yellow-600 mt-1 flex gap-4 font-light">
                              <span>Time Left: {formatTime(session.time_left)}</span>
                              <span>Duration: {Math.floor(session.duration / 60)} min</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            <button
                              onClick={() => continueSession(session)}
                              className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors font-light"
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

                <div>
                  <h4 className={`text-sm font-light text-gray-600 uppercase tracking-wider mb-4 ${incompleteSessions.length > 0 ? 'mt-8' : ''}`}>
                    Completed Sprints ({completedSessions.length})
                  </h4>
                  <div className="space-y-4">
                    {completedSessions.map((session) => (
                      <div key={session.id} className="p-4 bg-green-50/50 rounded-xl border border-green-200/50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-light text-green-800 truncate">{session.task}</h5>
                            <p className="text-sm text-green-700 mt-1 line-clamp-2 font-light">Output: {session.session_output}</p>
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs text-green-600 flex items-center font-light">
                                <Check size={14} className="mr-1" />
                                {Math.floor(session.duration / 60)} min
                              </span>
                              <span className="text-xs text-green-600 font-light">
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
                      <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200/50 rounded-2xl bg-gray-50/30">
                        <div className="w-12 h-12 rounded-lg bg-gray-100/50 flex items-center justify-center mb-3 border border-gray-200/50">
                          <Target className="text-gray-400" size={20} strokeWidth={1.5} />
                        </div>
                        <p className="text-gray-500 text-sm font-light">No completed sprints yet. Start your first session!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}