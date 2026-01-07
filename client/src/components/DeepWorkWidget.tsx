import React from 'react';
import { Timer } from 'lucide-react';

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
  const progressPercentage = getProgressPercentage();
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset = circleCircumference - (progressPercentage / 100) * circleCircumference;

  return (
    <a 
      href="/productivity#deepwork"
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/60 hover:border-gray-300/80 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200/50">
            <Timer size={18} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-800">Deep Work</h3>
            <p className="text-xs text-gray-500 mt-0.5">Focus sprint</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {isActive ? 'Active' : task ? 'Ready' : 'Set task'}
        </span>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            {/* Circular progress background */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r={circleRadius}
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200/60"
                stroke="currentColor"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r={circleRadius}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circleCircumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${isActive ? 'text-indigo-500' : 'text-gray-300'}`}
                stroke="currentColor"
              />
            </svg>
            
            {/* Timer text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-light mb-1 font-mono tracking-tight ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                {timeLeft > 0 ? formatTime(timeLeft) : '--:--'}
              </div>
              <div className={`text-sm ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                {isActive ? 'Time remaining' : task ? 'Ready' : 'No session'}
              </div>
            </div>
          </div>
        </div>
        
        {timeLeft > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-800 mb-2">Current Task</div>
        <p className="text-sm text-gray-600 font-light line-clamp-2 bg-gray-50/50 rounded-xl p-3 border border-gray-200/40">
          {task || 'Click to set a task and start your first sprint...'}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200/40">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>{deepWorkSprints} sprints completed</span>
          </div>
          <div className={`flex items-center gap-1.5 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`} />
            {isActive ? 'Live' : 'Paused'}
          </div>
        </div>
      </div>
    </a>
  );
}