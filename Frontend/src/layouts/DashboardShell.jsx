import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  Building,
  Calendar,
  Users,
  ShieldAlert,
  QrCode,
  Mic,
  Ticket,
  Briefcase,
  Sliders,
  LogOut,
  Moon,
  Sun,
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  PlusCircle,
  FileCheck,
} from 'lucide-react';
import { getAvailableRoles, useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CommandMenu } from '../components/shared/CommandMenu';
import { ToastContainer } from '../components/ui/toast';
import { NotificationsBell } from '../components/shared/NotificationsBell';
import { cn } from '../lib/utils';

export function DashboardShell() {
  const { user, memberships, activeRole, setActiveRole, logout } = useAuthStore();
  const { theme, toggleTheme, isSidebarOpen, toggleSidebar, setCommandPaletteOpen } = useUiStore();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Role -> Navigation configuration
  const roleMenus = {
    platform_admin: [
      { to: '/admin', label: 'Overview', icon: Building, end: true },
      { to: '/admin/organizations', label: 'Organizations', icon: Building },
      { to: '/admin/users', label: 'User Directory', icon: Users },
      { to: '/admin/policies', label: 'Global Policies', icon: Sliders },
    ],
    organizer: [
      { to: '/organizer', label: 'Events Hub', icon: Calendar, end: true },
      { to: '/organizer/create-event', label: 'New Event', icon: PlusCircle },
    ],
    staff: [
      { to: '/staff', label: 'Check-In Hub', icon: QrCode, end: true },
      { to: '/staff/scanner', label: 'Live Scanner', icon: QrCode },
    ],
    speaker: [
      { to: '/speaker', label: 'My Sessions', icon: Mic, end: true },
      { to: '/speaker/profile', label: 'Speaker Profile', icon: User },
      { to: '/speaker/materials', label: 'Materials', icon: FileCheck },
    ],
    attendee: [
      { to: '/events', label: 'Explore Events', icon: Calendar },
      { to: '/attendee/tickets', label: 'My Tickets', icon: Ticket },
      { to: '/attendee/agenda', label: 'Agenda Builder', icon: Calendar },
    ],
    sponsor: [
      { to: '/sponsor', label: 'Overview', icon: Briefcase, end: true },
      { to: '/sponsor/deliverables', label: 'Deliverables', icon: FileCheck },
    ],
  };

  const currentMenu = roleMenus[activeRole] || roleMenus.attendee;

  const rolesList = [
    { id: 'platform_admin', label: 'Platform Admin', path: '/admin' },
    { id: 'organizer', label: 'Organizer', path: '/organizer' },
    { id: 'staff', label: 'Staff', path: '/staff' },
    { id: 'speaker', label: 'Speaker', path: '/speaker' },
    { id: 'attendee', label: 'Attendee', path: '/attendee/tickets' },
    { id: 'sponsor', label: 'Sponsor', path: '/sponsor' },
  ].filter((role) => getAvailableRoles(user, memberships).includes(role.id));

  const handleRoleSwitch = (role) => {
    if (!getAvailableRoles(user, memberships).includes(role.id)) return;
    setActiveRole(role.id);
    setRoleDropdownOpen(false);
    navigate(role.path);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <CommandMenu />
      <ToastContainer />

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border/70 bg-card transition-all duration-200 z-30 shrink-0',
          isSidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold tracking-tight text-sm truncate">EventForge</span>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Role Selector Pill */}
        {isSidebarOpen && rolesList.length > 1 && (
          <div className="p-3 border-b border-border/40">
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="truncate capitalize font-semibold">
                    {rolesList.find((r) => r.id === activeRole)?.label || activeRole}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full rounded-xl border border-border bg-card shadow-elevated p-1 z-50">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1 tracking-wider">
                    Switch Role View
                  </div>
                  {rolesList.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors',
                        activeRole === r.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                    >
                      <span>{r.label}</span>
                      {activeRole === r.id && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {isSidebarOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User & Settings Footer */}
        <div className="p-3 border-t border-border/50 space-y-2">
          {isSidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-7 w-7 rounded-full bg-muted/80 flex items-center justify-center font-bold text-xs text-foreground shrink-0 border border-border">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium truncate">{user?.name || 'User'}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="mx-auto"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
          {/* Left: Mobile Brand & Command search */}
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                <Zap className="h-3.5 w-3.5 fill-current" />
              </div>
              <span className="font-bold text-sm">EventForge</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 text-muted-foreground h-8 px-3 text-xs rounded-xl"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search actions...</span>
              <kbd className="ml-2 inline-flex h-4 items-center gap-1 rounded border border-border bg-muted/50 px-1 font-mono text-[9px]">
                ⌘K
              </kbd>
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick role switcher badge for mobile / quick check */}
            {rolesList.length > 1 && (
              <div className="relative md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="text-[11px] h-7 px-2 capitalize"
              >
                {activeRole}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              {roleDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-card shadow-elevated p-1 z-50">
                  {rolesList.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left',
                        activeRole === r.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground'
                      )}
                    >
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
              </div>
            )}

            <NotificationsBell />

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border/60">
              <span className="text-xs font-medium text-foreground">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (Mobile-first, one-hand use) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border/80 bg-background/95 backdrop-blur-lg px-2 py-1.5">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] mt-0.5 max-w-[60px] truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
