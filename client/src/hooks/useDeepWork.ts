// hooks/useDeepWork.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api'; // ADD THIS IMPORT

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

const useDeepWork = () => {
  const [session, setSession] = useState<DeepWorkSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Update localStorage when session completes
  const updateLocalStorageStats = useCallback(async () => {
    try {
      const stats = await api.getDeepWorkStats();
      const completedSprints = stats?.total_sprints || 0;
      localStorage.setItem('completedSprints', completedSprints.toString());
      
      // Also update sessionStorage for consistency
      const sessionStats = JSON.parse(sessionStorage.getItem('deepWorkStats') || '{"total_sprints":0}');
      sessionStats.total_sprints = completedSprints;
      sessionStorage.setItem('deepWorkStats', JSON.stringify(sessionStats));
    } catch (error) {
      console.error('Error updating localStorage stats:', error);
    }
  }, []);

  // Load session from localStorage
  const loadSession = useCallback(() => {
    try {
      const savedSession = JSON.parse(
        sessionStorage.getItem('activeDeepWorkSession') || 'null'
      );
      const savedTimestamp = parseInt(
        sessionStorage.getItem('deepWorkLastTick') || '0'
      );

      if (savedSession && savedSession.id) {
        const now = Date.now();
        const elapsedSeconds = savedSession.is_active && savedTimestamp > 0 
          ? Math.floor((now - savedTimestamp) / 1000) 
          : 0;

        const adjustedTimeLeft = Math.max(0, savedSession.time_left - elapsedSeconds);
        
        setSession(savedSession);
        setTimeLeft(adjustedTimeLeft);
        setIsActive(savedSession.is_active && adjustedTimeLeft > 0);
        lastUpdateRef.current = now;
        
        // If time ran out while inactive, mark as inactive
        if (adjustedTimeLeft <= 0 && savedSession.is_active) {
          const updatedSession = { ...savedSession, is_active: false };
          sessionStorage.setItem('activeDeepWorkSession', JSON.stringify(updatedSession));
          setIsActive(false);
          
          // Sync stats when session completes
          if (savedSession.completed) {
            updateLocalStorageStats();
          }
        }
      } else {
        setSession(null);
        setTimeLeft(0);
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error loading deep work session:', error);
      setSession(null);
      setTimeLeft(0);
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [updateLocalStorageStats]);

  // Initialize
  useEffect(() => {
    loadSession();
    
    // Also fetch latest stats from API on init
    updateLocalStorageStats();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeDeepWorkSession' || e.key === 'deepWorkLastTick' || e.key === 'deepWorkStats') {
        loadSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSession, updateLocalStorageStats]);

  // Timer logic
  useEffect(() => {
    const updateTimer = () => {
      if (!isActive || timeLeft <= 0) {
        return;
      }

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateRef.current) / 1000);
      
      if (elapsedSeconds >= 1) {
        lastUpdateRef.current = now;
        
        setTimeLeft(prev => {
          const newTimeLeft = Math.max(0, prev - elapsedSeconds);
          
          // Update localStorage
          if (session) {
            const updatedSession = {
              ...session,
              time_left: newTimeLeft,
              is_active: newTimeLeft > 0
            };
            sessionStorage.setItem('activeDeepWorkSession', JSON.stringify(updatedSession));
            sessionStorage.setItem('deepWorkLastTick', Date.now().toString());
          }

          if (newTimeLeft <= 0) {
            setIsActive(false);
            
            // Sync stats when timer completes
            setTimeout(() => {
              updateLocalStorageStats();
            }, 1000);
            
            return 0;
          }

          return newTimeLeft;
        });
      }

      // Schedule next update
      timerRef.current = setTimeout(updateTimer, 100);
    };

    if (isActive && timeLeft > 0) {
      lastUpdateRef.current = Date.now();
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
  }, [isActive, timeLeft, session, updateLocalStorageStats]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (!session || session.duration === 0) return 0;
    return ((session.duration - timeLeft) / session.duration) * 100;
  }, [session, timeLeft]);

  // Function to manually refresh deep work stats
  const refreshDeepWorkStats = useCallback(async () => {
    await updateLocalStorageStats();
    loadSession();
  }, [updateLocalStorageStats, loadSession]);

  return {
    session,
    timeLeft,
    isActive,
    isLoading,
    task: session?.task || null,
    formatTime,
    getProgressPercentage,
    refreshSession: loadSession,
    refreshDeepWorkStats // Export this function for manual refresh
  };
};

export default useDeepWork;