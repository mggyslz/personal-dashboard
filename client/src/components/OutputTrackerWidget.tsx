import React from 'react';
import { BarChart3, Flame, Hash } from 'lucide-react';
import ProgressBar from './ProgressBar';

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
      className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-3xl p-6 border border-blue-200/50 hover:border-blue-300/50 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100">
            <BarChart3 size={18} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-light text-gray-700">Output Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-red-500" />
          <span className="text-xs font-medium text-gray-600">{outputStreak} days</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/50 rounded-xl p-3 border border-blue-200/30">
          <div className="text-2xl font-light text-blue-700 mb-1">{outputToday}</div>
          <div className="text-xs text-gray-600">Today's output</div>
        </div>
        <div className="bg-white/50 rounded-xl p-3 border border-blue-200/30">
          <div className="text-2xl font-light text-blue-700 mb-1">{outputTypes.length}</div>
          <div className="text-xs text-gray-600">Types tracked</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Progress</h4>
        {outputTypes.slice(0, 3).map((type, index) => {
          const percentage = getOutputProgressPercentage(type.todayTotal, type.target);
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getColorClasses(type.color)}`} />
                  <span className="text-xs font-medium text-gray-700 truncate flex-1">{type.name}</span>
                </div>
                <span className="text-xs text-gray-600">
                  {type.todayTotal}/{type.target}
                </span>
              </div>
              <ProgressBar 
                percentage={percentage}
                colorClass={getColorClasses(type.color)}
              />
            </div>
          );
        })}
        
        {outputTypes.length > 3 && (
          <div className="text-center pt-2">
            <span className="text-xs text-blue-600 hover:text-blue-800">
              +{outputTypes.length - 3} more types
            </span>
          </div>
        )}
        
        {outputTypes.length === 0 && (
          <div className="text-center py-4">
            <Hash size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No output types configured</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-blue-200/30">
        <button className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-sm font-light transition-colors">
          + Add today's output
        </button>
      </div>
    </a>
  );
}