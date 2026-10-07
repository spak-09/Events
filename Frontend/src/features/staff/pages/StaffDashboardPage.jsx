import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Users, CheckCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { StatCard } from '../../../components/shared/StatCard';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../stores/authStore';
import { useScannerQueueStore } from '../../../stores/scannerQueueStore';

export function StaffDashboardPage() {
  const navigate = useNavigate();
  const { activeEventId, setActiveEventId } = useAuthStore();
  const { queue } = useScannerQueueStore();
  const [events, setEvents] = useState([]);
  const [liveCounters, setLiveCounters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const eventsRes = await apiClient.get('/events');
        const eventItems = eventsRes.data?.data?.items || eventsRes.data?.data || [];
        setEvents(eventItems);

        const currentId = activeEventId || eventItems[0]?._id;
        if (currentId) {
          if (!activeEventId) setActiveEventId(currentId);
          const attRes = await apiClient.get(`/events/${currentId}/attendance/live`);
          setLiveCounters(attRes.data?.data || null);
        }
      } catch (err) {
        // quiet fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeEventId, setActiveEventId]);

  const eventCounters = liveCounters?.eventCounters || {
    totalEligibleRegistrations: 160,
    actualCheckedIn: 90,
    checkInRatePercentage: 56,
    waitlistCount: 25,
  };

  const tasks = [
    { id: 1, title: 'Check VIP badges at Entrance Hall A', done: true, time: '08:30 AM' },
    { id: 2, title: 'Keynote audio/video live broadcast handoff', done: true, time: '09:45 AM' },
    { id: 3, title: 'Stage 2 session capacity gate monitoring', done: false, time: '11:00 AM' },
    { id: 4, title: 'Afternoon sponsor booth scanner synchronization', done: false, time: '02:00 PM' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Event Operations Staff"
        description="Live credential verification, session capacity counters, and floor tasks"
        actions={
          <Button
            onClick={() => navigate('/staff/scanner')}
            className="gap-2 text-xs shadow-md bg-primary"
          >
            <QrCode className="h-4 w-4" />
            Launch Scanner
          </Button>
        }
      />

      {/* Offline Queue Badge Notice */}
      {queue.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{queue.length} scan(s) stored locally in offline queue.</span>
          </div>
          <span className="font-semibold text-[11px]">Auto-syncs on reconnect</span>
        </div>
      )}

      {/* Real-time Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Checked In"
          value={eventCounters.actualCheckedIn}
          trendLabel={`${eventCounters.checkInRatePercentage}% verified`}
          icon={CheckCircle}
        />
        <StatCard
          title="Total Expected"
          value={eventCounters.totalEligibleRegistrations}
          trendLabel="eligible tickets"
          icon={Users}
        />
        <StatCard
          title="Waitlist FIFO"
          value={eventCounters.waitlistCount}
          trendLabel="in queue"
          icon={Clock}
        />
        <StatCard
          title="Check-In Rate"
          value={`${eventCounters.checkInRatePercentage}%`}
          trendLabel="real-time"
          icon={ShieldCheck}
        />
      </div>

      {/* Scanner Launch Card */}
      <Card
        onClick={() => navigate('/staff/scanner')}
        className="p-6 cursor-pointer border-primary/40 hover:border-primary transition-all bg-gradient-to-r from-primary/5 via-card to-card flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card"
      >
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <QrCode className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">One-Hand Mobile QR Scanner</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Full-screen camera scanning with instant result states: ✓ Checked in / ⚠ Already in / ✕ Invalid.
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0">
          Open Scanner <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Card>

      {/* Venue Notes & Assigned Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs font-semibold text-foreground">Operational Tasks</span>
            <Badge variant="outline" className="text-[10px]">Today</Badge>
          </div>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2.5 p-2 rounded-xl border border-border/50 bg-muted/20 text-xs"
              >
                <div
                  className={`mt-0.5 h-3.5 w-3.5 rounded-md border flex items-center justify-center ${
                    task.done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                  }`}
                >
                  {task.done && <CheckCircle className="h-3 w-3 stroke-[3]" />}
                </div>
                <div className="flex-1">
                  <span className={task.done ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}>
                    {task.title}
                  </span>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{task.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-xs font-semibold text-foreground">Floor Notes & Emergency Contacts</span>
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <span className="font-semibold text-foreground block mb-0.5">WiFi SSID & Ops Backplane</span>
              <p className="font-mono text-[11px]">SSID: EventForge-Ops • Key: ef_secure_2026</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <span className="font-semibold text-foreground block mb-0.5">Medical / Security Radio</span>
              <p>Channel 4 on portable radios. On-site EMT located at Level 1 Room 102.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
