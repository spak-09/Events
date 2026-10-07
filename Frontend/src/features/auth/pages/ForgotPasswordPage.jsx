import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useUiStore } from '../../../stores/uiStore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export function ForgotPasswordPage() {
  const { addToast } = useUiStore();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setSubmitted(true);
      addToast({
        title: 'Instructions Sent',
        description: 'Password reset link sent to your email.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Request Failed',
        description: err.response?.data?.error?.message || 'Could not process request',
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-xs text-muted-foreground">Receive a verification link to reset your account password</p>
        </div>

        <Card className="shadow-card border-border/80">
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-semibold">Check your inbox</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  If an account exists for that email, we have sent instructions to reset your password.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
