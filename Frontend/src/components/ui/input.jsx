import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({ className, type, icon: Icon, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          Icon && 'pl-9',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <span className="text-xs text-destructive mt-1 block">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
