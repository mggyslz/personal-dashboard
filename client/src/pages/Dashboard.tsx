import { useState, useEffect } from 'react';
import { api } from '../services/api';
import useDeepWork from '../hooks/useDeepWork';
import WelcomeSection from '../components/WelcomeSection';
import EssentialWidgets from '../components/EssentialWidgets';
import DeepWorkWidget from '../components/DeepWorkWidget';
import MITWidget from '../components/MITWidget';
import OutputTrackerWidget from '../components/OutputTrackerWidget';
import LoadingSkeleton from '../components/LoadingSkeleton';
import MoodTracker from '../components/MoodTracker';

interface DashboardStats {
  completedTasks: number;
  totalReminders: number;
  focusSessions: number;
  journalEntries: number;
  mitStreak: number;
  currentMIT: string | null;
  mitCompleted: number;
  outputToday: number;
  outputStreak: number;
  outputTypes: Array<{name: string; todayTotal: number; target: number; color: string}>;
}

export default function Dashboard() {
  const [quickStats, setQuickStats] = useState<DashboardStats>({
    completedTasks: 0,
    totalReminders: 0,
    focusSessions: 0,
    journalEntries: 0,
    mitStreak: 0,
    currentMIT: null,
    mitCompleted: 0,
    outputToday: 0,
    outputStreak: 0,
    outputTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [todaysDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { 
    timeLeft: deepWorkTimeLeft, 
    isActive: deepWorkIsActive, 
    task: deepWorkTask, 
    formatTime, 
    getProgressPercentage,
    isLoading: deepWorkLoading 
  } = useDeepWork();

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        reminders,
        entries,
        mitTask,
        outputStats,
        mitStreakStats,
        outputTypes,
        deepWorkStats
      ] = await Promise.all([
        api.getReminders(),
        api.getEntries(),
        api.getTodayMITTask(),
        api.getOutputStats(todaysDate),
        api.getMITStreakStats(),
        api.getOutputTypes(),
        api.getDeepWorkStats()
      ]);

      const completedReminders = Array.isArray(reminders) 
        ? reminders.filter((r: any) => r.completed === 1).length 
        : 0;

      const journalEntriesCount = Array.isArray(entries) ? entries.length : 0;
      
      const outputStreak = outputStats?.streak || 0;
      const currentMIT = mitTask?.exists ? mitTask.task : null;
      const mitCompleted = mitTask?.exists && mitTask.completed ? 1 : 0;
      const mitStreak = mitStreakStats?.current_streak || 0;
      const outputToday = outputStats?.totalOutput || 0;
      const focusSessions = deepWorkStats?.total_sprints || 0;
      
      const outputTypesData = outputTypes.map(type => {
        const typeStats = outputStats?.typeStats?.[type.name] || { todayTotal: 0, target: type.target };
        return {
          name: type.name,
          todayTotal: typeStats.todayTotal,
          target: type.target,
          color: type.color
        };
      });

      setQuickStats({
        completedTasks: completedReminders,
        totalReminders: Array.isArray(reminders) ? reminders.length : 0,
        focusSessions: focusSessions,
        journalEntries: journalEntriesCount,
        mitStreak: mitStreak,
        currentMIT: currentMIT,
        mitCompleted: mitCompleted,
        outputToday: outputToday,
        outputStreak: outputStreak,
        outputTypes: outputTypesData,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to localStorage for critical values
      const localStorageSprints = parseInt(localStorage.getItem('completedSprints') || '0');
      
      setQuickStats({
        completedTasks: 0,
        totalReminders: 0,
        focusSessions: localStorageSprints,
        journalEntries: 0,
        mitStreak: 0,
        currentMIT: null,
        mitCompleted: 0,
        outputToday: 0,
        outputStreak: 0,
        outputTypes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <WelcomeSection
        completedTasks={quickStats.completedTasks}
        totalReminders={quickStats.totalReminders}
        focusSessions={quickStats.focusSessions}
        mitStreak={quickStats.mitStreak}
        journalEntries={quickStats.journalEntries}
      />

      <EssentialWidgets />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DeepWorkWidget
          timeLeft={deepWorkTimeLeft}
          isActive={deepWorkIsActive}
          task={deepWorkTask}
          formatTime={formatTime}
          getProgressPercentage={getProgressPercentage}
          deepWorkSprints={quickStats.focusSessions}
        />

        <MITWidget
          currentMIT={quickStats.currentMIT}
          mitCompleted={quickStats.mitCompleted}
          mitStreak={quickStats.mitStreak}
        />

        <OutputTrackerWidget
          outputToday={quickStats.outputToday}
          outputStreak={quickStats.outputStreak}
          outputTypes={quickStats.outputTypes}
        />
      </div>
      
      <MoodTracker />
    </div>
  );
}