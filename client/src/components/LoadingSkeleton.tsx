import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200/50 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200/50 rounded w-1/2"></div>
          <div className="flex gap-4 pt-4">
            <div className="h-16 bg-gray-200/50 rounded w-1/4"></div>
            <div className="h-16 bg-gray-200/50 rounded w-1/4"></div>
            <div className="h-16 bg-gray-200/50 rounded w-1/4"></div>
            <div className="h-16 bg-gray-200/50 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="lg:col-span-4">
            <div className="h-full backdrop-blur-xl bg-gradient-to-br from-white/80 to-white/40 rounded-3xl p-8 shadow-lg shadow-black/5">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200/50 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200/50 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}