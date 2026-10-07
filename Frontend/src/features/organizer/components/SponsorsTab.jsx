import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, CheckCircle, XCircle, FileText, ExternalLink, Award } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatCurrency, formatDate } from '../../../lib/utils';

export function SponsorsTab({ eventId }) {
  const [packages, setPackages] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [reviewModalData, setReviewModalData] = useState(null); // { sponsorshipId, deliverable }
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUiStore();

  const [packageForm, setPackageForm] = useState({
    name: 'Platinum Sponsor',
    tier: 'platinum',
    price: 15000,
    slots: 3,
    benefits: 'Main stage banner, VIP booth, 5 keynote passes',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pkgRes, sponRes] = await Promise.all([
        apiClient.get(`/events/${eventId}/sponsor-packages`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/events/${eventId}/sponsorships`).catch(() => ({ data: { data: [] } })),
      ]);

      setPackages(pkgRes.data?.data || []);
      setSponsorships(sponRes.data?.data || []);
    } catch (err) {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post(`/events/${eventId}/sponsor-packages`, {
        name: packageForm.name,
        tier: packageForm.tier,
        price: Number(packageForm.price),
        slots: Number(packageForm.slots),
        benefits: packageForm.benefits.split(',').map((b) => b.trim()).filter(Boolean),
      });
      addToast({ title: 'Sponsor Tier Created', type: 'success' });
      setIsPackageModalOpen(false);
      fetchData();
    } catch (err) {
      addToast({ title: 'Creation Failed', description: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewDeliverable = async (status) => {
    if (!reviewModalData) return;
    setIsSubmitting(true);
    try {
      const { sponsorshipId, deliverable } = reviewModalData;
      await apiClient.patch(
        `/events/${eventId}/sponsorships/${sponsorshipId}/deliverables/${deliverable._id}/review`,
        { status, reviewNotes }
      );
      addToast({
        title: `Deliverable ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        type: status === 'approved' ? 'success' : 'warning',
      });
      setReviewModalData(null);
      setReviewNotes('');
      fetchData();
    } catch (err) {
      addToast({ title: 'Review Failed', description: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Sponsor Packages & Partner Allocations</h3>
          <p className="text-xs text-muted-foreground">Manage corporate tiers and review submitted brand deliverables.</p>
        </div>
        <Button size="sm" onClick={() => setIsPackageModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Create Tier Package
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg._id} className="p-5 flex flex-col justify-between shadow-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary capitalize">{pkg.tier} Tier</span>
                <Badge variant={pkg.claimed >= pkg.slots ? 'warning' : 'success'}>
                  {pkg.claimed || 0} / {pkg.slots} claimed
                </Badge>
              </div>
              <h4 className="text-lg font-bold">{pkg.name}</h4>
              <div className="text-2xl font-bold mt-2">{formatCurrency(pkg.price)}</div>
              <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                <ul className="space-y-1 list-disc list-inside">
                  {pkg.benefits?.map((b, bIdx) => (
                    <li key={bIdx} className="truncate">{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Sponsorships List & Deliverable Review */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold">Confirmed Corporate Sponsors & Deliverables</h3>
        {sponsorships.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No confirmed sponsor allocations yet.
          </Card>
        ) : (
          sponsorships.map((spon) => (
            <Card key={spon._id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{spon.companyName}</h4>
                  <div className="text-xs text-muted-foreground">
                    Tier: {spon.package?.name || 'Partner'} • Status: <span className="capitalize">{spon.status}</span>
                  </div>
                </div>
              </div>

              {/* Deliverables Sub-list */}
              {spon.deliverables?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Deliverables Review Queue
                  </div>
                  {spon.deliverables.map((del) => (
                    <div
                      key={del._id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-semibold">{del.title}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Due: {formatDate(del.dueDate)} • Status: <span className="capitalize">{del.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {del.asset && (
                          <a
                            href={del.asset}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View Asset <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewModalData({ sponsorshipId: spon._id, deliverable: del })}
                          className="h-7 px-2 text-xs"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create Package Modal */}
      <Modal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        title="Add Sponsor Package"
        description="Configure tier parameters and perks."
      >
        <form onSubmit={handleCreatePackage} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Package Title</label>
            <Input
              value={packageForm.name}
              onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Price (USD)</label>
              <Input
                type="number"
                value={packageForm.price}
                onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Available Slots</label>
              <Input
                type="number"
                value={packageForm.slots}
                onChange={(e) => setPackageForm({ ...packageForm, slots: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Perks & Benefits (comma-separated)</label>
            <Textarea
              rows={3}
              value={packageForm.benefits}
              onChange={(e) => setPackageForm({ ...packageForm, benefits: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsPackageModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              Create Package
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Deliverable Modal */}
      <Modal
        isOpen={!!reviewModalData}
        onClose={() => setReviewModalData(null)}
        title="Review Sponsor Deliverable"
        description={`Assess asset compliance for ${reviewModalData?.deliverable?.title || ''}.`}
      >
        <div className="space-y-4 pt-2">
          {reviewModalData?.deliverable?.asset && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <span className="font-semibold block mb-1">Asset Location:</span>
              <a
                href={reviewModalData.deliverable.asset}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline break-all"
              >
                {reviewModalData.deliverable.asset}
              </a>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium">Review Notes / Feedback</label>
            <Textarea
              rows={3}
              placeholder="e.g. Vector resolution verified. High contrast approved."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleReviewDeliverable('rejected')}
              className="text-destructive hover:bg-destructive/10"
              disabled={isSubmitting}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Reject Asset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleReviewDeliverable('approved')}
              disabled={isSubmitting}
              className="gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approve Asset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
