'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, Loader2, CheckCircle, AlertCircle, Mail, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const SignupSchema = z
  .object({
    email:           z.string().email('Invalid email address'),
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof SignupSchema>;

// ─── Input field wrapper ──────────────────────────────────────────────────────

function Field({
  id,
  label,
  icon: Icon,
  type,
  placeholder,
  error,
  registration,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  type: string;
  placeholder: string;
  error?: string | undefined;  
  registration: ReturnType<ReturnType<typeof useForm<SignupForm>>['register']>;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
        />
        <input
          {...registration}
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={id}
          className={cn(
            'w-full pl-9 pr-3 py-2.5 text-sm',
            'bg-secondary border text-foreground',
            'placeholder:text-muted-foreground/30',
            'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30',
            'transition-all duration-150',
            error ? 'border-destructive/60' : 'border-border',
          )}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-destructive text-xs">
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm sm:max-w-md text-center">
        <div className="bg-card border border-border p-8 sm:p-10">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={26} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
            Check your email
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            We sent you a confirmation link. Click it to activate your account
            and start trading.
          </p>
          <div className="mt-6 pt-5 border-t border-border">
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(SignupSchema) });

  const onSubmit = async (data: SignupForm) => {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  { emailRedirectTo: `${window.location.origin}/watchlist` },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setSuccess(true);
  };

  if (success) return <SuccessScreen />;

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
              Create account
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Free forever — no credit card required
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <Field
              id="email"
              label="Email"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              registration={register('email')}
            />

            <Field
              id="new-password"
              label="Password"
              icon={Lock}
              type="password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              registration={register('password')}
            />

            <Field
              id="new-password-confirm"
              label="Confirm Password"
              icon={ShieldCheck}
              type="password"
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
              registration={register('confirmPassword')}
            />

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
                'w-full flex items-center justify-center gap-2 mt-2',
                'py-2.5 text-sm font-semibold transition-all duration-150',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
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

          {/* Sign in link */}
          <p className="text-center text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign in
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
