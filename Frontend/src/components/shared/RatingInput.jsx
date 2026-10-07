import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RatingInput({ value = 0, onChange, max = 5, size = 'md', className }) {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const rating = i + 1;
        const isFilled = rating <= (hoverValue || value);

        return (
          <button
            key={i}
            type="button"
            className="p-0.5 text-muted-foreground hover:scale-110 transition-transform focus:outline-none"
            onClick={() => onChange && onChange(rating)}
            onMouseEnter={() => setHoverValue(rating)}
            onMouseLeave={() => setHoverValue(0)}
          >
            <Star
              className={cn(
                starSizes[size] || starSizes.md,
                'transition-colors',
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30 hover:text-amber-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
