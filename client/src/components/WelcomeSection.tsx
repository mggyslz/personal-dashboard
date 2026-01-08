import React from 'react';
import { Timer, Target, TrendingUp, BookOpen } from 'lucide-react';
import StatCard from './Card';

interface WelcomeSectionProps {
  completedTasks: number;
  totalReminders: number;
  focusSessions: number;
  mitStreak: number;
  journalEntries: number;
}

export default function WelcomeSection({
  completedTasks,
  totalReminders,
  focusSessions,
  mitStreak,
  journalEntries
}: WelcomeSectionProps) {
  const productivityStats = [
    {
      label: 'Focus Sessions',
      value: focusSessions,
      description: 'Deep work completed',
      icon: Timer,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      link: '/productivity'
    },
    {
      label: 'MIT Streak',
      value: mitStreak,
      description: 'Days on target',
      icon: Target,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      link: '/productivity'
    },
    {
      label: 'Productivity Today',
      value: `${Math.min(100, Math.round((completedTasks / Math.max(totalReminders, 1)) * 100))}%`,
      description: 'Tasks completed',
      icon: TrendingUp,
      color: 'bg-violet-50 text-violet-600 border-violet-200',
      link: '/'
    },
    {
      label: 'Journal Entries',
      value: journalEntries,
      description: 'Total reflections',
      icon: BookOpen,
      color: 'bg-green-50 text-green-600 border-green-200',
      link: '/journal'
    },
  ];

  return (
    <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-light text-gray-800 mb-2">Welcome Back</h3>
          <p className="text-gray-500 font-light">
            Here's your productivity overview for today.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 font-light">Today</div>
          <div className="text-lg font-medium text-gray-800">
            {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              weekday: 'short'
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {productivityStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}