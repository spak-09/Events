import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, userHasRole } from '../../stores/authStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function ForbiddenScreen({ requiredRole, userRole }) {
  const navigate = useNavigate();
  const { activeRole } = useAuthStore();

  const getFallbackDashboard = () => {
    switch (activeRole) {
      case 'platform_admin':
        return '/admin';
      case 'organizer':
        return '/organizer';
      case 'staff':
        return '/staff';
      case 'speaker':
        return '/speaker';
      case 'sponsor':
        return '/sponsor';
      default:
        return '/attendee/tickets';
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground">403 Access Restricted</h1>
      <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
        Your current role does not have authorization for this area.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(getFallbackDashboard())}
          className="gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Portal
        </Button>
      </div>
    </div>
  );
}

export function RequireRole({ allowedRoles = [], children }) {
  const { user, memberships, activeRole } = useAuthStore();
  const hasRole = allowedRoles.some((role) => userHasRole(user, memberships, role));

  if (!hasRole) {
    return <ForbiddenScreen requiredRole={allowedRoles.join(', ')} userRole={activeRole} />;
  }

  return children;
}
