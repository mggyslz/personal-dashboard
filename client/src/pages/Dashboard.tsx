import { useState, useEffect } from 'react';
import { api } from '../services/api';
import useDeepWork from '../hooks/useDeepWork';
import WelcomeSection from '../components/WelcomeSection';
import EssentialWidgets from '../components/EssentialWidgets';
import DeepWorkWidget from '../components/DeepWorkWidget';
import MITWidget from '../components/MITWidget';
import OutputTrackerWidget from '../components/OutputTrackerWidget';
import CalendarSection from '../components/CalendarSection';
import LoadingSkeleton from '../components/LoadingSkeleton';

interface DashboardStats {
  completedTasks: number;
  activeNotes: number;
  focusSessions: number;
  journalEntries: number;
  upcomingEvents: number;
  totalReminders: number;
  deepWorkSprints: number;
  mitCompleted: number;
  currentMIT: string | null;
  mitStreak: number;
  outputToday: number;
  outputStreak: number;
  outputTypes: Array<{name: string; todayTotal: number; target: number; color: string}>;
}

export default function Dashboard() {
  const [quickStats, setQuickStats] = useState<DashboardStats>({
    completedTasks: 0,
    activeNotes: 0,
    focusSessions: 0,
    journalEntries: 0,
    upcomingEvents: 0,
    totalReminders: 0,
    deepWorkSprints: 0,
    mitCompleted: 0,
    currentMIT: null,
    mitStreak: 0,
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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        reminders,
        notes,
        journalEntries,
        calendarEvents,
        mitTask,
        outputStats,
        mitStreakStats,
        outputTypes
      ] = await Promise.all([
        api.getReminders(),
        api.getNotes(),
        api.getEntries(),
        api.getCalendarEvents(),
        api.getTodayMITTask(),
        api.getOutputStats(todaysDate),
        api.getMITStreakStats(),
        api.getOutputTypes()
      ]);

      const completedReminders = Array.isArray(reminders) 
        ? reminders.filter((r: any) => r.completed === 1).length 
        : 0;

      const activeNotesCount = Array.isArray(notes) ? notes.length : 0;
      const journalEntriesCount = Array.isArray(journalEntries) ? journalEntries.length : 0;
      
      const todayEvents = Array.isArray(calendarEvents) 
        ? calendarEvents.filter((event: any) => {
            const eventDate = new Date(event.start).toISOString().split('T')[0];
            return eventDate === todaysDate;
          }).length 
        : 0;

      const deepWorkSprints = parseInt(localStorage.getItem('completedSprints') || '0');
      const mitStreakLocal = parseInt(localStorage.getItem('mitStreak') || '0');
      const outputStreakLocal = parseInt(localStorage.getItem('outputStreak') || '0');

      const currentMIT = mitTask?.exists ? mitTask.task : null;
      const mitCompleted = mitTask?.exists && mitTask.completed ? 1 : 0;
      const mitStreak = mitStreakStats?.current_streak || mitStreakLocal;

      const outputToday = outputStats?.totalOutput || 0;
      const outputStreak = outputStreakLocal;
      
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
        activeNotes: activeNotesCount,
        focusSessions: deepWorkSprints + outputStreak,
        journalEntries: journalEntriesCount,
        upcomingEvents: todayEvents,
        totalReminders: Array.isArray(reminders) ? reminders.length : 0,
        deepWorkSprints: deepWorkSprints,
        mitCompleted: mitCompleted,
        currentMIT: currentMIT,
        mitStreak: mitStreak,
        outputToday: outputToday,
        outputStreak: outputStreak,
        outputTypes: outputTypesData,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      const fallbackStats = {
        completedTasks: parseInt(localStorage.getItem('completedTasks') || '0'),
        activeNotes: parseInt(localStorage.getItem('activeNotes') || '0'),
        focusSessions: parseInt(localStorage.getItem('focusSessions') || '0'),
        journalEntries: parseInt(localStorage.getItem('journalEntries') || '0'),
        upcomingEvents: 0,
        totalReminders: 0,
        deepWorkSprints: parseInt(localStorage.getItem('completedSprints') || '0'),
        mitCompleted: parseInt(localStorage.getItem('mitStreak') || '0'),
        currentMIT: null,
        mitStreak: parseInt(localStorage.getItem('mitStreak') || '0'),
        outputToday: 0,
        outputStreak: parseInt(localStorage.getItem('outputStreak') || '0'),
        outputTypes: [],
      };
      
      setQuickStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const deepWorkSprints = parseInt(localStorage.getItem('completedSprints') || '0');

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
          deepWorkSprints={deepWorkSprints}
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
          getColorClasses={getColorClasses}
        />
      </div>

      <CalendarSection upcomingEvents={quickStats.upcomingEvents} />
    </div>
  );
}