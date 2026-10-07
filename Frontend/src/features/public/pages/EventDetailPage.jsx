import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Skeleton } from '../../../components/ui/skeleton';
import { EmptyState } from '../../../components/shared/EmptyState';
import apiClient from '../../../lib/axios';
import {
  formatDate,
  formatTime,
  formatCurrency,
  getResourceId,
  getTicketAvailability,
} from '../../../lib/utils';
import { useUiStore } from '../../../stores/uiStore';

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        const [eventRes, ticketsRes, sessionsRes] = await Promise.all([
          apiClient.get(`/events/${id}`),
          apiClient.get(`/events/${id}/tickets`).catch(() => ({ data: { data: [] } })),
          apiClient.get(`/events/${id}/sessions`).catch(() => ({ data: { data: [] } })),
        ]);

        setEvent(eventRes.data?.data || null);
        setTickets(ticketsRes.data?.data || []);
        setSessions(sessionsRes.data?.data || []);
      } catch (err) {
        addToast({
          title: 'Event Not Found',
          description: 'Could not load the requested event details.',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [id, addToast]);

  const eventId = getResourceId(event);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast({
      title: 'Link Copied',
      description: 'Event link copied to clipboard.',
      type: 'success',
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Event Not Found"
          description="The event you are looking for does not exist or has been removed."
          actionLabel="Back to Events"
          onAction={() => navigate('/events')}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 sm:p-10 shadow-soft overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <Badge variant={event.status === 'live' ? 'success' : 'accent'}>
                {event.status === 'live' ? '● Live Now' : event.status}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {event.category || 'Conference'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {event.title}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              {event.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>{formatDate(event.startDate)} – {formatDate(event.endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">
                  {typeof event.venue === 'object' ? event.venue.name : 'Convention Center'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>Max Capacity: {event.capacity} seats</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const el = document.getElementById('ticket-selector-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="gap-1.5 text-xs"
            >
              <Ticket className="h-3.5 w-3.5" />
              Get Passes
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="tickets" className="text-xs gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            Tickets & Passes ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="agenda" className="text-xs gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Agenda Preview ({sessions.length})
          </TabsTrigger>
          <TabsTrigger value="policies" className="text-xs gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Policies & Venue
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" id="ticket-selector-section" className="space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Available Passes</h2>
            <p className="text-xs text-muted-foreground">Select your pass tier to proceed with registration.</p>
          </div>

          {tickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No tickets currently listed"
              description="Pass sales for this event have not opened yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tickets.map((t) => {
                const ticketId = getResourceId(t);
                const availability = getTicketAvailability(t, event.status);

                return (
                  <Card
                    key={ticketId || t.name}
                    className="p-6 flex flex-col justify-between hover:border-primary/50 transition-all shadow-card"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Pass Tier
                        </span>
                        {availability.isWaitlist ? (
                          <Badge variant="warning">Waitlist Only</Badge>
                        ) : availability.canRegister ? (
                          <Badge variant="success">Available</Badge>
                        ) : (
                          <Badge variant="secondary">Unavailable</Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold tracking-tight">{t.name}</h3>
                      <div className="mt-3">
                        <span className="text-3xl font-extrabold text-foreground">
                          {formatCurrency(t.price)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/ attendee</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{availability.reason}</p>

                      <div className="mt-4 space-y-2 text-xs text-muted-foreground pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span>Capacity</span>
                          <span className="font-semibold text-foreground">
                            {t.sold || 0} / {t.capacity} claimed
                          </span>
                        </div>
                        {t.requiresApproval && (
                          <div className="flex items-center gap-1.5 text-amber-500 text-[11px] pt-1">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>Requires organizer approval</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/40">
                      <Button
                        className="w-full text-xs gap-1.5"
                        onClick={() => availability.canRegister && eventId && ticketId && navigate(`/events/${eventId}/register?ticketId=${ticketId}`)}
                        disabled={!availability.canRegister || !eventId || !ticketId}
                      >
                        {availability.isWaitlist ? 'Join Waitlist (FIFO)' : 'Select Pass'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Agenda Tab */}
        <TabsContent value="agenda" className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Scheduled Sessions</h2>
            <p className="text-xs text-muted-foreground">Session lineup curated for this conference.</p>
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Agenda in preparation"
              description="Detailed session schedule will be broadcast prior to the event."
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={getResourceId(session) || session.title} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {session.room || 'Main Hall'}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatTime(session.start)} – {formatTime(session.end)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{session.title}</h4>
                    {session.description && (
                      <p className="text-xs text-muted-foreground max-w-xl line-clamp-1">
                        {session.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {session.track || 'General'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold">Event Policies & Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">Refund Policy</span>
                <p className="text-muted-foreground">{event.policies?.refundPolicy || '50% refund up to 7 days before event.'}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">Code of Conduct</span>
                <p className="text-muted-foreground">{event.policies?.codeOfConduct || 'Zero tolerance for harassment or discrimination.'}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">Age Restrictions</span>
                <p className="text-muted-foreground">Attendee minimum age requirement: {event.policies?.ageRestriction || 18}+</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">Privacy & Broadcasting</span>
                <p className="text-muted-foreground">{event.policies?.privacyPolicy || 'Keynote sessions may be recorded and broadcast live.'}</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
