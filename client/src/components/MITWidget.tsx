import React from 'react';
import { Target, CheckCircle } from 'lucide-react';

interface MITWidgetProps {
  currentMIT: string | null;
  mitCompleted: number;
  mitStreak: number;
}

export default function MITWidget({ currentMIT, mitCompleted, mitStreak }: MITWidgetProps) {
  const completed = mitCompleted === 1;

  return (
    <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-black">
            <Target size={20} className="text-black" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black">MOST IMPORTANT</h3>
            <p className="text-sm text-gray-600 mt-0.5 font-bold">TODAY'S PRIORITY</p>
          </div>
        </div>
        <span className={`text-sm font-black px-3 py-1.5 border-2 ${currentMIT ? 'border-orange-500 bg-orange-500 text-white' : 'border-black bg-white text-black'}`}>
          {currentMIT ? 'SET' : 'NOT SET'}
        </span>
      </div>
      
      <div className="space-y-6">
        <div className="border-2 border-black bg-gray-50 p-4">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle size={20} className={`mt-0.5 flex-shrink-0 ${completed ? 'text-green-500' : 'text-gray-300'}`} />
            <p className="text-sm text-black font-bold flex-1">
              {currentMIT || 'YOUR MOST IMPORTANT TASK FOR TODAY WILL APPEAR HERE...'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-black ${completed ? 'text-green-600' : 'text-orange-600'}`}>
              {completed ? 'COMPLETED' : 'PENDING'}
            </span>
            <span className="text-sm text-gray-600 font-bold">TODAY</span>
          </div>
        </div>
        
        <div className="border-2 border-black bg-white p-4">
          <div className="text-center mb-4">
            <div className="text-4xl font-black text-black mb-1">{mitStreak}</div>
            <div className="text-sm text-gray-600 font-bold">DAY STREAK</div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-black font-bold mb-2">
              <span>PROGRESS</span>
              <span>{Math.min(100, Math.round((mitStreak / 30) * 100))}%</span>
            </div>
            <div className="h-3 bg-gray-200 border-2 border-black overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.round((mitStreak / 30) * 100))}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {[...Array(7)].map((_, i) => {
                const dayStreak = mitStreak >= (7 - i);
                return (
                  <div
                    key={i}
                    className={`aspect-square ${dayStreak ? 'bg-orange-500' : 'bg-gray-200'} border-2 border-black`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-gray-600 font-bold text-center">LAST 7 DAYS</div>
          </div>
        </div>
      </div>
    </div>
  );
}