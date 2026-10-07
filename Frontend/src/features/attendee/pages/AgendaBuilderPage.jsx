import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Star,
  Plus,
  Trash2,
  Send,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Textarea } from '../../../components/ui/textarea';
import { RatingInput } from '../../../components/shared/RatingInput';
import { Skeleton } from '../../../components/ui/skeleton';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { formatTime } from '../../../lib/utils';

export function AgendaBuilderPage() {
  const { activeEventId } = useAuthStore();
  const { addToast } = useUiStore();

  const [sessions, setSessions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState(
    JSON.parse(localStorage.getItem('ef_my_agenda') || '[]')
  );
  const [isLoading, setIsLoading] = useState(true);

  // Overlap warning state
  const [overlapWarning, setOverlapWarning] = useState(null);

  // Feedback Modal State
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const eventsRes = await apiClient.get('/events');
        const evts = eventsRes.data?.data?.items || eventsRes.data?.data || [];
        const eventId = activeEventId || evts[0]?._id;

        if (eventId) {
          const [sessRes, recRes] = await Promise.all([
            apiClient.get(`/events/${eventId}/sessions`),
            apiClient.get(`/events/${eventId}/recommendations?limit=4`).catch(() => ({ data: { data: [] } })),
          ]);

          setSessions(sessRes.data?.data || []);
          setRecommendations(recRes.data?.data || []);
        }
      } catch (err) {
        // quiet fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeEventId]);

  // Check for time overlaps among selected sessions
  const checkOverlaps = (currentIds, newSession) => {
    const chosen = sessions.filter((s) => currentIds.includes(s._id));
    for (const item of chosen) {
      if (item._id === newSession._id) continue;
      const startA = new Date(item.start).getTime();
      const endA = new Date(item.end).getTime();
      const startB = new Date(newSession.start).getTime();
      const endB = new Date(newSession.end).getTime();

      // Check collision: max(startA, startB) < min(endA, endB)
      if (Math.max(startA, startB) < Math.min(endA, endB)) {
        return `Overlap detected: "${newSession.title}" conflicts with already picked session "${item.title}".`;
      }
    }
    return null;
  };

  const handleToggleSession = (session) => {
    const isSelected = selectedSessionIds.includes(session._id);
    let updated;

    if (isSelected) {
      updated = selectedSessionIds.filter((id) => id !== session._id);
      setOverlapWarning(null);
    } else {
      const conflictMsg = checkOverlaps(selectedSessionIds, session);
      if (conflictMsg) {
        setOverlapWarning(conflictMsg);
      } else {
        setOverlapWarning(null);
      }
      updated = [...selectedSessionIds, session._id];
    }

    setSelectedSessionIds(updated);
    localStorage.setItem('ef_my_agenda', JSON.stringify(updated));
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackSession) return;
    setIsSubmittingFeedback(true);
    try {
      const evId = activeEventId || sessions[0]?.event || '660c1bf6e4b0123456789002';
      await apiClient.post(`/events/${evId}/feedback`, {
        sessionId: feedbackSession._id,
        rating,
        comment,
      });
      addToast({
        title: 'Feedback Recorded',
        description: 'Thank you for rating this session!',
        type: 'success',
      });
      setFeedbackSession(null);
      setComment('');
      setRating(5);
    } catch (err) {
      addToast({
        title: 'Submission Failed',
        description: err.response?.data?.error?.message || 'Could not save review',
        type: 'error',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <PageHeader
        title="Personalized Agenda Builder"
        description="Curate your conference itinerary with real-time overlap warnings and AI recommendations"
      />

      {/* Instant Overlap Warning Banner */}
      {overlapWarning && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1 font-medium">{overlapWarning}</div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOverlapWarning(null)}
            className="text-[10px] h-6 px-2 text-amber-600"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* "For You" Recommendations Banner */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold tracking-tight">Recommended For You</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => {
              const sess = rec.session || {};
              const isSelected = selectedSessionIds.includes(sess.id || sess._id);

              return (
                <Card
                  key={idx}
                  className="p-5 flex flex-col justify-between border-primary/20 bg-primary/5 shadow-card"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="accent" className="text-[10px]">
                        Match Score: {rec.score}%
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {sess.track || 'Track'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground">{sess.title}</h4>
                    <p className="text-[11px] text-primary/80 mt-1 font-medium line-clamp-2">
                      💡 {rec.why}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Tags: {sess.tags?.join(', ')}
                    </span>
                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleToggleSession(sess)}
                      className="text-xs h-7 px-2.5 gap-1"
                    >
                      {isSelected ? <CheckCircle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {isSelected ? 'Added' : 'Add Session'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete Session Catalog */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Conference Schedule & Sessions</h3>
            <p className="text-xs text-muted-foreground">
              {selectedSessionIds.length} session(s) chosen for your personal agenda.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => {
            const isSelected = selectedSessionIds.includes(session._id);

            return (
              <Card
                key={session._id}
                className={`p-5 transition-all shadow-card ${
                  isSelected ? 'border-primary/60 bg-primary/5' : 'hover:border-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {session.room || 'Main Hall'}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatTime(session.start)} – {formatTime(session.end)}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {session.track || 'Track'}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-foreground">{session.title}</h4>
                    {session.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
                        {session.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFeedbackSession(session)}
                      className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Rate
                    </Button>

                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleToggleSession(session)}
                      className="text-xs h-8 gap-1.5"
                    >
                      {isSelected ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {isSelected ? 'In Agenda' : 'Add to Agenda'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Feedback Rating Modal */}
      <Modal
        isOpen={!!feedbackSession}
        onClose={() => setFeedbackSession(null)}
        title="Session Feedback & Rating"
        description={`Rate your experience for ${feedbackSession?.title || ''}.`}
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4 pt-2">
          <div className="space-y-2 text-center py-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase block">
              Overall Rating
            </span>
            <RatingInput value={rating} onChange={(val) => setRating(val)} size="lg" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Comments & Key Takeaways (Optional)</label>
            <Textarea
              rows={3}
              placeholder="What did you think of the presentation, technical depth, or benchmarks?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFeedbackSession(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingFeedback}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {isSubmittingFeedback ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
