import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Moon, Sun, Zap, Calendar, User, LogOut } from 'lucide-react';
import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { ToastContainer } from '../components/ui/toast';
import { CommandMenu } from '../components/shared/CommandMenu';

export function PublicLayout() {
  const { theme, toggleTheme } = useUiStore();
  const { isAuthenticated, user, activeRole, logout } = useAuthStore();
  const navigate = useNavigate();

  const getDashboardPath = () => {
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <CommandMenu />
      <ToastContainer />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span>EventForge</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <Link to="/events" className="hover:text-foreground transition-colors">
              Discover Events
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              Platform
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate(getDashboardPath())}
                  className="text-xs"
                >
                  Dashboard
                </Button>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-xs"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="text-xs"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-xs text-muted-foreground bg-card/20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px]">EventForge Core v1.0.0 • Systems Nominal</span>
          </div>
          <div>© 2026 EventForge Technologies. Enterprise Event Platform.</div>
        </div>
      </footer>
    </div>
  );
}
