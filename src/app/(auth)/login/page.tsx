'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, Loader2, AlertCircle, Mail, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router    = useRouter();
  const supabase  = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    router.push('/market' as never);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm sm:max-w-md">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="w-12 h-12 bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
            <TrendingUp size={22} className="text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            NexusTrade
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            AI Stock Research Terminal
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border p-6 sm:p-8">

          {/* Card heading */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Sign in
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(
                    'w-full pl-9 pr-3 py-2.5 text-sm',
                    'bg-secondary border text-foreground',
                    'placeholder:text-muted-foreground/30',
                    'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
                    'transition-all duration-150',
                    errors.email ? 'border-destructive/60' : 'border-border',
                  )}
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1.5 text-destructive text-xs">
                  <AlertCircle size={11} className="flex-shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                />
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full pl-9 pr-3 py-2.5 text-sm',
                    'bg-secondary border text-foreground',
                    'placeholder:text-muted-foreground/30',
                    'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
                    'transition-all duration-150',
                    errors.password ? 'border-destructive/60' : 'border-border',
                  )}
                />
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 text-destructive text-xs">
                  <AlertCircle size={11} className="flex-shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 bg-destructive/8 border border-destructive/20 px-3 py-2.5">
                <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive text-sm leading-snug">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'py-2.5 text-sm font-semibold transition-all duration-150',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'mt-2',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground/40 font-semibold tracking-widest">
              OR
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-muted-foreground text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-muted-foreground/30 text-xs mt-6">
         
        </p>
      </div>
    </div>
  );
}
