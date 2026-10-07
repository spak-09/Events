import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Copy,
  Globe,
  Users,
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatDate, formatTime, getResourceId } from '../../../lib/utils';

export function OverviewTab({ event, onRefresh }) {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const eventId = getResourceId(event);

  const handlePublish = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/events/${eventId}/publish`);
      addToast({
        title: 'Event Published',
        description: 'Event is now public and accepting registrations.',
        type: 'success',
      });
      onRefresh();
    } catch (err) {
      addToast({
        title: 'Publish Failed',
        description: err.response?.data?.error?.message || 'Could not publish event',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/events/${eventId}/cancel`, { reason: cancelReason });
      addToast({
        title: 'Event Cancelled',
        description: 'Event has been marked cancelled.',
        type: 'warning',
      });
      setIsCancelModalOpen(false);
      onRefresh();
    } catch (err) {
      addToast({
        title: 'Cancel Failed',
        description: err.response?.data?.error?.message || 'Could not cancel event',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async () => {
    setIsProcessing(true);
    try {
      const res = await apiClient.post(`/events/${eventId}/duplicate`);
      const newEvt = res.data?.data;
      const newEventId = getResourceId(newEvt);
      addToast({
        title: 'Event Duplicated',
        description: 'Created a new draft event from this workspace.',
        type: 'success',
      });
      if (newEventId) {
        navigate(`/organizer/events/${newEventId}/workspace`);
      }
    } catch (err) {
      addToast({
        title: 'Duplicate Failed',
        description: err.response?.data?.error?.message || 'Could not duplicate event',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Lifecycle Control Banner */}
      <Card className="p-6 border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Lifecycle State
              </span>
              <Badge
                variant={
                  event.status === 'live'
                    ? 'success'
                    : event.status === 'published'
                    ? 'accent'
                    : event.status === 'completed'
                    ? 'secondary'
                    : event.status === 'cancelled'
                    ? 'destructive'
                    : 'outline'
                }
                className="capitalize"
              >
                {event.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current status determines registration visibility and QR scanner check-in readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {event.status === 'draft' && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isProcessing}
                className="gap-1.5 text-xs"
              >
                <Globe className="h-3.5 w-3.5" />
                Publish Event
              </Button>
            )}

            {event.status !== 'cancelled' && event.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isProcessing}
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel Event
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={isProcessing}
              className="gap-1.5 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate Draft
            </Button>
          </div>
        </div>
      </Card>

      {/* Meta Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Dates & Schedule</span>
          </div>
          <div className="font-semibold text-sm">
            {formatDate(event.startDate)} – {formatDate(event.endDate)}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Timezone: {event.timezone || 'America/New_York'}
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Assigned Venue</span>
          </div>
          <div className="font-semibold text-sm truncate">
            {typeof event.venue === 'object' ? event.venue.name : 'Javits Center'}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Configured with embedded room layouts
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>Maximum Capacity</span>
          </div>
          <div className="font-semibold text-sm">
            {event.capacity?.toLocaleString() || 1500} Attendees
          </div>
          <div className="text-[11px] text-muted-foreground">
            Strict capacity gating with automatic FIFO waitlist
          </div>
        </Card>
      </div>

      {/* Description View */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-2">Event Overview & Description</h3>
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {event.description || 'No description provided for this event.'}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/40">
          {event.tags?.map((t, idx) => (
            <span key={idx} className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      </Card>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Event"
        description="Provide a formal cancellation rationale. Registrants will be notified."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Cancellation Reason</label>
            <Input
              placeholder="e.g. Logistical rescheduling, severe weather, etc."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Abort
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isProcessing || !cancelReason}
              onClick={handleCancel}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
