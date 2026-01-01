import React from 'react';
import { Target, CheckCircle, Flame } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface MITWidgetProps {
  currentMIT: string | null;
  mitCompleted: number;
  mitStreak: number;
}

export default function MITWidget({ currentMIT, mitCompleted, mitStreak }: MITWidgetProps) {
  return (
    <a 
      href="/productivity#mit"
      className="bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-3xl p-6 border border-amber-200/50 hover:border-amber-300/50 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-100">
            <Target size={18} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-light text-gray-700">Most Important Task</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${currentMIT ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {currentMIT ? 'Set' : 'Not set'}
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white/50 rounded-xl p-4 border border-amber-200/30">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle size={16} className={`mt-0.5 ${mitCompleted ? 'text-green-500' : 'text-gray-300'}`} />
            <p className="text-sm text-gray-700 font-light flex-1 line-clamp-2">
              {currentMIT || 'Your most important task for today will appear here...'}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-1 ${mitCompleted ? 'text-green-600' : 'text-amber-600'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${mitCompleted ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              {mitCompleted ? 'Completed' : 'Pending'}
            </span>
            <span className="text-gray-500">Today</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame size={24} className="text-red-500" />
            <div className="text-4xl font-light text-gray-800">{mitStreak}</div>
          </div>
          <div className="text-sm text-gray-600 mb-2">Current Streak</div>
          
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.min(100, Math.round((mitStreak / 30) * 100))}%</span>
            </div>
            <ProgressBar 
              percentage={Math.min(100, Math.round((mitStreak / 30) * 100))}
              gradient="linear-gradient(to right, #f87171, #dc2626)"
            />
          </div>
          
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1">
              {[...Array(7)].map((_, i) => {
                const dayStreak = mitStreak >= (7 - i);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm ${dayStreak ? 'bg-red-500' : 'bg-gray-200'}`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
          </div>
        </div>
      </div>
    </a>
  );
}