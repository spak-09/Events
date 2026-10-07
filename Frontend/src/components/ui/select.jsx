import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({ className, children, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full appearance-none rounded-xl border border-input bg-background px-3 py-1 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <ChevronDown className="h-4 w-4" />
      </div>
      {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';
