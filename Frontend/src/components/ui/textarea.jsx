import React from 'react';
import { cn } from '../../lib/utils';

export const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
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

Textarea.displayName = 'Textarea';
