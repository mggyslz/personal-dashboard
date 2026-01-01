import React from 'react';
import { Timer, Clock as ClockIcon } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface DeepWorkWidgetProps {
  timeLeft: number;
  isActive: boolean;
  task: string | null;
  formatTime: (seconds: number) => string;
  getProgressPercentage: () => number;
  deepWorkSprints: number;
}

export default function DeepWorkWidget({
  timeLeft,
  isActive,
  task,
  formatTime,
  getProgressPercentage,
  deepWorkSprints
}: DeepWorkWidgetProps) {
  return (
    <a 
      href="/productivity#deepwork"
      className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 rounded-3xl p-6 border border-indigo-200/50 hover:border-indigo-300/50 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Timer size={18} className="text-indigo-600" />
          </div>
          <h3 className="text-lg font-light text-gray-700">Deep Work Sprint</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
          {isActive ? 'ACTIVE' : task ? 'READY' : 'SET TASK'}
        </span>
      </div>
      
      <div className="mb-4">
        <div className={`text-center py-6 rounded-2xl ${isActive ? 'bg-indigo-100/50 border border-indigo-200/50' : 'bg-gray-100/50 border border-gray-200/50'}`}>
          <div className="text-5xl font-light text-indigo-700 mb-2 font-mono">
            {timeLeft > 0 ? formatTime(timeLeft) : '--:--'}
          </div>
          <div className={`text-sm ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
            {isActive ? 'Time remaining' : task ? 'Session ready' : 'No active session'}
          </div>
        </div>
        
        {timeLeft > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <ProgressBar 
              percentage={getProgressPercentage()} 
              isActive={isActive}
              gradient={isActive ? 'linear-gradient(90deg, #4f46e5, #7c3aed)' : '#818cf8'}
            />
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-700">Current Task</span>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="/productivity#deepwork"
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ClockIcon size={16} />
            </a>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 font-light truncate px-1">
          {task || 'Click to set a task and start your first sprint...'}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200/50">
          <div className="flex items-center gap-1">
            <Timer size={12} />
            <span>{deepWorkSprints} sprints completed</span>
          </div>
          <div className={`flex items-center gap-1 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`} />
          </div>
        </div>
      </div>
    </a>
  );
}