import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Users, Ticket, ArrowRight, Clock, MapPin, Sparkles } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { StatCard } from '../../../components/shared/StatCard';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { SkeletonCard } from '../../../components/ui/skeleton';
import { EmptyState } from '../../../components/shared/EmptyState';
import apiClient from '../../../lib/axios';
import { formatDate, getResourceId } from '../../../lib/utils';
import { useAuthStore } from '../../../stores/authStore';

export function OrganizerDashboardPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { setActiveEventId } = useAuthStore();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/events');
        const items = res.data?.data?.items || res.data?.data || [];
        setEvents(items);
      } catch (err) {
        // quiet fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleOpenWorkspace = (evt) => {
    const eventId = getResourceId(evt);
    if (!eventId) return;

    setActiveEventId(eventId);
    navigate(`/organizer/events/${eventId}/workspace`);
  };

  const liveCount = events.filter((e) => e.status === 'live').length;
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organizer Workspace"
        description="Oversee event lifecycles, agendas, ticket sales, registrations, and staff"
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/organizer/create-event')}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Event
          </Button>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Events"
          value={events.length}
          trendLabel="in catalog"
          icon={Calendar}
        />
        <StatCard
          title="Live Summits"
          value={liveCount}
          trendLabel="real-time check-in active"
          icon={Clock}
        />
        <StatCard
          title="Published Summits"
          value={publishedCount}
          trendLabel="open for booking"
          icon={Ticket}
        />
        <StatCard
          title="Total Seat Capacity"
          value={totalCapacity.toLocaleString()}
          trendLabel="across venues"
          icon={Users}
        />
      </div>

      {/* Events Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight">Managed Events</h2>
            <p className="text-xs text-muted-foreground">Select an event to enter its operational workspace.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events created yet"
            description="Launch your first corporate event or conference."
            actionLabel="Create Event"
            onAction={() => navigate('/organizer/create-event')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const eventId = getResourceId(evt);

              return (
              <Card
                key={eventId || evt.title}
                className="overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between group shadow-card"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge
                      variant={
                        evt.status === 'live'
                          ? 'success'
                          : evt.status === 'published'
                          ? 'accent'
                          : evt.status === 'completed'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="capitalize"
                    >
                      {evt.status === 'live' ? '● Live' : evt.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDate(evt.startDate)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="space-y-2 mt-6 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {typeof evt.venue === 'object' ? evt.venue.name : 'Moscone Center'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Capacity: {evt.capacity} attendees</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-border/40 mt-2 flex items-center justify-between">
                  <Button
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => handleOpenWorkspace(evt)}
                    disabled={!eventId}
                  >
                    Open Workspace
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
