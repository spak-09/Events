import React, { useState, useEffect, useRef } from 'react';
import { Bell, Megaphone, Check } from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../lib/utils';

export function NotificationsBell() {
  const { activeEventId } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!activeEventId) return;

    const fetchAnnouncements = async () => {
      try {
        const res = await apiClient.get(`/events/${activeEventId}/announcements`);
        const items = res.data?.data?.items || res.data?.data || [];
        setAnnouncements(items);
        setUnreadCount(items.length);
      } catch (err) {
        // quiet fail
      }
    };

    fetchAnnouncements();
  }, [activeEventId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="relative rounded-xl p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-elevated z-50 text-card-foreground">
          <div className="flex items-center justify-between pb-2 border-b border-border/50 px-1">
            <span className="text-xs font-semibold tracking-tight">Announcements</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {announcements.length} updates
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-border/30 mt-1">
            {announcements.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No recent announcements
              </div>
            ) : (
              announcements.map((item) => (
                <div key={item._id || item.id} className="py-2.5 px-1">
                  <div className="flex items-start gap-2">
                    <Megaphone className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {item.message || item.content}
                      </div>
                      <div className="text-[9px] text-muted-foreground/80 mt-1">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
