import React, { useState, useEffect } from 'react';
import { Mic, Plus, Globe, Linkedin, Github, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { AiDraftButton } from '../../../components/shared/AiDraftButton';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';

export function SpeakersTab({ eventId }) {
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUiStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    bio: '',
    expertise: 'Artificial Intelligence, Distributed Systems',
  });

  const fetchSpeakers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/speakers');
      setSpeakers(res.data?.data?.items || res.data?.data || []);
    } catch (err) {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const handleCreateSpeaker = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/speakers', {
        name: form.name,
        email: form.email,
        company: form.company,
        title: form.title,
        bio: form.bio,
        expertise: form.expertise.split(',').map((x) => x.trim()).filter(Boolean),
      });
      addToast({ title: 'Speaker Profile Added', type: 'success' });
      setIsModalOpen(false);
      setForm({ name: '', email: '', company: '', title: '', bio: '', expertise: '' });
      fetchSpeakers();
    } catch (err) {
      addToast({ title: 'Failed to Add Speaker', description: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Featured Speakers & Keynotes</h3>
          <p className="text-xs text-muted-foreground">Presenters assigned to agenda sessions.</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Speaker
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {speakers.map((spk) => (
          <Card key={spk._id} className="p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                  {spk.name ? spk.name[0] : 'S'}
                </div>
                <div className="truncate">
                  <div className="font-semibold text-sm truncate">{spk.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {spk.title || 'Presenter'} • {spk.company || 'Tech Leader'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {spk.bio || 'Pioneer in distributed systems and software architecture.'}
              </p>

              <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-border/40">
                {spk.expertise?.slice(0, 3).map((exp, idx) => (
                  <span key={idx} className="rounded-md bg-muted px-2 py-0.5 text-[9px] text-muted-foreground font-mono">
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Speaker Profile"
        description="Create a presenter profile with AI bio draft capabilities."
      >
        <form onSubmit={handleCreateSpeaker} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Speaker Name</label>
              <Input
                placeholder="Dr. Sarah Chen"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Email</label>
              <Input
                type="email"
                placeholder="sarah@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Company / Org</label>
              <Input
                placeholder="DeepMind Research"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Job Title</label>
              <Input
                placeholder="Principal AI Architect"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Biography</label>
              <AiDraftButton
                type="speaker-bio"
                payload={{
                  name: form.name || 'Featured Speaker',
                  topic: form.expertise,
                  credentials: `${form.title || 'Lead Architect'} at ${form.company || 'Enterprise'}`,
                }}
                onAccept={(draft) => setForm({ ...form, bio: draft })}
                label="✨ Draft Bio"
                size="sm"
              />
            </div>
            <Textarea
              rows={3}
              placeholder="Speaker credentials and background..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Speaker'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
