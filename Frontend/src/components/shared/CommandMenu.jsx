import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Calendar,
  QrCode,
  Mic,
  Briefcase,
  Ticket,
  Moon,
  Sun,
  LogOut,
  Building,
  Users,
  Settings,
} from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { getAvailableRoles, useAuthStore } from '../../stores/authStore';

export function CommandMenu() {
  const { commandPaletteOpen, setCommandPaletteOpen, theme, toggleTheme } = useUiStore();
  const { user, memberships, setActiveRole, logout } = useAuthStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const availableRoles = getAvailableRoles(user, memberships);
  const actions = [
    {
      id: 'admin',
      label: 'Admin Overview',
      category: 'Navigation',
      icon: Building,
      roles: ['platform_admin'],
      run: () => {
        setActiveRole('platform_admin');
        navigate('/admin');
      },
    },
    {
      id: 'orgs',
      label: 'Organizations',
      category: 'Navigation',
      icon: Building,
      roles: ['platform_admin'],
      run: () => navigate('/admin/organizations'),
    },
    {
      id: 'users',
      label: 'User Directory',
      category: 'Navigation',
      icon: Users,
      roles: ['platform_admin'],
      run: () => navigate('/admin/users'),
    },
    {
      id: 'organizer',
      label: 'Organizer Workspace',
      category: 'Navigation',
      icon: Calendar,
      roles: ['organizer', 'platform_admin'],
      run: () => {
        setActiveRole('organizer');
        navigate('/organizer');
      },
    },
    {
      id: 'create-event',
      label: 'Create New Event',
      category: 'Actions',
      icon: Calendar,
      roles: ['organizer', 'platform_admin'],
      run: () => navigate('/organizer/create-event'),
    },
    {
      id: 'staff',
      label: 'Staff Portal & Scanner',
      category: 'Navigation',
      icon: QrCode,
      roles: ['staff', 'organizer', 'platform_admin'],
      run: () => {
        setActiveRole('staff');
        navigate('/staff');
      },
    },
    {
      id: 'speaker',
      label: 'Speaker Sessions & Materials',
      category: 'Navigation',
      icon: Mic,
      roles: ['speaker', 'organizer', 'platform_admin'],
      run: () => {
        setActiveRole('speaker');
        navigate('/speaker');
      },
    },
    {
      id: 'attendee-tickets',
      label: 'My Tickets',
      category: 'Navigation',
      icon: Ticket,
      roles: ['attendee'],
      run: () => {
        setActiveRole('attendee');
        navigate('/attendee/tickets');
      },
    },
    {
      id: 'attendee-agenda',
      label: 'Agenda Builder',
      category: 'Navigation',
      icon: Calendar,
      roles: ['attendee'],
      run: () => {
        setActiveRole('attendee');
        navigate('/attendee/agenda');
      },
    },
    {
      id: 'sponsor',
      label: 'Sponsor Portal & Deliverables',
      category: 'Navigation',
      icon: Briefcase,
      roles: ['sponsor', 'organizer', 'platform_admin'],
      run: () => {
        setActiveRole('sponsor');
        navigate('/sponsor');
      },
    },
    {
      id: 'theme',
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      run: () => toggleTheme(),
    },
    {
      id: 'logout',
      label: 'Log out',
      category: 'Account',
      icon: LogOut,
      run: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const filtered = actions.filter((act) => {
    const matchesQuery = act.label.toLowerCase().includes(query.toLowerCase()) ||
      act.category.toLowerCase().includes(query.toLowerCase());
    const hasRole = !act.roles || act.roles.some((role) => availableRoles.includes(role));
    const requiresAuthentication = act.id === 'logout';
    return matchesQuery && hasRole && (!requiresAuthentication || !!user);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.15 }}
          className="relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card shadow-elevated overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-border/70 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground mr-3" />
            <input
              type="text"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Type a command or jump to page..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matching commands
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.run();
                      setCommandPaletteOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-foreground hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="rounded-lg p-1.5 bg-muted/60 text-muted-foreground group-hover:text-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 font-medium">{item.label}</div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
