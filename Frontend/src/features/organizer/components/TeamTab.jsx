import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Trash2, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import apiClient from '../../../lib/axios';
import { useUiStore } from '../../../stores/uiStore';

export function TeamTab({ eventId }) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useUiStore();

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/events/${eventId}/members`);
      setMembers(res.data?.data?.items || res.data?.data || []);
    } catch (err) {
      // quiet fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [eventId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!userEmail) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/events/${eventId}/members`, {
        email: userEmail,
        role,
      });
      addToast({ title: 'Team Member Added', type: 'success' });
      setIsModalOpen(false);
      setUserEmail('');
      fetchMembers();
    } catch (err) {
      addToast({ title: 'Failed to Add Member', description: err.response?.data?.error?.message || err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Revoke access for this member?')) return;
    try {
      await apiClient.delete(`/events/${eventId}/members/${memberId}`);
      addToast({ title: 'Member Removed', type: 'info' });
      fetchMembers();
    } catch (err) {
      addToast({ title: 'Remove Failed', description: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Event Operations Team</h3>
          <p className="text-xs text-muted-foreground">Manage RBAC permissions for organizers, scanners, and floor staff.</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => {
          const u = m.user || {};
          return (
            <Card key={m._id} className="p-5 flex items-center justify-between shadow-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted/80 flex items-center justify-center font-bold text-sm text-foreground border border-border">
                  {u.name ? u.name[0].toUpperCase() : 'M'}
                </div>
                <div>
                  <div className="font-semibold text-sm">{u.name || 'Team Member'}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[140px]">
                    {u.email}
                  </div>
                  <Badge variant="secondary" className="capitalize text-[10px] mt-1">
                    {m.role}
                  </Badge>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveMember(m._id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite Event Member"
        description="Grant event-scoped credentials to a platform user."
      >
        <form onSubmit={handleAddMember} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">User Email</label>
            <Input
              type="email"
              placeholder="e.g. staff1@eventforge.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Event Scope Role</label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="staff">Staff (QR scanner, check-in counters)</option>
              <option value="organizer">Co-Organizer (Full event control)</option>
              <option value="speaker">Speaker (Presenter access)</option>
              <option value="sponsor">Sponsor (Deliverable submissions)</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting...' : 'Add to Team'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
