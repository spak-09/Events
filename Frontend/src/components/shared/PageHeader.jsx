import React from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({ title, description, badge, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40 mb-6',
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 self-start md:self-auto">{actions}</div>}
    </div>
  );
}
