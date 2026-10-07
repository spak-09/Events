import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 my-4',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-normal">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
