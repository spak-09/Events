import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Send, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';
import { AiDraftButton } from '../../../components/shared/AiDraftButton';
import { EmptyState } from '../../../components/shared/EmptyState';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatDate } from '../../../lib/utils';

export function AnnouncementsTab({ eventId, eventTitle }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUiStore();

  const [form, setForm] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
  });

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/events/${eventId}/announcements`);
      const items = res.data?.data?.items || res.data?.data || [];
      setAnnouncements(items);
    } catch (err) {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [eventId]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/events/${eventId}/announcements`, form);
      addToast({ title: 'Announcement Broadcasted', type: 'success' });
      setIsModalOpen(false);
      setForm({ title: '', message: '', targetAudience: 'all' });
      fetchAnnouncements();
    } catch (err) {
      addToast({ title: 'Broadcast Failed', description: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this broadcast?')) return;
    try {
      await apiClient.delete(`/events/${eventId}/announcements/${id}`);
      addToast({ title: 'Announcement Deleted', type: 'info' });
      fetchAnnouncements();
    } catch (err) {
      addToast({ title: 'Delete Failed', description: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Event Broadcasts & Notifications</h3>
          <p className="text-xs text-muted-foreground">Deliver urgent alerts or track updates to attendees and staff.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          New Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No broadcasts yet"
          description="Send your first alert to attendees, speakers, or staff."
          actionLabel="Post Announcement"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <Card key={item._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    Target: {item.targetAudience || 'All'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {item.message}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item._id)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Broadcast Announcement"
        description="Craft an announcement using AI drafting assistance."
      >
        <form onSubmit={handleBroadcast} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Broadcast Subject</label>
            <Input
              placeholder="e.g. Keynote Venue Relocation to Grand Ballroom"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Audience Segment</label>
            <Select
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
            >
              <option value="all">All Event Participants</option>
              <option value="attendees">Registered Attendees Only</option>
              <option value="speakers">Speakers & Presenters</option>
              <option value="staff">Event Operations Staff</option>
              <option value="sponsors">Corporate Sponsors</option>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Announcement Body</label>
              <AiDraftButton
                type="announcement"
                payload={{
                  title: form.title || 'Event Update',
                  audience: form.targetAudience,
                  keyPoints: ['Urgent room change', 'Session starts 15 mins later'],
                }}
                onAccept={(draft) => setForm({ ...form, message: draft })}
                label="✨ Draft Announcement"
                size="sm"
              />
            </div>
            <Textarea
              rows={4}
              placeholder="Type announcement details or generate with AI..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Transmitting...' : 'Send Broadcast'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
