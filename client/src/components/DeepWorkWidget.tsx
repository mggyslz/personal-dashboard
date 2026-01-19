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
  const radius = 60; // SVG circle radius
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 border-2 border-black">
            <Timer size={20} className="text-black" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black">DEEP WORK</h3>
            <p className="text-sm text-gray-600 mt-0.5 font-bold">FOCUS SPRINT</p>
          </div>
        </div>
        <span className={`text-sm font-black px-3 py-1.5 border-2 ${isActive ? 'border-green-500 bg-green-500 text-white' : 'border-black bg-white text-black'}`}>
          {isActive ? 'ACTIVE' : task ? 'READY' : 'SET TASK'}
        </span>
      </div>
      
      {/* Timer Display */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            {/* SVG Circle Progress Indicator */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
              {/* Background Circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
                className="transition-all duration-300"
              />
              {/* Progress Circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Timer Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-black font-mono tracking-tight ${isActive ? 'text-black' : 'text-black'}`}>
                {timeLeft > 0 ? formatTime(timeLeft) : '--:--'}
              </div>
              <div className={`text-sm font-bold ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                {isActive ? 'TIME REMAINING' : task ? 'READY' : 'NO SESSION'}
              </div>
            </div>
          </div>
        </div>
        
        {timeLeft > 0 && (
          <div>
            <div className="flex justify-between text-sm text-black font-bold mb-2">
              <span>PROGRESS</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-gray-200 border-2 border-black overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="text-sm font-black text-black mb-2">CURRENT TASK</div>
        <div className="border-2 border-black bg-gray-50 p-4">
          <p className="text-sm text-black font-bold line-clamp-2">
            {task || 'CLICK TO SET A TASK AND START YOUR FIRST SPRINT...'}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm text-black pt-4 border-t-2 border-black">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black" />
            <span className="font-bold">{deepWorkSprints} SPRINTS COMPLETED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="font-bold">{isActive ? 'LIVE' : 'PAUSED'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}