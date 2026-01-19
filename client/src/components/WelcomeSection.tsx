import React from 'react';
import { Timer, Target, TrendingUp, BookOpen } from 'lucide-react';

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
      boxColor: 'bg-white border-2 border-black',
      shadowColor: 'shadow-[4px_4px_0px_0px_#000000]',
      iconBg: 'bg-white border-2 border-black',
      iconColor: 'text-black',
      link: '/productivity'
    },
    {
      label: 'MIT Streak',
      value: mitStreak,
      description: 'Days on target',
      icon: Target,
      boxColor: 'bg-white border-2 border-black',
      shadowColor: 'shadow-[4px_4px_0px_0px_#000000]',
      iconBg: 'bg-white border-2 border-black',
      iconColor: 'text-black',
      link: '/productivity'
    },
    {
      label: 'Productivity',
      value: `${Math.min(100, Math.round((completedTasks / Math.max(totalReminders, 1)) * 100))}%`,
      description: 'Tasks completed',
      icon: TrendingUp,
      boxColor: 'bg-white border-2 border-black',
      shadowColor: 'shadow-[4px_4px_0px_0px_#000000]',
      iconBg: 'bg-white-300 border-2 border-black',
      iconColor: 'text-black',
      link: '/'
    },
    {
      label: 'Journal Entries',
      value: journalEntries,
      description: 'Total reflections',
      icon: BookOpen,
      boxColor: 'bg-white border-2 border-black',
      shadowColor: 'shadow-[4px_4px_0px_0px_#000000]',
      iconBg: 'bg-white border-2 border-black',
      iconColor: 'text-black',
      link: '/journal'
    },
  ];

  return (
    <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="text-3xl font-black text-black mb-3">PRODUCTIVITY DASHBOARD</h3>
          <p className="text-gray-800 font-bold">
            Your daily performance metrics at a glance
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-800 font-black mb-1">TODAY</div>
          <div className="text-xl font-black text-black px-4 py-2 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              weekday: 'short'
            }).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {productivityStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <a 
              key={index}
              href={stat.link}
              className={`${stat.boxColor} ${stat.shadowColor} p-5 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.iconBg} p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                  <Icon size={24} className={stat.iconColor} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  {stat.label}
                </span>
              </div>
              <div className="text-4xl font-black mb-1 text-black">{stat.value}</div>
              <div className="text-sm text-gray-800 font-bold">{stat.description}</div>
            </a>
          );
        })}
      </div>

      {/* Stats summary footer */}
      <div className="mt-8 pt-6 border-t-2 border-black">
        <div className="flex justify-between items-center">
          <div className="text-sm text-black font-black">
            <span>Total Metrics:</span> {completedTasks + focusSessions + mitStreak + journalEntries} tracked activities
          </div>
        </div>
      </div>
    </div>
  );
}