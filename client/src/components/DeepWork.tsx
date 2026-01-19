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
    <>
      {/* Main Component with Neobrutalism Style */}
      <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 border-2 border-black">
              <Target className="text-black" size={20} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-black">DEEP WORK SPRINT</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={saveTask}
              disabled={!task.trim() || isActive}
              className={`flex items-center gap-2 px-4 py-2 border-2 ${!task.trim() || isActive ? 'border-gray-400 bg-gray-200 text-gray-500' : 'border-black bg-white text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} transition-all font-black disabled:cursor-not-allowed`}
            >
              <Save size={16} strokeWidth={2} />
              SAVE TASK
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
            >
              <History size={16} strokeWidth={2} />
              HISTORY
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Timer Card */}
            <div className={`p-6 border-2 ${isActive ? 'border-green-600 bg-green-100' : 'border-black bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 border-2 ${isActive ? 'border-green-600 bg-green-500 animate-pulse' : 'border-black bg-gray-300'}`} />
                  <span className={`font-black ${isActive ? 'text-green-800' : 'text-black'}`}>
                    {isActive ? 'IN SESSION' : currentSessionId ? 'SESSION SAVED' : 'SESSION READY'}
                  </span>
                </div>
                <div className="text-3xl font-black text-black">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Task Card */}
            <div className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-black text-black mb-4">SESSION TASK</h3>
              <textarea
                value={task}
                onChange={(e) => !isTaskLocked && setTask(e.target.value)}
                placeholder="Define your single task for this sprint..."
                className="w-full h-32 p-4 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 resize-none font-bold disabled:bg-gray-100 disabled:text-gray-500"
                disabled={isTaskLocked}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-black font-black">
                  {isTaskLocked ? 'TASK LOCKED FOR SESSION' : currentSessionId ? 'TASK SAVED' : 'ENTER A TASK TO BEGIN'}
                </span>
                {task.trim() && !isTaskLocked && (
                  <button
                    onClick={() => setIsTaskLocked(true)}
                    className="px-4 py-2 text-sm border-2 border-black bg-white text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
                  >
                    LOCK TASK
                  </button>
                )}
              </div>
            </div>

            {/* Duration Card */}
            <div className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-black text-black mb-4">SPRINT DURATION</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SPRINT_DURATIONS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleDurationChange(key as SprintDuration)}
                    disabled={isActive || isTaskLocked}
                    className={`p-4 border-2 flex flex-col items-center transition-all font-black ${duration === key ? 'border-black bg-black text-white' : 'border-black bg-white text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} ${(isActive || isTaskLocked) ? 'border-gray-400 bg-gray-200 text-gray-500 hover:translate-x-0 hover:translate-y-0 hover:shadow-none cursor-not-allowed' : ''}`}
                  >
                    <Clock size={18} strokeWidth={2} className="mb-2" />
                    <span>{key.replace('-', ' ').toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Controls Card */}
            <div className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-black text-black mb-4">SESSION CONTROL</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={isActive ? pauseSprint : startSprint}
                  disabled={!task.trim()}
                  className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 border-2 font-black transition-all text-lg ${task.trim() ? 'border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none'}`}
                >
                  {isActive ? (
                    <>
                      <Pause size={20} strokeWidth={2} />
                      PAUSE SPRINT
                    </>
                  ) : (
                    <>
                      <Play size={20} strokeWidth={2} />
                      START SPRINT
                    </>
                  )}
                </button>

                <button
                  onClick={resetSprint}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 border-2 border-black bg-white text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-lg font-black"
                >
                  <RotateCcw size={20} strokeWidth={2} />
                  RESET SESSION
                </button>
              </div>
            </div>

            {/* Output Review Card */}
            {showOutputCheck && (
              <div className="border-2 border-black bg-blue-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 border-2 border-black bg-white">
                    <CheckCircle size={20} strokeWidth={2} className="text-black" />
                  </div>
                  <h3 className="text-lg font-black text-black">SESSION OUTPUT REVIEW</h3>
                </div>
                <p className="text-sm text-black mb-4 font-bold">
                  Document what you accomplished during this sprint. This reinforces completion and provides a record of progress.
                </p>
                <textarea
                  value={sessionOutput}
                  onChange={(e) => setSessionOutput(e.target.value)}
                  placeholder="What did you actually accomplish? Be specific..."
                  className="w-full h-32 p-4 bg-white border-2 border-black focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 resize-none font-bold mb-4"
                />
                <div className="flex justify-end">
                  <button
                    onClick={submitOutput}
                    disabled={!sessionOutput.trim()}
                    className={`px-6 py-3 border-2 font-black transition-all ${sessionOutput.trim() ? 'border-black bg-black text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-none'}`}
                  >
                    COMPLETE SPRINT
                  </button>
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="border-2 border-black bg-yellow-100 p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-white border-2 border-black">
                  <div className="text-2xl font-black text-black mb-1">{completedSprints}</div>
                  <div className="text-sm text-black font-black">SPRINTS COMPLETED</div>
                </div>
                <div className="text-center p-4 bg-white border-2 border-black">
                  <div className="text-2xl font-black text-black mb-1">
                    {duration.replace('-min', '')}
                  </div>
                  <div className="text-sm text-black font-black">MINUTES PER SPRINT</div>
                </div>
              </div>
              <div className="pt-4 border-t-2 border-black">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-black font-black">CURRENT SESSION PROGRESS</span>
                  <span className="font-black text-black">{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="h-4 bg-white border-2 border-black overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-1000 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal - Neobrutalism Style */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}></div>
          
          {/* Modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-black flex items-center justify-center">
                    <History className="text-black" size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-black">SESSION HISTORY</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 border-2 border-black hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <div className="space-y-8">
                {incompleteSessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-black uppercase tracking-wider mb-4">
                      IN-PROGRESS / SAVED SESSIONS ({incompleteSessions.length})
                    </h4>
                    <div className="space-y-4">
                      {incompleteSessions.map((session) => (
                        <div key={session.id} className="p-4 bg-yellow-100 border-2 border-black flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-black text-black truncate">{session.task}</h5>
                            <div className="text-sm text-black mt-1 flex gap-4 font-bold">
                              <span>TIME LEFT: {formatTime(session.time_left)}</span>
                              <span>DURATION: {Math.floor(session.duration / 60)} MIN</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            <button
                              onClick={() => continueSession(session)}
                              className="px-3 py-2 text-sm border-2 border-black bg-black text-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black"
                            >
                              CONTINUE
                            </button>
                            <button
                              onClick={() => deleteSession(session.id)}
                              className="p-2 border-2 border-red-600 bg-red-100 text-red-900 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] transition-all"
                            >
                              <X size={18} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className={`text-sm font-black text-black uppercase tracking-wider mb-4 ${incompleteSessions.length > 0 ? 'mt-8' : ''}`}>
                    COMPLETED SPRINTS ({completedSessions.length})
                  </h4>
                  <div className="space-y-4">
                    {completedSessions.map((session) => (
                      <div key={session.id} className="p-4 bg-green-100 border-2 border-black">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-black text-black truncate">{session.task}</h5>
                            <p className="text-sm text-black mt-1 line-clamp-2 font-bold">OUTPUT: {session.session_output}</p>
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs text-black flex items-center font-black">
                                <Check size={14} className="mr-1" strokeWidth={2} />
                                {Math.floor(session.duration / 60)} MIN
                              </span>
                              <span className="text-xs text-black font-black">
                                {formatDate(session.created_at).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-1 ml-4 border-2 border-red-600 bg-red-100 text-red-900 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] transition-all flex-shrink-0"
                          >
                            <X size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {completedSessions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-black bg-gray-100">
                        <div className="w-12 h-12 border-2 border-black flex items-center justify-center mb-3 bg-white">
                          <Target className="text-black" size={20} strokeWidth={2} />
                        </div>
                        <p className="text-black text-sm font-black">NO COMPLETED SPRINTS YET. START YOUR FIRST SESSION!</p>
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