import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 bg-slate-200 rounded-md w-1/4" />
          <div className="h-4 bg-slate-200 rounded-md w-1/3" />
          <div className="h-4 bg-slate-200 rounded-md w-1/6" />
          <div className="h-4 bg-slate-200 rounded-md w-1/5" />
        </div>
      ))}
    </div>
  );
};
