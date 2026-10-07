import React from 'react';
import { cn } from '../../lib/utils';

export function ProgressBar({ value = 0, max = 100, className, barClassName }) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary/80',
        className
      )}
    >
      <div
        className={cn('h-full bg-primary transition-all duration-300 rounded-full', barClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function ProgressRing({ percentage = 0, size = 64, strokeWidth = 6, className }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      <span className="absolute text-xs font-semibold">{Math.round(percentage)}%</span>
    </div>
  );
}
