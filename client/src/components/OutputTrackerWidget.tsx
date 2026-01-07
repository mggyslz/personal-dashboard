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
  getColorClasses: (color: string) => string;
}

export default function OutputTrackerWidget({
  outputToday,
  outputStreak,
  outputTypes,
  getColorClasses
}: OutputTrackerWidgetProps) {
  const getOutputProgressPercentage = (total: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((total / target) * 100, 100);
  };

  return (
    <a 
      href="/productivity#output"
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/50">
            <BarChart3 size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-800">Output</h3>
            <p className="text-xs text-gray-500 mt-0.5">Daily progress</p>
          </div>
        </div>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
          {outputStreak} days
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-200/40">
          <div className="text-2xl font-light text-gray-800 mb-1">{outputToday}</div>
          <div className="text-xs text-gray-500">Today's output</div>
        </div>
        <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-200/40">
          <div className="text-2xl font-light text-gray-800 mb-1">{outputTypes.length}</div>
          <div className="text-xs text-gray-500">Types tracked</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-800 mb-2">Daily Progress</div>
        {outputTypes.slice(0, 3).map((type, index) => {
          const percentage = getOutputProgressPercentage(type.todayTotal, type.target);
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getColorClasses(type.color)}`} />
                  <span className="text-xs font-medium text-gray-700 truncate">{type.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {type.todayTotal}/{type.target}
                </span>
              </div>
              <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${getColorClasses(type.color)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {outputTypes.length > 3 && (
          <div className="text-center pt-2">
            <span className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              +{outputTypes.length - 3} more types
            </span>
          </div>
        )}
        
        {outputTypes.length === 0 && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-400 mb-1">No output types configured</div>
            <div className="text-xs text-gray-500">Add types to start tracking</div>
          </div>
        )}
      </div>
    </a>
  );
}