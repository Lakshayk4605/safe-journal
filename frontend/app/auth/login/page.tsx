'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Mail, Lock, Eye, EyeOff, Smartphone, KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';
import { authApi } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, refreshUser } = useAuth();
  
  // Auth Mode: 'password' | 'otp'
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  
  // Password Mode state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP Mode state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!identifier.trim()) {
      setErrors({ identifier: 'Email or Phone Number is required' });
      return;
    }

    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const clean = phoneNumber.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setErrors({ phone: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendPhoneOtp(clean);
      setOtpSent(true);
      setDemoOtpHint(res.data.otp);
      setOtp(res.data.otp);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send OTP. Please try again.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!otp || otp.length < 4) {
      setErrors({ otp: 'Please enter the 6-digit OTP' });
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyPhoneOtp({ phoneNumber, otp });
      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Invalid OTP. Please try again.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col lg:flex-row">
      {/* Left side - Hero (Desktop only) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 to-secondary/20 flex-col items-center justify-center px-8 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-secondary rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-md text-center space-y-6">
          <BookOpen className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-lg text-muted-foreground">
            Continue your journey of self-discovery and mental wellness.
          </p>
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Sign in with Email or Phone Number</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span>Instant 1-Click Phone OTP Login</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>End-to-End Encrypted Journal Space</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Safe Journal</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to access your journal & analytics</p>
          </div>

          {/* Auth Method Tabs */}
          <div className="flex bg-muted/60 p-1.5 rounded-2xl border border-border/50">
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setErrors({}); }}
              className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer ${
                authMethod === 'password'
                  ? 'bg-background text-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Email / Phone
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('otp'); setErrors({}); }}
              className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMethod === 'otp'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone OTP Quick Sign-In
            </button>
          </div>

          {errors.form && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              {errors.form}
            </div>
          )}

          {/* MODE 1: Email / Phone Password Form */}
          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Identifier Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email or Phone Number</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="alex@example.com or +91 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                    className={`pl-10 py-6 rounded-2xl ${errors.identifier ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.identifier && <p className="text-xs text-destructive">{errors.identifier}</p>}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={`pl-10 pr-10 py-6 rounded-2xl ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full py-6 font-bold rounded-2xl cursor-pointer">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            /* MODE 2: Phone OTP Form */
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mobile Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={loading}
                        className={`pl-10 py-6 rounded-2xl ${errors.phone ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full py-6 font-bold rounded-2xl cursor-pointer bg-gradient-to-r from-primary to-secondary">
                    {loading ? 'Sending Verification Code...' : 'Get OTP Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-600 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      OTP Code sent to +91 {phoneNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] underline cursor-pointer text-foreground"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center justify-between">
                      <span>Enter 6-Digit OTP</span>
                      {demoOtpHint && <span className="text-xs font-mono text-primary">Demo OTP: {demoOtpHint}</span>}
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={loading}
                        className={`pl-10 py-6 rounded-2xl tracking-widest text-lg font-mono ${errors.otp ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full py-6 font-bold rounded-2xl cursor-pointer">
                    {loading ? 'Verifying & Signing In...' : 'Verify OTP & Sign In'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Footer link */}
          <p className="text-center text-sm text-muted-foreground pt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
              Create account
            </Link>
          </p>
          
          {/* Privacy Notice */}
          <p className="text-xs text-muted-foreground text-center">
            Your data is encrypted and secure. We never share your personal information.
          </p>
        </div>
      </div>
    </div>
  );
}
