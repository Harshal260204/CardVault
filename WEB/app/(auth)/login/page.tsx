'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, persistAuth } from '@/lib/api';
import { axios, login } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { isWebAdminRole } from '@/lib/roles';
import { loginSchema, type LoginFormValues } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

function FloatingCard({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.div
      className={`absolute rounded-lg border border-white/10 bg-white/5 shadow-lg ${className}`}
      animate={{ y: [0, -12, 0], rotate: [0, 2, 0] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
      aria-hidden
    >
      <div className="flex h-full w-full flex-col justify-end p-3">
        <div className="h-2 w-16 rounded bg-white/20" />
        <div className="mt-2 h-1.5 w-24 rounded bg-white/10" />
      </div>
    </motion.div>
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string }; message?: string };
    return data?.error?.message ?? data?.message ?? 'Sign in failed. Check your credentials.';
  }
  return 'Sign in failed. Please try again.';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('error') === 'admin_only') {
      setFormError('This portal is for managers and super admins only. Sales users should use the CardVault mobile app.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const { user, tokens } = await login(api, values.email, values.password);
      if (!isWebAdminRole(user.role)) {
        setFormError('Sales accounts must sign in via the CardVault mobile app.');
        return;
      }
      persistAuth(tokens.accessToken, tokens.refreshToken, user, tokens.expiresIn);
      setSession(user, tokens.accessToken, tokens.refreshToken);
      const from = searchParams.get('from');
      router.push(from?.startsWith('/admin') ? from : '/admin/dashboard');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <div className="login-gradient relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <FloatingCard className="left-[8%] top-[18%] h-28 w-44" delay={0} />
      <FloatingCard className="right-[10%] top-[22%] h-32 w-40 opacity-80" delay={1.2} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card relative z-10 w-full max-w-md p-8"
      >
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/30">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">CardVault Admin</h1>
          <p className="mt-2 text-sm text-white/70">Manager & platform admin console</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError ? (
            <p className="rounded-lg bg-error/20 px-3 py-2 text-center text-sm text-red-100">
              {formError}
            </p>
          ) : null}
          <Input
            id="email"
            type="email"
            label="Email"
            labelClassName="text-white/70"
            placeholder="manager@cardvault.local"
            autoComplete="email"
            error={errors.email?.message}
            className="border-white/20 bg-white/90 text-zinc-900 placeholder:text-zinc-400"
            {...register('email')}
          />
          <Input
            id="password"
            type="password"
            label="Password"
            labelClassName="text-white/70"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            className="border-white/20 bg-white/90 text-zinc-900 placeholder:text-zinc-400"
            {...register('password')}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
          <p className="text-center text-xs text-white/50">
            Demo: manager@cardvault.local or admin@cardvault.local / Password123!
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary" />}>
      <LoginForm />
    </Suspense>
  );
}
