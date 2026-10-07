import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Calendar, ArrowRight, Shield, QrCode, Cpu, Users, Layers, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import apiClient from '../../../lib/axios';
import { formatDate, getResourceId } from '../../../lib/utils';
import { SkeletonCard } from '../../../components/ui/skeleton';

export function LandingPage() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/events?limit=4');
        const items = res.data?.data?.items || res.data?.data || [];
        setFeaturedEvents(items);
      } catch (err) {
        // quiet fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Gen Enterprise Event Orchestration</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
          Engineered for high-stakes conferences & summits.
        </h1>

        <p className="mt-5 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Dual-layer RBAC, atomic capacity controls, 4-point conflict detection scheduling, and offline-tolerant QR check-ins.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => navigate('/events')}
            className="gap-2 text-sm shadow-md"
          >
            Explore Conferences
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/login')}
            className="text-sm"
          >
            Access Role Portals
          </Button>
        </div>

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-8 border-t border-border/50 text-left">
          <div className="p-4 rounded-2xl bg-card border border-border/70">
            <div className="text-2xl font-bold tracking-tight text-primary">6 Roles</div>
            <div className="text-xs text-muted-foreground mt-0.5">Admin to Attendee</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/70">
            <div className="text-2xl font-bold tracking-tight text-foreground">4-Point</div>
            <div className="text-xs text-muted-foreground mt-0.5">Conflict Rejection</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/70">
            <div className="text-2xl font-bold tracking-tight text-foreground">Zero Drop</div>
            <div className="text-xs text-muted-foreground mt-0.5">Offline Scanner Queue</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/70">
            <div className="text-2xl font-bold tracking-tight text-foreground">FIFO</div>
            <div className="text-xs text-muted-foreground mt-0.5">Auto-Waitlist Engine</div>
          </div>
        </div>
      </section>

      {/* Featured Conferences */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Active & Upcoming Summits</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Live events open for registration and credentialing</p>
          </div>
          <Link to="/events">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-foreground">No Published Events Currently</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Conferences and summits will appear here once published by organizers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((evt) => {
              const eventId = getResourceId(evt);

              return (
              <Card
                key={eventId || evt.title}
                className="overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between group"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={evt.status === 'live' ? 'success' : 'accent'}>
                      {evt.status === 'live' ? '● Live Now' : evt.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {formatDate(evt.startDate)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {evt.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {evt.tags?.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Capacity: <span className="font-semibold text-foreground">{evt.capacity}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => eventId && navigate(`/events/${eventId}`)}
                    className="text-xs gap-1"
                    disabled={!eventId}
                  >
                    View Passes
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Role Architecture Matrix Preview */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-soft">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl font-bold tracking-tight">Enterprise Role Portals</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Purpose-built user interfaces for every stakeholder in the event lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-border/70 bg-background/50 hover:bg-muted/40 transition-all">
              <Shield className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Platform Admin</div>
              <div className="text-xs text-muted-foreground mt-1">Tenant isolation, org suspension, global policies.</div>
            </div>
            <div className="p-5 rounded-2xl border border-border/70 bg-background/50 hover:bg-muted/40 transition-all">
              <Calendar className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Organizer Workspace</div>
              <div className="text-xs text-muted-foreground mt-1">Time × room grid, conflict checks, waitlist FIFO.</div>
            </div>
            <div className="p-5 rounded-2xl border border-border/70 bg-background/50 hover:bg-muted/40 transition-all">
              <QrCode className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Staff Check-in</div>
              <div className="text-xs text-muted-foreground mt-1">One-hand mobile scanner, offline sync queue.</div>
            </div>
            <div className="p-5 rounded-2xl border border-border/70 bg-background/50 hover:bg-muted/40 transition-all">
              <Cpu className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Speaker Portal</div>
              <div className="text-xs text-muted-foreground mt-1">Session timeline, AI bio generator, deck uploads.</div>
            </div>
            <div className="p-5 rounded-2xl border border-border/70 bg-background/50 hover:bg-muted/40 transition-all">
              <Users className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Attendee Suite</div>
              <div className="text-xs text-muted-foreground mt-1">Digital QR pass, agenda builder, feedback reviews.</div>
            </div>
            <div className="p-5 rounded-2xl border border-border/70 bg-background/50 hover:bg-muted/40 transition-all">
              <Layers className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Sponsor Hub</div>
              <div className="text-xs text-muted-foreground mt-1">Tier benefits, deliverable tracking, lead telemetry.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
