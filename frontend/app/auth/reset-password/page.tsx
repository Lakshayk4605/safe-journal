'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api-client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to reset password. The token may be expired or invalid.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Safe Journal</span>
          </Link>
          <h1 className="text-3xl font-bold">Set New Password</h1>
          <p className="text-muted-foreground text-sm">
            {success ? 'Your password has been successfully updated' : 'Enter your new password below'}
          </p>
        </div>

        {success ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-xl">
            <div className="inline-flex p-4 bg-emerald-500/15 text-emerald-500 rounded-full">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Password Reset Complete!</h2>
              <p className="text-sm text-muted-foreground">
                You can now log in to your Safe Journal account using your new password.
              </p>
            </div>
            <Button onClick={() => router.push('/auth/login')} className="w-full py-6 font-bold rounded-xl cursor-pointer">
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-card/60 border border-border/60 p-6 md:p-8 rounded-3xl shadow-xl">
            {error && (
              <div className="text-xs font-semibold text-destructive bg-destructive/15 border border-destructive/30 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 py-6 rounded-2xl border-border/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 py-6 rounded-2xl border-border/60"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full py-6 font-bold rounded-2xl cursor-pointer">
              {loading ? 'Updating Password...' : 'Reset Password'}
            </Button>

            <div className="text-center pt-2">
              <Link href="/auth/login" className="text-xs font-semibold text-primary hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
