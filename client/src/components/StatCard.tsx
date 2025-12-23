import { ReactNode } from 'react';

interface StatCardProps {
  value: number;
  label: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'gray';
  icon?: ReactNode;
  isLoading?: boolean;
}

export default function StatCard({ value, label, color, icon, isLoading = false }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }[color];

  if (isLoading) {
    return (
      <div className="px-4 py-3 rounded-xl border bg-gray-50/50 animate-pulse">
        <div className="h-7 bg-gray-200/50 rounded w-12 mb-2"></div>
        <div className="h-4 bg-gray-200/50 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-3 rounded-xl border ${colorClasses} hover:shadow-sm transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-light">{value}</div>
          <div className="text-xs font-medium opacity-80">{label}</div>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-white/50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}