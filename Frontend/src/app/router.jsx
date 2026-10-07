import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardShell } from '../layouts/DashboardShell';
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole, ForbiddenScreen } from './guards/RequireRole';

// Public pages
import { LandingPage } from '../features/public/pages/LandingPage';
import { EventDiscoveryPage } from '../features/public/pages/EventDiscoveryPage';
import { EventDetailPage } from '../features/public/pages/EventDetailPage';

// Auth pages
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';

// Admin pages
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { OrganizationsPage } from '../features/admin/pages/OrganizationsPage';
import { UsersPage } from '../features/admin/pages/UsersPage';
import { PoliciesPage } from '../features/admin/pages/PoliciesPage';

// Organizer pages
import { OrganizerDashboardPage } from '../features/organizer/pages/OrganizerDashboardPage';
import { CreateEventPage } from '../features/organizer/pages/CreateEventPage';
import { EventWorkspacePage } from '../features/organizer/pages/EventWorkspacePage';

// Staff pages
import { StaffDashboardPage } from '../features/staff/pages/StaffDashboardPage';
import { ScannerPage } from '../features/staff/pages/ScannerPage';

// Speaker pages
import { SpeakerDashboardPage } from '../features/speaker/pages/SpeakerDashboardPage';
import { SpeakerProfilePage } from '../features/speaker/pages/SpeakerProfilePage';
import { SpeakerMaterialsPage } from '../features/speaker/pages/SpeakerMaterialsPage';

// Attendee pages
import { RegistrationStepperPage } from '../features/attendee/pages/RegistrationStepperPage';
import { MyTicketsPage } from '../features/attendee/pages/MyTicketsPage';
import { AgendaBuilderPage } from '../features/attendee/pages/AgendaBuilderPage';

// Sponsor pages
import { SponsorDashboardPage } from '../features/sponsor/pages/SponsorDashboardPage';
import { DeliverablesPage } from '../features/sponsor/pages/DeliverablesPage';

export const router = createBrowserRouter([
  // Public & Attendee Discovery routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'events', element: <EventDiscoveryPage /> },
      { path: 'events/:id', element: <EventDetailPage /> },
      {
        path: 'events/:eventId/register',
        element: (
          <RequireAuth>
            <RegistrationStepperPage />
          </RequireAuth>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: '403', element: <ForbiddenScreen requiredRole="Authorized Role" userRole="Current" /> },
    ],
  },

  // Authenticated Role Dashboards
  {
    path: '/',
    element: (
      <RequireAuth>
        <DashboardShell />
      </RequireAuth>
    ),
    children: [
      // Platform Admin routes
      {
        path: 'admin',
        element: (
          <RequireRole allowedRoles={['platform_admin']}>
            <AdminDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/organizations',
        element: (
          <RequireRole allowedRoles={['platform_admin']}>
            <OrganizationsPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <RequireRole allowedRoles={['platform_admin']}>
            <UsersPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/policies',
        element: (
          <RequireRole allowedRoles={['platform_admin']}>
            <PoliciesPage />
          </RequireRole>
        ),
      },

      // Organizer routes
      {
        path: 'organizer',
        element: (
          <RequireRole allowedRoles={['organizer', 'platform_admin']}>
            <OrganizerDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'organizer/create-event',
        element: (
          <RequireRole allowedRoles={['organizer', 'platform_admin']}>
            <CreateEventPage />
          </RequireRole>
        ),
      },
      {
        path: 'organizer/events/:id/workspace',
        element: (
          <RequireRole allowedRoles={['organizer', 'platform_admin']}>
            <EventWorkspacePage />
          </RequireRole>
        ),
      },

      // Staff routes
      {
        path: 'staff',
        element: (
          <RequireRole allowedRoles={['staff', 'organizer', 'platform_admin']}>
            <StaffDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'staff/scanner',
        element: (
          <RequireRole allowedRoles={['staff', 'organizer', 'platform_admin']}>
            <ScannerPage />
          </RequireRole>
        ),
      },

      // Speaker routes
      {
        path: 'speaker',
        element: (
          <RequireRole allowedRoles={['speaker', 'organizer', 'platform_admin']}>
            <SpeakerDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'speaker/profile',
        element: (
          <RequireRole allowedRoles={['speaker', 'organizer', 'platform_admin']}>
            <SpeakerProfilePage />
          </RequireRole>
        ),
      },
      {
        path: 'speaker/materials',
        element: (
          <RequireRole allowedRoles={['speaker', 'organizer', 'platform_admin']}>
            <SpeakerMaterialsPage />
          </RequireRole>
        ),
      },

      // Attendee routes
      { path: 'attendee/tickets', element: <MyTicketsPage /> },
      { path: 'attendee/agenda', element: <AgendaBuilderPage /> },

      // Sponsor routes
      {
        path: 'sponsor',
        element: (
          <RequireRole allowedRoles={['sponsor', 'organizer', 'platform_admin']}>
            <SponsorDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: 'sponsor/deliverables',
        element: (
          <RequireRole allowedRoles={['sponsor', 'organizer', 'platform_admin']}>
            <DeliverablesPage />
          </RequireRole>
        ),
      },
    ],
  },

  // Fallback 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
