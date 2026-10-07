import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Clock, Calendar, MapPin, Upload, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../stores/authStore';
import { formatDate, formatTime } from '../../../lib/utils';

export function SpeakerDashboardPage() {
  const navigate = useNavigate();
  const { user, activeEventId } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSpeakerSessions = async () => {
      setIsLoading(true);
      try {
        const eventIdToQuery = activeEventId || 'all';
        const endpoint = eventIdToQuery !== 'all'
          ? `/events/${eventIdToQuery}/sessions`
          : '/events';
        const res = await apiClient.get(endpoint);
        const allSessions = res.data?.data || [];
        setSessions(allSessions.slice(0, 5)); // Curated preview
      } catch (err) {
        // quiet fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpeakerSessions();
  }, [activeEventId]);

  const nextSession = sessions[0] || {
    title: 'Scaling Distributed Inference & KV Caching',
    room: 'Grand Ballroom',
    track: 'Engineering',
    start: '2026-11-20T10:00:00Z',
    end: '2026-11-20T11:00:00Z',
    capacity: 500,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Speaker Hub"
        description="Keynote schedule, session timelines, and presentation slide deck management"
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/speaker/materials')}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Materials
          </Button>
        }
      />

      {/* Next Up Session Hero Banner */}
      <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="accent" className="gap-1 font-mono text-[10px]">
            <Sparkles className="h-3 w-3" /> Next Up on Stage
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            {formatDate(nextSession.start)}
          </span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground">{nextSession.title}</h2>
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{formatTime(nextSession.start)} – {formatTime(nextSession.end)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{nextSession.room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">{nextSession.track}</Badge>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => navigate('/speaker/materials')}
            className="text-xs gap-1.5"
          >
            Manage Slide Deck
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/speaker/profile')}
            className="text-xs"
          >
            Edit Speaker Profile
          </Button>
        </div>
      </Card>

      {/* My Sessions Timeline */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold tracking-tight">Presentation Timeline</h3>
          <p className="text-xs text-muted-foreground">Chronological schedule of your keynote and panel sessions.</p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80">
          {sessions.map((sess, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary shadow-xs" />

              <Card className="p-5 hover:border-primary/50 transition-all shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {sess.room || 'Main Hall'}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTime(sess.start)} – {formatTime(sess.end)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] self-start sm:self-auto">
                    {sess.track || 'Track'}
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-foreground">{sess.title}</h4>
                {sess.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {sess.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Hall Capacity: {sess.capacity || 250} seats
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/speaker/materials')}
                    className="text-xs h-7 px-2 gap-1 text-primary"
                  >
                    Deck Upload <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
