import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { TicketCard } from '../../../components/shared/TicketCard';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Skeleton } from '../../../components/ui/skeleton';
import { Button } from '../../../components/ui/button';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';

export function MyTicketsPage() {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyTickets = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/registrations/me');
      setRegistrations(res.data?.data || []);
    } catch (err) {
      addToast({
        title: 'Fetch Failed',
        description: 'Could not load your digital conference tickets.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleCancelTicket = async (regId) => {
    if (!window.confirm('Cancel your conference ticket? If waitlisted attendees exist, the next in line will be auto-promoted.')) return;
    try {
      const res = await apiClient.post(`/registrations/${regId}/cancel`);
      addToast({
        title: 'Ticket Cancelled',
        description: res.data?.data?.promotedWaitlistId
          ? 'Cancelled. Next waitlisted attendee was auto-promoted!'
          : 'Your registration was cancelled.',
        type: 'info',
      });
      fetchMyTickets();
    } catch (err) {
      addToast({
        title: 'Cancellation Failed',
        description: err.response?.data?.error?.message || 'Could not cancel ticket',
        type: 'error',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="My Conference Passes"
        description="Digital credentials with verified QR tokens for on-site scanning and calendar synchronization"
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/events')}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Discover Events
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No passes claimed yet"
          description="You have not registered for any upcoming conferences."
          actionLabel="Explore Summits"
          onAction={() => navigate('/events')}
        />
      ) : (
        <div className="space-y-6">
          {registrations.map((reg) => (
            <TicketCard
              key={reg._id}
              registration={reg}
              onCancel={handleCancelTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
