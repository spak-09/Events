import React from 'react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  title,
  value,
  trend,
  trendDirection = 'up',
  trendLabel,
  icon: Icon,
  className,
}) {
  return (
    <Card className={cn('p-5 flex flex-col justify-between hover:border-border/80 transition-all', className)}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium tracking-tight uppercase">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-muted/60 text-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {(trend !== undefined || trendLabel) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {trend !== undefined && (
              <span
                className={cn(
                  'flex items-center font-medium',
                  trendDirection === 'up' ? 'text-emerald-500' : 'text-rose-500'
                )}
              >
                {trendDirection === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {trend}
              </span>
            )}
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
