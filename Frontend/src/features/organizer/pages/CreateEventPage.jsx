import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, ArrowLeft, Check, Sparkles, Building, MapPin, Users } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Stepper } from '../../../components/shared/Stepper';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';
import { AiDraftButton } from '../../../components/shared/AiDraftButton';
import apiClient from '../../../lib/axios';
import { getResourceId } from '../../../lib/utils';
import { useUiStore } from '../../../stores/uiStore';
import { useAuthStore } from '../../../stores/authStore';

export function CreateEventPage() {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venues, setVenues] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Engineering',
    tags: 'ai, scale, architecture',
    description: '',
    venue: '',
    org: '',
    startDate: '2026-11-20T09:00',
    endDate: '2026-11-22T18:00',
    capacity: 1500,
  });

  useEffect(() => {
    const fetchPrereqs = async () => {
      try {
        const [venuesRes, orgsRes] = await Promise.all([
          apiClient.get('/venues').catch(() => ({ data: { data: [] } })),
          apiClient.get('/organizations').catch(() => ({ data: { data: [] } })),
        ]);

        const venueList = venuesRes.data?.data?.items || venuesRes.data?.data || [];
        const orgList = orgsRes.data?.data?.items || orgsRes.data?.data || [];

        setVenues(venueList);
        setOrganizations(orgList);

        if (venueList.length > 0) {
          setFormData((prev) => ({ ...prev, venue: venueList[0]._id }));
        }
        if (orgList.length > 0) {
          setFormData((prev) => ({ ...prev, org: orgList[0]._id }));
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchPrereqs();
  }, []);

  const steps = [
    { id: 'details', label: 'Summit Overview', description: 'Core metadata & AI marketing copy' },
    { id: 'venue', label: 'Venue & Dates', description: 'Hall capacity & schedule boundaries' },
    { id: 'review', label: 'Confirmation', description: 'Review parameters and provision workspace' },
  ];

  const handleNext = () => {
    if (currentStep === 0 && !formData.title) {
      addToast({ title: 'Validation Error', description: 'Event title is required.', type: 'error' });
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        description: formData.description,
        venue: formData.venue || undefined,
        org: formData.org || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        capacity: Number(formData.capacity) || 1000,
      };

      const res = await apiClient.post('/events', payload);
      const newEvent = res.data?.data;
      const eventId = getResourceId(newEvent);

      addToast({
        title: 'Event Created',
        description: `Successfully provisioned ${formData.title}`,
        type: 'success',
      });

      if (eventId) {
        navigate(`/organizer/events/${eventId}/workspace`);
      } else {
        navigate('/organizer');
      }
    } catch (err) {
      addToast({
        title: 'Creation Failed',
        description: err.response?.data?.error?.message || 'Failed to create event',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Create New Event"
        description="Configure your conference parameters with AI marketing drafts and capacity limits."
      />

      {/* Stepper Header */}
      <Stepper steps={steps} currentStep={currentStep} onStepClick={(idx) => setCurrentStep(idx)} />

      {/* Step Content */}
      <Card className="p-6 shadow-card border-border/80">
        <CardContent className="p-0">
          {/* STEP 1: Details */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Event Title</label>
                <Input
                  placeholder="e.g. Distributed Systems Summit 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Category</label>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Engineering">Engineering</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Product & Design">Product & Design</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Topic Tags (comma-separated)</label>
                  <Input
                    placeholder="kubernetes, cloud, microservices"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Description & Overview</label>
                  <AiDraftButton
                    type="event-description"
                    payload={{
                      title: formData.title || 'Conference Summit',
                      theme: formData.category,
                      targetAudience: 'Software Engineers and Technical Leads',
                      highlights: ['Keynotes from pioneers', 'Deep dive breakout sessions'],
                    }}
                    onAccept={(draft) => setFormData({ ...formData, description: draft })}
                    label="✨ Draft with AI"
                    size="sm"
                  />
                </div>
                <Textarea
                  rows={5}
                  placeholder="Summarize the core agenda and technical themes of this conference..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Venue & Capacity */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Host Organization</label>
                <Select
                  value={formData.org}
                  onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                >
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.plan} tier)
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Venue</label>
                <Select
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                >
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.address?.city || 'Conference Hall'})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Start Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">End Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Total Venue Capacity (Attendees)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {formData.category}
                  </span>
                  <span className="text-xs text-primary font-mono">
                    Capacity: {formData.capacity} seats
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">{formData.title}</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
                  {formData.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase">Schedule</span>
                    <span className="font-medium text-foreground">
                      {new Date(formData.startDate).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase">Venue</span>
                    <span className="font-medium text-foreground">
                      {venues.find((v) => v._id === formData.venue)?.name || 'Selected Hall'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Creating this event will provision an operational workspace with live conflict checking.</span>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border/60 mt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentStep === 0 || isSubmitting}
              onClick={handleBack}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                className="gap-1.5 text-xs"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-1.5 text-xs"
              >
                <Check className="h-3.5 w-3.5" />
                {isSubmitting ? 'Creating Event...' : 'Launch Event Workspace'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
