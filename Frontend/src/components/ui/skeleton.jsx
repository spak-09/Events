import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'skeleton-shimmer rounded-xl bg-muted/60',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-3/4" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center space-x-4 py-2 border-b border-border/40">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton
              key={c}
              className={cn(
                'h-4',
                c === 0 ? 'w-1/3' : c === cols - 1 ? 'w-16 ml-auto' : 'w-1/4'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
