import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }) {
  const [activeTab, setActiveTab] = useState(defaultValue || '');
  const currentTab = value !== undefined ? value : activeTab;

  const handleTabChange = (val) => {
    if (value === undefined) {
      setActiveTab(val);
    }
    if (onValueChange) {
      onValueChange(val);
    }
  };

  return (
    <TabsContext.Provider value={{ currentTab, changeTab: handleTabChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xl bg-muted/70 p-1 text-muted-foreground border border-border/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const { currentTab, changeTab } = useContext(TabsContext);
  const isActive = currentTab === value;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none',
        isActive
          ? 'bg-background text-foreground shadow-sm font-semibold'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
        className
      )}
      onClick={() => changeTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const { currentTab } = useContext(TabsContext);
  if (currentTab !== value) return null;

  return (
    <div
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
