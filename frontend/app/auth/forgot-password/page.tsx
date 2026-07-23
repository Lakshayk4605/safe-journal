'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Mail, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      // Backend always responds success-shaped (regardless of whether the email
      // is registered) to avoid leaking account existence — so we always show
      // the "check your email" state on a successful request.
      await authApi.forgotPassword(email);
    } catch {
      // Even on an unexpected error, don't reveal account existence either way.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-8">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Safe Journal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            {submitted
              ? 'Check your email for reset instructions'
              : 'Enter your email and we\'ll send you a link to reset your password'}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            {/* Success State */}
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
              <div className="inline-block p-4 bg-primary/10 rounded-full">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Email Sent!</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent password reset instructions to <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Check your spam folder if you don&apos;t see the email within a few minutes.
              </p>
            </div>

            <Button
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              variant="outline"
              className="w-full"
            >
              Send to Another Email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  className={`pl-10 ${error ? 'border-destructive' : ''}`}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 mt-6"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
