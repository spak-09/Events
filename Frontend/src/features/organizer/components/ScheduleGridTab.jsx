import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  Sparkles,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';
import { ConflictAlert } from '../../../components/shared/ConflictAlert';
import { AiDraftButton } from '../../../components/shared/AiDraftButton';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatTime } from '../../../lib/utils';

export function ScheduleGridTab({ eventId, event }) {
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [conflictMessage, setConflictMessage] = useState('');
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useUiStore();

  const rooms = [
    'Grand Ballroom',
    'Tech Pavilion',
    'Breakout Hall A',
    'Workshop Lab 1',
  ];

  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  // Modal Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    room: rooms[0],
    start: '2026-11-20T10:00:00Z',
    end: '2026-11-20T11:00:00Z',
    track: 'Engineering',
    tags: 'Scale, Architecture',
    capacity: 250,
    speakers: [],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, speakersRes] = await Promise.all([
        apiClient.get(`/events/${eventId}/sessions`),
        apiClient.get('/speakers').catch(() => ({ data: { data: [] } })),
      ]);

      setSessions(sessionsRes.data?.data || []);
      const spkList = speakersRes.data?.data?.items || speakersRes.data?.data || [];
      setSpeakers(spkList);
    } catch (err) {
      addToast({
        title: 'Fetch Failed',
        description: 'Could not load sessions or speakers.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handlePreCheckConflicts = async (dataToCheck) => {
    setIsCheckingConflicts(true);
    setConflicts([]);
    setConflictMessage('');
    try {
      const payload = {
        room: dataToCheck.room,
        start: new Date(dataToCheck.start).toISOString(),
        end: new Date(dataToCheck.end).toISOString(),
        speakers: dataToCheck.speakers.length > 0 ? dataToCheck.speakers : undefined,
        capacity: Number(dataToCheck.capacity) || 200,
      };

      const res = await apiClient.post(`/events/${eventId}/sessions/check-conflicts`, payload);
      const conflictData = res.data?.data;

      if (conflictData?.hasConflict) {
        setConflicts(conflictData.conflicts || []);
        setConflictMessage('Schedule overlap detected with existing booking.');
      } else {
        setConflicts([]);
        setConflictMessage('');
      }
    } catch (err) {
      const errData = err.response?.data?.error;
      if (errData?.details) {
        setConflicts(errData.details);
        setConflictMessage(errData.message);
      }
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  const handleOpenCreateModal = (room = rooms[0], time = '10:00') => {
    setEditingSession(null);
    setConflicts([]);
    setConflictMessage('');
    const baseDate = event?.startDate ? new Date(event.startDate) : new Date();
    const [h] = time.split(':');
    const startObj = new Date(baseDate);
    startObj.setUTCHours(parseInt(h, 10), 0, 0, 0);
    const endObj = new Date(startObj);
    endObj.setUTCHours(parseInt(h, 10) + 1, 0, 0, 0);

    const initial = {
      title: '',
      description: '',
      room,
      start: startObj.toISOString().slice(0, 16),
      end: endObj.toISOString().slice(0, 16),
      track: 'Engineering',
      tags: 'Scale, Systems',
      capacity: 250,
      speakers: speakers.length > 0 ? [speakers[0]._id] : [],
    };
    setFormData(initial);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (session) => {
    setEditingSession(session);
    setConflicts([]);
    setConflictMessage('');
    setFormData({
      title: session.title,
      description: session.description || '',
      room: session.room || rooms[0],
      start: session.start ? new Date(session.start).toISOString().slice(0, 16) : '',
      end: session.end ? new Date(session.end).toISOString().slice(0, 16) : '',
      track: session.track || 'Engineering',
      tags: Array.isArray(session.tags) ? session.tags.join(', ') : session.tags || '',
      capacity: session.capacity || 200,
      speakers: session.speakers?.map((s) => s._id || s) || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        room: formData.room,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        track: formData.track,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        capacity: Number(formData.capacity) || 200,
        speakers: formData.speakers,
      };

      if (editingSession) {
        await apiClient.patch(`/events/${eventId}/sessions/${editingSession._id}`, payload);
        addToast({ title: 'Session Updated', description: 'Agenda updated successfully.', type: 'success' });
      } else {
        await apiClient.post(`/events/${eventId}/sessions`, payload);
        addToast({ title: 'Session Scheduled', description: 'Added to event schedule.', type: 'success' });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const errData = err.response?.data?.error;
      if (errData?.details) {
        setConflicts(errData.details);
        setConflictMessage(errData.message || 'Conflict detected');
      } else {
        addToast({
          title: 'Scheduling Failed',
          description: errData?.message || 'Could not save session',
          type: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Remove this session from the schedule?')) return;
    try {
      await apiClient.delete(`/events/${eventId}/sessions/${sessionId}`);
      addToast({ title: 'Session Removed', type: 'info' });
      fetchData();
    } catch (err) {
      addToast({ title: 'Delete Failed', description: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Room × Time Agenda Grid</h2>
          <p className="text-xs text-muted-foreground">
            4-point live conflict checking: Room overlap, speaker double-booking, and capacity.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => handleOpenCreateModal()}
          className="gap-1.5 text-xs self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Schedule Session
        </Button>
      </div>

      {/* Grid Container */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-x-auto shadow-sm">
        <div className="min-w-[760px]">
          {/* Room Header Row */}
          <div className="grid grid-cols-5 border-b border-border/70 bg-muted/30">
            <div className="p-3 text-xs font-semibold text-muted-foreground border-r border-border/50 flex items-center justify-center">
              Time
            </div>
            {rooms.map((room) => (
              <div key={room} className="p-3 text-xs font-semibold text-foreground border-r border-border/50 text-center">
                {room}
              </div>
            ))}
          </div>

          {/* Time Slots Rows */}
          {timeSlots.map((slot) => {
            const slotHour = parseInt(slot.split(':')[0], 10);

            return (
              <div key={slot} className="grid grid-cols-5 border-b border-border/40 min-h-[90px]">
                {/* Time Indicator */}
                <div className="p-2 border-r border-border/50 flex items-center justify-center font-mono text-xs text-muted-foreground/80 bg-muted/10">
                  {slot}
                </div>

                {/* Rooms Slots */}
                {rooms.map((room) => {
                  // Find sessions in this room & slot
                  const matchingSessions = sessions.filter((s) => {
                    if (s.room !== room) return false;
                    const sHour = new Date(s.start).getUTCHours();
                    return sHour === slotHour;
                  });

                  return (
                    <div
                      key={room}
                      onClick={() => {
                        if (matchingSessions.length === 0) {
                          handleOpenCreateModal(room, slot);
                        }
                      }}
                      className="p-1.5 border-r border-border/40 hover:bg-muted/30 transition-colors relative flex flex-col justify-start group cursor-pointer"
                    >
                      {matchingSessions.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                            <Plus className="h-3 w-3" /> Add
                          </span>
                        </div>
                      ) : (
                        matchingSessions.map((session) => (
                          <div
                            key={session._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(session);
                            }}
                            className="w-full rounded-xl border border-primary/30 bg-primary/10 p-2 shadow-xs hover:border-primary transition-all text-left"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono text-primary font-semibold truncate">
                                {session.track || 'Track'}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(session._id);
                                  }}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs font-semibold line-clamp-2 leading-tight text-foreground">
                              {session.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{formatTime(session.start)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession ? 'Edit Agenda Session' : 'Schedule New Session'}
        description="Configure timing, room booking, and assign featured speakers."
      >
        <form onSubmit={handleSaveSession} className="space-y-4 pt-2">
          {/* Conflict Warning banner */}
          <ConflictAlert conflicts={conflicts} message={conflictMessage} />

          <div className="space-y-1">
            <label className="text-xs font-medium">Session Title</label>
            <Input
              placeholder="e.g. Scaling Distributed Inference"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Room</label>
              <Select
                value={formData.room}
                onChange={(e) => {
                  const updated = { ...formData, room: e.target.value };
                  setFormData(updated);
                  handlePreCheckConflicts(updated);
                }}
              >
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Track Category</label>
              <Input
                placeholder="Engineering, AI, Cloud"
                value={formData.track}
                onChange={(e) => setFormData({ ...formData, track: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Start Time</label>
              <Input
                type="datetime-local"
                value={formData.start}
                onChange={(e) => {
                  const updated = { ...formData, start: e.target.value };
                  setFormData(updated);
                  handlePreCheckConflicts(updated);
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">End Time</label>
              <Input
                type="datetime-local"
                value={formData.end}
                onChange={(e) => {
                  const updated = { ...formData, end: e.target.value };
                  setFormData(updated);
                  handlePreCheckConflicts(updated);
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Keynote Speaker</label>
            <Select
              value={formData.speakers[0] || ''}
              onChange={(e) => {
                const spkId = e.target.value;
                const updated = { ...formData, speakers: spkId ? [spkId] : [] };
                setFormData(updated);
                handlePreCheckConflicts(updated);
              }}
            >
              <option value="">No speaker assigned</option>
              {speakers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.company || 'Speaker'})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Session Abstract / Description</label>
              <AiDraftButton
                type="session-summary"
                payload={{
                  title: formData.title || 'Technical Session',
                  track: formData.track,
                  keyTopics: ['Optimization', 'Benchmarks', 'Production architectures'],
                }}
                onAccept={(draft) => setFormData({ ...formData, description: draft })}
                label="✨ Draft Summary"
                size="sm"
              />
            </div>
            <Textarea
              rows={3}
              placeholder="Session abstract, key takeaways, and prerequisites..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || conflicts.length > 0}
            >
              {isSaving ? 'Validating & Saving...' : editingSession ? 'Update Session' : 'Confirm Session'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
