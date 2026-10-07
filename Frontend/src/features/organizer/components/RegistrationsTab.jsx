import React, { useState, useEffect } from 'react';
import {
  Users,
  Ticket,
  Percent,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  Shield,
  Search,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { DataTable } from '../../../components/shared/DataTable';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatDate, formatCurrency } from '../../../lib/utils';

export function RegistrationsTab({ eventId }) {
  const [registrations, setRegistrations] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const { addToast } = useUiStore();

  // Modals State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Ticket Form
  const [ticketForm, setTicketForm] = useState({
    name: 'General Admission',
    price: 199,
    capacity: 200,
    requiresApproval: false,
  });

  // New Coupon Form
  const [couponForm, setCouponForm] = useState({
    code: 'TECH20',
    type: 'percent',
    value: 20,
    maxUses: 100,
    expiry: '2026-12-31T23:59',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [regRes, ticketRes, couponRes] = await Promise.all([
        apiClient.get(`/events/${eventId}/registrations`),
        apiClient.get(`/events/${eventId}/tickets`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/events/${eventId}/coupons`).catch(() => ({ data: { data: [] } })),
      ]);

      const regItems = regRes.data?.data?.items || regRes.data?.data || [];
      setRegistrations(regItems);
      setTicketTypes(ticketRes.data?.data || []);
      setCoupons(couponRes.data?.data || []);
    } catch (err) {
      addToast({
        title: 'Fetch Failed',
        description: 'Could not load registration data.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleApprove = async (regId) => {
    try {
      await apiClient.patch(`/events/${eventId}/registrations/${regId}/approve`);
      addToast({ title: 'Registration Approved', type: 'success' });
      fetchData();
    } catch (err) {
      addToast({ title: 'Approval Failed', description: err.message, type: 'error' });
    }
  };

  const handleReject = async (regId) => {
    try {
      await apiClient.patch(`/events/${eventId}/registrations/${regId}/reject`);
      addToast({ title: 'Registration Rejected', type: 'warning' });
      fetchData();
    } catch (err) {
      addToast({ title: 'Rejection Failed', description: err.message, type: 'error' });
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post(`/events/${eventId}/tickets`, {
        name: ticketForm.name,
        price: Number(ticketForm.price),
        capacity: Number(ticketForm.capacity),
        requiresApproval: ticketForm.requiresApproval,
      });
      addToast({ title: 'Ticket Tier Created', type: 'success' });
      setIsTicketModalOpen(false);
      fetchData();
    } catch (err) {
      addToast({ title: 'Creation Failed', description: err.response?.data?.error?.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post(`/events/${eventId}/coupons`, {
        code: couponForm.code.toUpperCase(),
        type: couponForm.type,
        value: Number(couponForm.value),
        maxUses: Number(couponForm.maxUses),
        expiry: new Date(couponForm.expiry).toISOString(),
      });
      addToast({ title: 'Coupon Created', type: 'success' });
      setIsCouponModalOpen(false);
      fetchData();
    } catch (err) {
      addToast({ title: 'Creation Failed', description: err.response?.data?.error?.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const regColumns = [
    {
      header: 'Attendee',
      accessorKey: 'user',
      cell: (row) => {
        const u = row.user || {};
        return (
          <div>
            <div className="font-semibold text-foreground">{u.name || 'Attendee'}</div>
            <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
          </div>
        );
      },
    },
    {
      header: 'Pass Tier',
      cell: (row) => <Badge variant="secondary">{row.ticketType?.name || 'Standard'}</Badge>,
    },
    {
      header: 'Price Paid',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold">{formatCurrency(row.finalPrice)}</span>
      ),
    },
    {
      header: 'Registration Status',
      cell: (row) => {
        switch (row.status) {
          case 'checked_in':
            return <Badge variant="success">✓ Checked In</Badge>;
          case 'approved':
            return <Badge variant="accent">Approved</Badge>;
          case 'waitlisted':
            return <Badge variant="warning">Waitlist #{row.waitlistPosition || '1'}</Badge>;
          case 'pending':
            return <Badge variant="outline">Pending Review</Badge>;
          case 'rejected':
            return <Badge variant="destructive">Rejected</Badge>;
          default:
            return <Badge variant="secondary">{row.status}</Badge>;
        }
      },
    },
    {
      header: 'Registered',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (row) => {
        if (row.status === 'pending') {
          return (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleApprove(row._id)}
                className="h-7 px-2 text-xs text-emerald-500 hover:bg-emerald-500/10"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReject(row._id)}
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="attendees" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="attendees" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Registrations ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            Ticket Tiers ({ticketTypes.length})
          </TabsTrigger>
          <TabsTrigger value="coupons" className="text-xs gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            Discount Coupons ({coupons.length})
          </TabsTrigger>
        </TabsList>

        {/* ATTENDEES TAB */}
        <TabsContent value="attendees" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {['all', 'pending', 'approved', 'waitlisted', 'checked_in', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={regColumns}
            data={filteredRegistrations}
            isLoading={isLoading}
            emptyTitle="No registrations found"
            emptyDescription="Attendees registering for tickets will show up here."
          />
        </TabsContent>

        {/* TICKET TYPES TAB */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Tiered Ticket Passes</h3>
              <p className="text-xs text-muted-foreground">Manage ticket capacities, pricing, and approval flags.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsTicketModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Ticket Tier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ticketTypes.map((t) => (
              <Card key={t._id} className="p-5 flex flex-col justify-between shadow-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary">{t.name}</span>
                    <Badge variant={t.sold >= t.capacity ? 'warning' : 'success'}>
                      {t.sold >= t.capacity ? 'Sold Out' : 'Active'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(t.price)}</div>
                  <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 space-y-1">
                    <div className="flex justify-between">
                      <span>Sold / Capacity</span>
                      <span className="font-semibold text-foreground">{t.sold || 0} / {t.capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requires Approval</span>
                      <span className="font-semibold">{t.requiresApproval ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* COUPONS TAB */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Promotional Codes</h3>
              <p className="text-xs text-muted-foreground">Flat and percentage discounts applied at registration.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCouponModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Coupon
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <Card key={c._id} className="p-5 flex flex-col justify-between shadow-card">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-primary">{c.code}</span>
                    <Badge variant="secondary">
                      {c.type === 'percent' ? `${c.value}% OFF` : `$${c.value} OFF`}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t border-border/50">
                    <div className="flex justify-between">
                      <span>Usage</span>
                      <span className="font-semibold text-foreground">{c.used || 0} / {c.maxUses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires</span>
                      <span className="font-mono">{formatDate(c.expiry)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Tier Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Add Ticket Tier"
        description="Configure pricing, cap limits, and approval requirements."
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Pass Name</label>
            <Input
              placeholder="e.g. VIP All Access"
              value={ticketForm.name}
              onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Price (USD)</label>
              <Input
                type="number"
                min="0"
                value={ticketForm.price}
                onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Seat Capacity</label>
              <Input
                type="number"
                min="1"
                value={ticketForm.capacity}
                onChange={(e) => setTicketForm({ ...ticketForm, capacity: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
            <div>
              <div className="text-xs font-semibold">Requires Organizer Approval</div>
              <div className="text-[11px] text-muted-foreground">Keep order pending until manually accepted.</div>
            </div>
            <input
              type="checkbox"
              checked={ticketForm.requiresApproval}
              onChange={(e) => setTicketForm({ ...ticketForm, requiresApproval: e.target.checked })}
              className="h-4 w-4 rounded text-primary"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsTicketModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Pass'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Coupon Modal */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Create Promotional Coupon"
        description="Issue promotional discount codes for ticket buyers."
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Coupon Code</label>
            <Input
              placeholder="e.g. EARLYBIRD20"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Discount Type</label>
              <Select
                value={couponForm.type}
                onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Dollar ($)</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Discount Value</label>
              <Input
                type="number"
                min="1"
                value={couponForm.value}
                onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Max Redemptions</label>
              <Input
                type="number"
                min="1"
                value={couponForm.maxUses}
                onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Expiration Date</label>
              <Input
                type="datetime-local"
                value={couponForm.expiry}
                onChange={(e) => setCouponForm({ ...couponForm, expiry: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCouponModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
