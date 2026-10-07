import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';

export function ConflictAlert({ conflicts = [], message }) {
  if (!conflicts.length && !message) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Scheduling Conflict Detected</span>
      </div>
      {message && <div className="mt-1 text-destructive/90">{message}</div>}
      {conflicts.length > 0 && (
        <ul className="mt-2 space-y-1 list-disc list-inside">
          {conflicts.map((c, i) => (
            <li key={i} className="text-[11px] leading-relaxed">
              <span className="font-semibold uppercase tracking-wider text-[10px] mr-1">
                [{c.type || 'CONFLICT'}]
              </span>
              {c.message || JSON.stringify(c)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
