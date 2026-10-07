import { create } from 'zustand';
import apiClient from '../lib/axios';

export const useScannerQueueStore = create((set, get) => ({
  queue: JSON.parse(localStorage.getItem('ef_scanner_queue') || '[]'),
  recentScans: JSON.parse(localStorage.getItem('ef_recent_scans') || '[]'),
  isSyncing: false,
  isOnline: navigator.onLine,

  setOnlineStatus: (status) => {
    set({ isOnline: status });
    if (status) {
      get().syncQueue();
    }
  },

  enqueueScan: async ({ type, eventId, sessionId, qrToken, attendeeInfo }) => {
    const scanItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      type, // 'event' or 'session'
      eventId,
      sessionId,
      qrToken,
      attendeeInfo: attendeeInfo || { name: 'Attendee', email: qrToken.substring(0, 8) + '...' },
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    // Optimistic scan entry in recentScans
    const optimisticScan = {
      ...scanItem,
      status: 'success',
      optimistic: true,
      message: type === 'session' ? 'Session scan queued' : 'Event check-in queued',
    };

    const updatedRecent = [optimisticScan, ...get().recentScans.slice(0, 49)];
    localStorage.setItem('ef_recent_scans', JSON.stringify(updatedRecent));
    set({ recentScans: updatedRecent });

    // If online, attempt direct submit
    if (navigator.onLine) {
      try {
        const endpoint = type === 'session' ? '/checkin/session' : '/checkin/event';
        const payload = type === 'session' 
          ? { eventId, sessionId, qrToken } 
          : { eventId, qrToken };
        
        const res = await apiClient.post(endpoint, payload);
        const data = res.data?.data;

        // Update optimistic item with real backend response
        const verifiedScan = {
          ...scanItem,
          status: data?.alreadyCheckedIn ? 'already' : 'success',
          alreadyCheckedIn: !!data?.alreadyCheckedIn,
          message: data?.message || (data?.alreadyCheckedIn ? 'Already checked in' : 'Checked in successfully'),
          optimistic: false,
          serverTimestamp: data?.checkedInAt,
        };

        const finalRecent = get().recentScans.map((s) => (s.id === scanItem.id ? verifiedScan : s));
        localStorage.setItem('ef_recent_scans', JSON.stringify(finalRecent));
        set({ recentScans: finalRecent });

        return {
          success: true,
          status: data?.alreadyCheckedIn ? 'already' : 'success',
          message: verifiedScan.message,
          data,
        };
      } catch (err) {
        if (!navigator.onLine || err.message === 'Network Error') {
          // Store in offline queue
          const updatedQueue = [...get().queue, scanItem];
          localStorage.setItem('ef_scanner_queue', JSON.stringify(updatedQueue));
          set({ queue: updatedQueue });
          return {
            success: true,
            status: 'queued',
            message: 'Saved offline. Will sync when connected.',
            isQueued: true,
          };
        }

        const errMsg = err.response?.data?.error?.message || 'Invalid QR code or registration';
        const failedScan = {
          ...scanItem,
          status: 'error',
          message: errMsg,
          optimistic: false,
        };
        const failedRecent = get().recentScans.map((s) => (s.id === scanItem.id ? failedScan : s));
        localStorage.setItem('ef_recent_scans', JSON.stringify(failedRecent));
        set({ recentScans: failedRecent });

        return {
          success: false,
          status: 'error',
          message: errMsg,
        };
      }
    } else {
      // Offline: append to queue
      const updatedQueue = [...get().queue, scanItem];
      localStorage.setItem('ef_scanner_queue', JSON.stringify(updatedQueue));
      set({ queue: updatedQueue });

      return {
        success: true,
        status: 'queued',
        message: 'Saved offline. Will sync when connected.',
        isQueued: true,
      };
    }
  },

  syncQueue: async () => {
    const queue = get().queue;
    if (queue.length === 0 || get().isSyncing) return;

    set({ isSyncing: true });
    const remainingQueue = [];

    for (const item of queue) {
      try {
        const endpoint = item.type === 'session' ? '/checkin/session' : '/checkin/event';
        const payload = item.type === 'session' 
          ? { eventId: item.eventId, sessionId: item.sessionId, qrToken: item.qrToken }
          : { eventId: item.eventId, qrToken: item.qrToken };
        
        await apiClient.post(endpoint, payload);
      } catch (err) {
        if (!navigator.onLine) {
          remainingQueue.push(item);
        }
      }
    }

    localStorage.setItem('ef_scanner_queue', JSON.stringify(remainingQueue));
    set({ queue: remainingQueue, isSyncing: false });
  },

  clearRecentScans: () => {
    localStorage.removeItem('ef_recent_scans');
    set({ recentScans: [] });
  },
}));
