import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ForbiddenScreen } from './RequireRole';

export function RequireEventRole({ allowedRoles = [], children }) {
  const { eventId } = useParams();
  const { user, memberships } = useAuthStore();

  // Platform admin access must come from the authenticated user, not a saved UI role.
  if (user?.globalRole === 'platform_admin') {
    return children;
  }

  // Find membership for this event
  const member = memberships.find((m) => {
    const mEventId = typeof m.event === 'object' && m.event !== null
      ? m.event.id || m.event._id
      : m.event;
    return String(mEventId) === eventId && m.status === 'active';
  });

  if (!member || !allowedRoles.includes(member.role)) {
    return <ForbiddenScreen requiredRole={allowedRoles.join(', ')} userRole="No Membership" />;
  }

  return children;
}
