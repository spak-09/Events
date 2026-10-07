import React, { useState, useEffect } from 'react';
import { Building, Plus, Ban, CheckCircle, Shield } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { DataTable } from '../../../components/shared/DataTable';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatDate } from '../../../lib/utils';

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('growth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUiStore();

  const fetchOrgs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/organizations');
      const items = res.data?.data?.items || res.data?.data || [];
      setOrgs(items);
    } catch (err) {
      addToast({
        title: 'Fetch Failed',
        description: 'Could not load organization directory.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleToggleStatus = async (org) => {
    const nextStatus = org.status === 'suspended' ? 'active' : 'suspended';
    try {
      await apiClient.patch(`/organizations/${org._id}/status`, { status: nextStatus });
      addToast({
        title: `Tenant ${nextStatus === 'suspended' ? 'Suspended' : 'Reinstated'}`,
        description: `${org.name} is now ${nextStatus}.`,
        type: nextStatus === 'suspended' ? 'warning' : 'success',
      });
      fetchOrgs();
    } catch (err) {
      addToast({
        title: 'Action Failed',
        description: err.response?.data?.error?.message || 'Could not update status',
        type: 'error',
      });
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/organizations', {
        name: newOrgName,
        plan: newOrgPlan,
        settings: { maxEvents: newOrgPlan === 'enterprise' ? 50 : 10 },
      });
      addToast({
        title: 'Organization Created',
        description: `${newOrgName} tenant created successfully.`,
        type: 'success',
      });
      setIsModalOpen(false);
      setNewOrgName('');
      fetchOrgs();
    } catch (err) {
      addToast({
        title: 'Creation Failed',
        description: err.response?.data?.error?.message || 'Failed to create organization',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Organization',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-muted/70 flex items-center justify-center font-bold text-xs">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-[11px] text-muted-foreground font-mono">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Plan Tier',
      accessorKey: 'plan',
      cell: (row) => (
        <Badge variant={row.plan === 'enterprise' ? 'accent' : 'secondary'} className="capitalize">
          {row.plan}
        </Badge>
      ),
    },
    {
      header: 'Tenant Status',
      accessorKey: 'status',
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'destructive'} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Max Quota',
      cell: (row) => (
        <span className="text-xs font-mono">{row.settings?.maxEvents || 10} events</span>
      ),
    },
    {
      header: 'Created',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          size="sm"
          variant={row.status === 'suspended' ? 'outline' : 'ghost'}
          onClick={() => handleToggleStatus(row)}
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            row.status === 'active'
              ? 'text-destructive hover:bg-destructive/10'
              : 'text-emerald-500 hover:bg-emerald-500/10'
          }`}
        >
          {row.status === 'suspended' ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Reinstate
            </>
          ) : (
            <>
              <Ban className="h-3 w-3" />
              Suspend
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Multi-tenant tenant management, enterprise plan quotas, and suspension controls"
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Organization
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={orgs}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Filter organizations..."
        emptyTitle="No organizations found"
      />

      {/* Create Org Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Organization"
        description="Provision a new tenant account with allocated quotas."
      >
        <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Organization Name</label>
            <Input
              placeholder="e.g. Acme Corporation"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Subscription Tier</label>
            <Select
              value={newOrgPlan}
              onChange={(e) => setNewOrgPlan(e.target.value)}
            >
              <option value="starter">Starter (3 events)</option>
              <option value="growth">Growth (10 events)</option>
              <option value="enterprise">Enterprise (50 events, custom branding)</option>
            </Select>
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
              disabled={isSubmitting || !newOrgName}
            >
              {isSubmitting ? 'Creating...' : 'Provision Tenant'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
