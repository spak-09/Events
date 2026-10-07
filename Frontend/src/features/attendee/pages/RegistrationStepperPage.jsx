import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Ticket,
  Percent,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Stepper } from '../../../components/shared/Stepper';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { EmptyState } from '../../../components/shared/EmptyState';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatCurrency, getResourceId, getTicketAvailability } from '../../../lib/utils';

export function RegistrationStepperPage() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const initialTicketId = searchParams.get('ticketId') || '';
  const navigate = useNavigate();
  const { addToast } = useUiStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedTicketId, setSelectedTicketId] = useState(initialTicketId);
  const [selectedInterests, setSelectedInterests] = useState(['LLM', 'Inference']);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Result state
  const [registrationResult, setRegistrationResult] = useState(null);

  const interestOptions = [
    'LLM',
    'Inference',
    'Autonomous Agents',
    'MLOps',
    'Robotics',
    'AI Safety',
    'Fine-Tuning',
    'Vector Databases',
    'Cloud Infrastructure',
    'Kubernetes',
    'Microservices',
    'Security',
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventRes, ticketsRes, sessionsRes] = await Promise.all([
          apiClient.get(`/events/${eventId}`),
          apiClient.get(`/events/${eventId}/tickets`),
          apiClient.get(`/events/${eventId}/sessions`).catch(() => ({ data: { data: [] } })),
        ]);

        setEvent(eventRes.data?.data);
        const tList = ticketsRes.data?.data || [];
        setTickets(tList);
        setSessions(sessionsRes.data?.data || []);

        const initialTicket = tList.find((ticket) => getResourceId(ticket) === initialTicketId);
        const firstAvailableTicket = tList.find((ticket) =>
          getTicketAvailability(ticket, eventRes.data?.data?.status).canRegister
        );
        if (initialTicket && getTicketAvailability(initialTicket, eventRes.data?.data?.status).canRegister) {
          setSelectedTicketId(initialTicketId);
        } else if (firstAvailableTicket || tList.length > 0) {
          setSelectedTicketId(getResourceId(firstAvailableTicket || tList[0]) || '');
        }
      } catch (err) {
        addToast({ title: 'Failed to Load Registration', description: err.message, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [eventId, initialTicketId, addToast]);

  const steps = [
    { id: 'ticket', label: 'Select Pass', description: 'Choose tier & capacity' },
    { id: 'interests', label: 'Preferences', description: 'Track interests for recommendations' },
    { id: 'coupon', label: 'Discount', description: 'Apply promo code' },
    { id: 'confirm', label: 'Confirmation', description: 'Ticket status & QR issuance' },
  ];

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const res = await apiClient.post(`/events/${eventId}/coupons/validate`, {
        code: couponCode,
        ticketTypeId: selectedTicketId,
      });
      setCouponValidation(res.data?.data || null);
      addToast({ title: 'Coupon Applied', description: 'Discount applied to pass.', type: 'success' });
    } catch (err) {
      setCouponValidation(null);
      addToast({
        title: 'Invalid Coupon',
        description: err.response?.data?.error?.message || 'Coupon code not valid for this pass',
        type: 'error',
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const selectedTicket = tickets.find((ticket) => getResourceId(ticket) === selectedTicketId) || tickets[0] || {};
  const selectedAvailability = getTicketAvailability(selectedTicket, event?.status);
  const finalPrice = couponValidation ? couponValidation.finalPrice : selectedTicket.price || 0;

  const handleSubmitRegistration = async () => {
    if (!selectedAvailability.canRegister) {
      addToast({
        title: 'Pass Unavailable',
        description: selectedAvailability.reason,
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ticketTypeId: selectedTicketId,
        couponCode: couponCode || undefined,
        interests: selectedInterests,
      };

      const res = await apiClient.post(`/events/${eventId}/register`, payload);
      const registration = res.data?.data;
      const isWaitlisted = registration?.status === 'waitlisted';
      const data = { registration, isWaitlisted };
      setRegistrationResult(data);
      setCurrentStep(3); // Go to confirmation

      addToast({
        title: isWaitlisted ? 'Waitlisted in FIFO Queue' : 'Registration Confirmed',
        description: isWaitlisted
          ? `Placed at position #${registration?.waitlistPosition || 1}`
          : 'Your digital conference pass is ready.',
        type: isWaitlisted ? 'warning' : 'success',
      });
    } catch (err) {
      addToast({
        title: 'Registration Error',
        description: err.response?.data?.error?.message || 'Failed to complete registration',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={`Register for ${event?.title || 'Conference'}`}
        description="Choose your ticket tier, specify track interests, and finalize pass issuance."
      />

      <Stepper steps={steps} currentStep={currentStep} />

      <Card className="p-6 shadow-card border-border/80">
        <CardContent className="p-0">
          {/* STEP 0: Select Ticket Tier */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Choose Your Pass Tier</h3>
              {tickets.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No passes available"
                  description="This event does not have any ticket tiers available yet."
                  actionLabel="Back to Events"
                  onAction={() => navigate('/events')}
                />
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tickets.map((t) => {
                  const ticketId = getResourceId(t);
                  const availability = getTicketAvailability(t, event?.status);
                  const isSelected = selectedTicketId === ticketId;

                  return (
                    <div
                      key={ticketId || t.name}
                      role="button"
                      tabIndex={availability.canRegister ? 0 : -1}
                      aria-disabled={!availability.canRegister}
                      onClick={() => availability.canRegister && setSelectedTicketId(ticketId)}
                      onKeyDown={(e) => {
                        if (availability.canRegister && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setSelectedTicketId(ticketId);
                        }
                      }}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        availability.canRegister ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border/80 hover:border-border bg-card'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-primary">{t.name}</span>
                          {availability.isWaitlist ? (
                            <Badge variant="warning">Waitlist</Badge>
                          ) : availability.canRegister ? (
                            <Badge variant="success">Available</Badge>
                          ) : (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold">{formatCurrency(t.price)}</div>
                        <div className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
                          {t.sold || 0} / {t.capacity} claimed · {availability.reason}
                          {t.requiresApproval && (
                            <span className="block text-[11px] text-amber-500 mt-1">
                              * Requires organizer approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border/50">
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  disabled={!selectedTicketId || !selectedAvailability.canRegister}
                  className="gap-1 text-xs"
                >
                  Continue to Preferences <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: Track Interests */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Track Interests</h3>
                <p className="text-xs text-muted-foreground">
                  Powers your personalized "For You" session matchmaking with explainable rationales.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {interestOptions.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedInterests(selectedInterests.filter((t) => t !== tag));
                        } else {
                          setSelectedInterests([...selectedInterests, tag]);
                        }
                      }}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border/50 mt-6">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(0)} className="gap-1 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <Button size="sm" onClick={() => setCurrentStep(2)} className="gap-1 text-xs">
                  Continue to Discount <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Coupon & Discount */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Promotional Code</h3>
                <p className="text-xs text-muted-foreground">Have a sponsor code or early bird coupon?</p>
              </div>

              <div className="flex gap-2 max-w-sm">
                <Input
                  placeholder="e.g. TECH20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleValidateCoupon}
                  disabled={isValidatingCoupon || !couponCode}
                  className="text-xs shrink-0"
                >
                  {isValidatingCoupon ? 'Validating...' : 'Apply Code'}
                </Button>
              </div>

              {couponValidation && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                  <span>Valid Coupon: {couponValidation.coupon?.code}</span>
                  <span className="font-bold">-${couponValidation.discountAmount} Discount Applied</span>
                </div>
              )}

              {/* Order Summary Box */}
              <div className="p-5 rounded-2xl border border-border/80 bg-muted/20 space-y-2 mt-4 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Selected Tier</span>
                  <span className="font-semibold text-foreground">{selectedTicket.name}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Standard Price</span>
                  <span className="font-mono">{formatCurrency(selectedTicket.price)}</span>
                </div>
                {couponValidation && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-${couponValidation.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border/60 text-sm font-bold text-foreground">
                  <span>Total Amount</span>
                  <span className="font-mono text-primary text-base">{formatCurrency(finalPrice)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border/50 mt-6">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} className="gap-1 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitRegistration}
                  disabled={isSubmitting || !selectedAvailability.canRegister}
                  className="gap-1 text-xs"
                >
                  {isSubmitting
                    ? 'Registering...'
                    : selectedAvailability.isWaitlist
                    ? 'Join Waitlist'
                    : 'Confirm & Complete Registration'}
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation Result */}
          {currentStep === 3 && registrationResult && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-2 shadow-sm">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {registrationResult.isWaitlisted
                    ? 'Waitlisted (FIFO Queue)'
                    : 'Registration Confirmed'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {registrationResult.isWaitlisted
                    ? `Capacity reached. You are currently #${registrationResult.registration?.waitlistPosition} in line. If an attendee cancels, you will be auto-promoted!`
                    : 'Your pass credentials and digital QR code are live in your attendee portal.'}
                </p>
              </div>

              <div className="p-4 max-w-sm mx-auto rounded-2xl border border-border/80 bg-card text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={registrationResult.isWaitlisted ? 'warning' : 'success'} className="capitalize">
                    {registrationResult.registration?.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pass Tier</span>
                  <span className="font-semibold">{selectedTicket.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-mono font-bold">{formatCurrency(registrationResult.registration?.finalPrice)}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <Button size="sm" onClick={() => navigate('/attendee/tickets')} className="gap-1.5 text-xs">
                  <Ticket className="h-3.5 w-3.5" /> View My Digital Pass
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/attendee/agenda')} className="gap-1.5 text-xs">
                  Build Agenda <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
