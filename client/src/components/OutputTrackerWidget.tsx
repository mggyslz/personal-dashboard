import React from 'react';
import { BarChart3 } from 'lucide-react';

interface OutputType {
  name: string;
  todayTotal: number;
  target: number;
  color: string;
}

interface OutputTrackerWidgetProps {
  outputToday: number;
  outputStreak: number;
  outputTypes: OutputType[];
}

export default function OutputTrackerWidget({
  outputToday,
  outputStreak,
  outputTypes
}: OutputTrackerWidgetProps) {
  const getProgressColor = (color: string) => {
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
    return colorMap[color] || 'bg-black';
  };

  const getOutputProgressPercentage = (total: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((total / target) * 100, 100);
  };

  return (
    <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-black">
            <BarChart3 size={20} className="text-black" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black">OUTPUT</h3>
            <p className="text-sm text-gray-600 mt-0.5 font-bold">DAILY PROGRESS</p>
          </div>
        </div>
        <span className="text-sm font-black px-3 py-1.5 border-2 border-blue-500 bg-blue-500 text-white">
          {outputStreak} DAY{outputStreak !== 1 ? 'S' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border-2 border-black bg-gray-50 p-4">
          <div className="text-3xl font-black text-black mb-1">{outputToday}</div>
          <div className="text-sm text-gray-600 font-bold">TODAY'S OUTPUT</div>
        </div>
        <div className="border-2 border-black bg-gray-50 p-4">
          <div className="text-3xl font-black text-black mb-1">{outputTypes.length}</div>
          <div className="text-sm text-gray-600 font-bold">TYPES TRACKED</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm font-black text-black">DAILY PROGRESS</div>
        {outputTypes.slice(0, 3).map((type, index) => {
          const percentage = getOutputProgressPercentage(type.todayTotal, type.target);
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${getProgressColor(type.color)} border-2 border-black`} />
                  <span className="text-sm font-black text-black truncate">{type.name}</span>
                </div>
                <span className="text-sm text-gray-600 font-bold">
                  {type.todayTotal}/{type.target}
                </span>
              </div>
              <div className="h-3 bg-gray-200 border-2 border-black overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${getProgressColor(type.color)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {outputTypes.length > 3 && (
          <div className="text-center pt-2">
            <span className="text-sm text-blue-600 hover:text-blue-800 font-black">
              +{outputTypes.length - 3} MORE TYPES
            </span>
          </div>
        )}
        
        {outputTypes.length === 0 && (
          <div className="text-center py-4 border-2 border-dashed border-black">
            <div className="text-sm text-gray-600 mb-1 font-bold">NO OUTPUT TYPES CONFIGURED</div>
            <div className="text-xs text-gray-600 font-bold">ADD TYPES TO START TRACKING</div>
          </div>
        )}
      </div>
    </div>
  );
}