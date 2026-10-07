import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
});

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const { addToast } = useUiStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await registerUser(values.name, values.email, values.password);
      addToast({
        title: 'Account Created',
        description: 'Welcome to EventForge!',
        type: 'success',
      });
      navigate('/attendee/tickets');
    } catch (err) {
      addToast({
        title: 'Registration Failed',
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your Account</h1>
          <p className="text-xs text-muted-foreground">Join conferences and manage event credentials</p>
        </div>

        <Card className="shadow-card border-border/80">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Full Name</label>
                <Input
                  icon={User}
                  placeholder="Alex Mercer"
                  autoComplete="name"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Work Email</label>
                <Input
                  icon={Mail}
                  placeholder="alex@company.com"
                  autoComplete="email"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Password</label>
                <Input
                  icon={Lock}
                  type="password"
                  placeholder="Use 8+ chars with a mix of case, numbers & symbols"
                  autoComplete="new-password"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Get Started'}
                {!isLoading && <ArrowRight className="h-4 w-4 ml-1.5" />}
              </Button>
            </CardContent>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
