import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export function Stepper({ steps = [], currentStep = 0, onStepClick, className }) {
  return (
    <div className={cn('w-full py-4', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <React.Fragment key={step.id || idx}>
              <div
                className={cn(
                  'flex items-center gap-2 select-none',
                  onStepClick && isCompleted && 'cursor-pointer'
                )}
                onClick={() => onStepClick && isCompleted && onStepClick(idx)}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-xl text-xs font-semibold transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'border-2 border-primary bg-primary/10 text-primary',
                    !isCompleted && !isCurrent && 'border border-border bg-muted/40 text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : idx + 1}
                </div>
                <div className="hidden sm:block text-left">
                  <div
                    className={cn(
                      'text-xs font-medium tracking-tight',
                      isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-[10px] text-muted-foreground/80">{step.description}</div>
                  )}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-3 rounded-full transition-all',
                    idx < currentStep ? 'bg-primary' : 'bg-border/60'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
