import React, { useState, useEffect } from 'react';
import { Users, Ban, CheckCircle, Shield } from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { DataTable } from '../../../components/shared/DataTable';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';
import { formatDate } from '../../../lib/utils';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useUiStore();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/users?limit=50');
      const items = res.data?.data?.items || res.data?.data || [];
      setUsers(items);
    } catch (err) {
      addToast({
        title: 'Fetch Failed',
        description: 'Could not load user directory.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;
    try {
      await apiClient.patch(`/users/${user._id}/status`, { isActive: nextStatus });
      addToast({
        title: `User ${nextStatus ? 'Activated' : 'Suspended'}`,
        description: `${user.name} is now ${nextStatus ? 'active' : 'suspended'}.`,
        type: nextStatus ? 'success' : 'warning',
      });
      fetchUsers();
    } catch (err) {
      addToast({
        title: 'Update Failed',
        description: err.response?.data?.error?.message || 'Could not change user status',
        type: 'error',
      });
    }
  };

  const columns = [
    {
      header: 'User Profile',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-muted/80 flex items-center justify-center font-bold text-xs text-foreground border border-border">
            {row.name ? row.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-[11px] text-muted-foreground font-mono">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Global Role',
      accessorKey: 'globalRole',
      cell: (row) => (
        <Badge
          variant={row.globalRole === 'platform_admin' ? 'default' : 'secondary'}
          className="capitalize text-[11px]"
        >
          {row.globalRole === 'platform_admin' ? '★ Super Admin' : 'Standard User'}
        </Badge>
      ),
    },
    {
      header: 'Account Status',
      accessorKey: 'isActive',
      cell: (row) => (
        <Badge variant={row.isActive ? 'success' : 'destructive'}>
          {row.isActive ? 'Active' : 'Suspended'}
        </Badge>
      ),
    },
    {
      header: 'Registered',
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          size="sm"
          variant={row.isActive ? 'ghost' : 'outline'}
          onClick={() => handleToggleStatus(row)}
          disabled={row.globalRole === 'platform_admin'}
          className={`h-7 px-2.5 text-xs gap-1.5 ${
            row.isActive
              ? 'text-destructive hover:bg-destructive/10'
              : 'text-emerald-500 hover:bg-emerald-500/10'
          }`}
        >
          {row.isActive ? (
            <>
              <Ban className="h-3 w-3" />
              Suspend
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3" />
              Activate
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Directory"
        description="Global platform accounts, role provisioning, and account status controls"
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Filter by name or email..."
        emptyTitle="No users found"
      />
    </div>
  );
}
