import React, { useState } from 'react';
import { User, Sparkles, Save, Calendar, Plus, Trash2, Globe, Linkedin, Github, Twitter } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { AiDraftButton } from '../../../components/shared/AiDraftButton';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';

export function SpeakerProfilePage() {
  const { user } = useAuthStore();
  const { addToast } = useUiStore();
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || 'Dr. Sarah Chen',
    company: 'DeepMind Research Partner',
    title: 'Principal AI Architect',
    bio: 'Pioneer in distributed deep learning architectures, foundation models, and scalable KV caching mechanisms.',
    website: 'https://sarahchen.ai',
    linkedin: 'https://linkedin.com/in/sarahchen-ai',
    github: 'https://github.com/sarahchen-ml',
    twitter: 'https://twitter.com/sarahchen_ai',
  });

  const [availability, setAvailability] = useState([
    { date: '2026-11-20', startTime: '09:00', endTime: '12:00', notes: 'Keynote & Morning Panel' },
    { date: '2026-11-21', startTime: '14:00', endTime: '17:00', notes: 'Hands-on Technical Lab' },
  ]);

  const [newSlot, setNewSlot] = useState({
    date: '2026-11-22',
    startTime: '10:00',
    endTime: '13:00',
    notes: 'Q&A Office Hours',
  });

  const handleAddSlot = (e) => {
    e.preventDefault();
    setAvailability([...availability, newSlot]);
    addToast({ title: 'Slot Added', description: 'Availability calendar updated.', type: 'info' });
  };

  const handleRemoveSlot = (index) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        title: 'Speaker Profile Updated',
        description: 'Changes published to the public conference catalog.',
        type: 'success',
      });
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Speaker Profile & Availability"
        description="Public biography, research credentials, social links, and scheduling slots"
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Credentials */}
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Presenter Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Company / Affiliation</label>
              <Input
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Professional Title</label>
            <Input
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
            />
          </div>

          {/* Bio with AI Draft button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Professional Biography</label>
              <AiDraftButton
                type="speaker-bio"
                payload={{
                  name: profile.name,
                  topic: 'Distributed Systems & Machine Learning',
                  credentials: `${profile.title} at ${profile.company}`,
                }}
                onAccept={(draft) => setProfile({ ...profile, bio: draft })}
                label="✨ Draft Bio with AI"
                size="sm"
              />
            </div>
            <Textarea
              rows={4}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </div>
        </Card>

        {/* Social & Professional Links */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold">Social & Technical Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" /> Personal Website
              </label>
              <Input
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5 text-primary" /> LinkedIn URL
              </label>
              <Input
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5 text-primary" /> GitHub Profile
              </label>
              <Input
                value={profile.github}
                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Twitter className="h-3.5 w-3.5 text-primary" /> X (Twitter) Handle
              </label>
              <Input
                value={profile.twitter}
                onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Availability Calendar Picker */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Availability Calendar</h3>
              <p className="text-xs text-muted-foreground">Times you are available for session slots and workshops.</p>
            </div>
          </div>

          <div className="space-y-2">
            {availability.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground">{slot.date}</span>
                    <span className="text-muted-foreground ml-2 font-mono">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-2 font-medium">({slot.notes})</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveSlot(idx)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Slot Sub-form */}
          <div className="p-4 rounded-xl border border-dashed border-border/80 bg-card/40 space-y-3">
            <span className="text-xs font-semibold text-foreground block">Add Availability Slot</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Input
                type="date"
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              />
              <Input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
              />
              <Input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
              />
              <Input
                placeholder="Notes (e.g. Afternoon workshop)"
                value={newSlot.notes}
                onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSlot}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3 w-3" /> Add Time Slot
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
