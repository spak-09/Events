import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Briefcase,
  Ticket,
  Megaphone,
  BarChart2,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { OverviewTab } from '../components/OverviewTab';
import { ScheduleGridTab } from '../components/ScheduleGridTab';
import { VenuesTab } from '../components/VenuesTab';
import { SpeakersTab } from '../components/SpeakersTab';
import { SponsorsTab } from '../components/SponsorsTab';
import { RegistrationsTab } from '../components/RegistrationsTab';
import { TeamTab } from '../components/TeamTab';
import { AnnouncementsTab } from '../components/AnnouncementsTab';
import { AnalyticsTab } from '../components/AnalyticsTab';
import apiClient from '../../../lib/axios';
import { getResourceId } from '../../../lib/utils';
import { useUiStore } from '../../../stores/uiStore';
import { useAuthStore } from '../../../stores/authStore';

export function EventWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const { setActiveEventId } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvent = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/events/${id}`);
      const evt = res.data?.data;
      setEvent(evt);
      const eventId = getResourceId(evt);
      if (eventId) {
        setActiveEventId(eventId);
      }
    } catch (err) {
      addToast({
        title: 'Error Loading Workspace',
        description: err.response?.data?.error?.message || 'Event not found',
        type: 'error',
      });
      navigate('/organizer');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (!event) return null;

  const eventId = getResourceId(event);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/organizer')}
            className="text-muted-foreground gap-1.5 text-xs h-8 px-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Events Hub
          </Button>
          <div className="h-4 w-px bg-border/80" />
          <h1 className="text-xl font-bold tracking-tight text-foreground truncate max-w-md">
            {event.title}
          </h1>
          <Badge
            variant={
              event.status === 'live'
                ? 'success'
                : event.status === 'published'
                ? 'accent'
                : 'secondary'
            }
            className="capitalize"
          >
            {event.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => eventId && navigate(`/events/${eventId}`)}
            className="text-xs gap-1.5"
            disabled={!eventId}
          >
            Public Page
          </Button>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/60 p-1 rounded-2xl inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="overview" className="text-xs gap-1.5 px-3">
              Overview
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs gap-1.5 px-3">
              <Clock className="h-3.5 w-3.5" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="registrations" className="text-xs gap-1.5 px-3">
              <Ticket className="h-3.5 w-3.5" />
              Registrations
            </TabsTrigger>
            <TabsTrigger value="venues" className="text-xs gap-1.5 px-3">
              <MapPin className="h-3.5 w-3.5" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="speakers" className="text-xs gap-1.5 px-3">
              <Users className="h-3.5 w-3.5" />
              Speakers
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="text-xs gap-1.5 px-3">
              <Briefcase className="h-3.5 w-3.5" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs gap-1.5 px-3">
              <Users className="h-3.5 w-3.5" />
              Team
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs gap-1.5 px-3">
              <Megaphone className="h-3.5 w-3.5" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1.5 px-3">
              <BarChart2 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Panels */}
        <TabsContent value="overview">
          <OverviewTab event={event} onRefresh={fetchEvent} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleGridTab eventId={eventId} event={event} />
        </TabsContent>

        <TabsContent value="registrations">
          <RegistrationsTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="venues">
          <VenuesTab eventId={eventId} event={event} />
        </TabsContent>

        <TabsContent value="speakers">
          <SpeakersTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="sponsors">
          <SponsorsTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="announcements">
          <AnnouncementsTab eventId={eventId} eventTitle={event.title} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
