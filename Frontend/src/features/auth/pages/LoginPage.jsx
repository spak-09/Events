import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { addToast } = useUiStore();
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      const res = await login(values.email, values.password);
      addToast({
        title: 'Welcome Back',
        description: `Signed in as ${res.user.name}`,
        type: 'success',
      });

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Role-specific redirect
      switch (res.defaultRole) {
        case 'platform_admin':
          navigate('/admin');
          break;
        case 'organizer':
          navigate('/organizer');
          break;
        case 'staff':
          navigate('/staff');
          break;
        case 'speaker':
          navigate('/speaker');
          break;
        case 'sponsor':
          navigate('/sponsor');
          break;
        default:
          navigate('/attendee/tickets');
      }
    } catch (err) {
      addToast({
        title: 'Sign In Failed',
        description: err.message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card mb-2">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to EventForge</h1>
          <p className="text-xs text-muted-foreground">Sign in to your corporate event workspace</p>
        </div>

        <Card className="shadow-card border-border/80">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Email</label>
                <Input
                  icon={Mail}
                  placeholder="name@company.com"
                  autoComplete="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <Input
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
                {!isLoading && <ArrowRight className="h-4 w-4 ml-1.5" />}
              </Button>
            </CardContent>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
