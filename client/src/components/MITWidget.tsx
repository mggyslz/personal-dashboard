import React from 'react';
import { Target, CheckCircle } from 'lucide-react';

interface MITWidgetProps {
  currentMIT: string | null;
  mitCompleted: number;
  mitStreak: number;
}

export default function MITWidget({ currentMIT, mitCompleted, mitStreak }: MITWidgetProps) {
  return (
    <a 
      href="/productivity#mit"
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/50">
            <Target size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-800">Most Important</h3>
            <p className="text-xs text-gray-500 mt-0.5">Today's priority</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${currentMIT ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {currentMIT ? 'Set' : 'Not set'}
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200/40">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle size={18} className={`mt-0.5 flex-shrink-0 ${mitCompleted ? 'text-green-500' : 'text-gray-300'}`} />
            <p className="text-sm text-gray-700 font-light flex-1">
              {currentMIT || 'Your most important task for today will appear here...'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${mitCompleted ? 'text-green-600' : 'text-amber-600'}`}>
              {mitCompleted ? 'Completed' : 'Pending'}
            </span>
            <span className="text-xs text-gray-500">Today</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-white/50 rounded-xl p-4 border border-gray-200/40">
          <div className="text-center mb-4">
            <div className="text-3xl font-light text-gray-800 mb-1">{mitStreak}</div>
            <div className="text-xs text-gray-500">Day streak</div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Progress</span>
              <span className="font-medium">{Math.min(100, Math.round((mitStreak / 30) * 100))}%</span>
            </div>
            <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.round((mitStreak / 30) * 100))}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {[...Array(7)].map((_, i) => {
                const dayStreak = mitStreak >= (7 - i);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-[4px] ${dayStreak ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gray-200/70'}`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-gray-500 text-center">Last 7 days</div>
          </div>
        </div>
      </div>
    </a>
  );
}