import React from 'react';

interface ProgressBarProps {
  percentage: number;
  isActive?: boolean;
  gradient?: string;
  colorClass?: string;
}

export default function ProgressBar({ 
  percentage, 
  isActive = false, 
  gradient,
  colorClass 
}: ProgressBarProps) {
  const barStyle = {
    width: `${percentage}%`,
    background: gradient || undefined
  };

  const barClass = colorClass 
    ? colorClass 
    : isActive 
      ? 'bg-indigo-600' 
      : 'bg-indigo-400';

  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 ${barClass}`}
        style={barStyle}
      />
    </div>
  );
}