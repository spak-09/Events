import React, { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useScannerQueueStore } from '../stores/scannerQueueStore';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

export function Providers({ children }) {
  const { theme, setTheme } = useUiStore();
  const { checkAuth } = useAuthStore();
  const { setOnlineStatus, syncQueue } = useScannerQueueStore();

  useEffect(() => {
    // Sync theme class with document
    const savedTheme = localStorage.getItem('ef_theme') || 'dark';
    setTheme(savedTheme);

    // Initial auth check
    checkAuth();

    // Setup network listeners
    const handleOnline = () => {
      setOnlineStatus(true);
      syncQueue();
    };
    const handleOffline = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setTheme, checkAuth, setOnlineStatus, syncQueue]);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
