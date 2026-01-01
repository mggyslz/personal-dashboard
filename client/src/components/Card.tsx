import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ size?: number }>; // Use React component type
  color: string;
  link: string;
}

export default function StatCard({ label, value, description, icon: Icon, color, link }: StatCardProps) {
  return (
    <a 
      href={link}
      className={`p-4 rounded-2xl border ${color} hover:shadow-sm transition-all hover:scale-[1.02] cursor-pointer block`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-white/50">
          <Icon size={20} />
        </div>
        <span className="text-xs font-medium text-gray-500">
          {label}
        </span>
      </div>
      <div className="text-2xl font-light">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </a>
  );
}
    