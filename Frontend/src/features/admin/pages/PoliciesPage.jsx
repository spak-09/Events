import React, { useState, useEffect } from 'react';
import { Sliders, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';

export function PoliciesPage() {
  const [policies, setPolicies] = useState({
    maintenanceMode: false,
    allowPublicRegistration: true,
    maxWaitlistDepth: 50,
    defaultTimezone: 'America/New_York',
    maxAttachmentSizeMb: 25,
    sessionConflictWindowMinutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useUiStore();

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await apiClient.get('/policies');
        if (res.data?.data) {
          setPolicies((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        // use defaults
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.put('/policies', policies);
      addToast({
        title: 'Policies Updated',
        description: 'Global platform configuration saved successfully.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Save Failed',
        description: err.response?.data?.error?.message || 'Failed to update policies',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Global Policies" description="Platform configuration and runtime controls" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Global Policies"
        description="Platform parameters, default concurrency controls, and system flags"
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-semibold">Security & Access Toggles</CardTitle>
            <CardDescription>Controls user registration and maintenance availability.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
              <div>
                <div className="text-xs font-semibold">Public User Registration</div>
                <div className="text-[11px] text-muted-foreground">Allow new visitors to register platform accounts.</div>
              </div>
              <input
                type="checkbox"
                checked={policies.allowPublicRegistration}
                onChange={(e) => setPolicies({ ...policies, allowPublicRegistration: e.target.checked })}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
              <div>
                <div className="text-xs font-semibold">Platform Maintenance Mode</div>
                <div className="text-[11px] text-muted-foreground">Restrict non-admin accounts to read-only mode.</div>
              </div>
              <input
                type="checkbox"
                checked={policies.maintenanceMode}
                onChange={(e) => setPolicies({ ...policies, maintenanceMode: e.target.checked })}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-semibold">Capacity & Scheduling Parameters</CardTitle>
            <CardDescription>Fine-tune waitlist depths and upload ceilings.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Default Max Waitlist Depth</label>
              <Input
                type="number"
                value={policies.maxWaitlistDepth}
                onChange={(e) => setPolicies({ ...policies, maxWaitlistDepth: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Max Asset Upload Limit (MB)</label>
              <Input
                type="number"
                value={policies.maxAttachmentSizeMb}
                onChange={(e) => setPolicies({ ...policies, maxAttachmentSizeMb: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Platform Default Timezone</label>
              <Select
                value={policies.defaultTimezone}
                onChange={(e) => setPolicies({ ...policies, defaultTimezone: e.target.value })}
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
