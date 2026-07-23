'use client';

import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPasscode = localStorage.getItem('app_lock_passcode');
      const sessionUnlocked = sessionStorage.getItem('app_unlocked') === 'true';
      if (savedPasscode && !sessionUnlocked) {
        setIsLocked(true);
      }
    }
  }, []);

  const handlePinClick = (num: string) => {
    setError(false);
    if (passcode.length < 4) {
      const nextPin = passcode + num;
      setPasscode(nextPin);

      if (nextPin.length === 4) {
        const saved = localStorage.getItem('app_lock_passcode');
        if (nextPin === saved) {
          sessionStorage.setItem('app_unlocked', 'true');
          setIsLocked(false);
          setPasscode('');
        } else {
          setError(true);
          setPasscode(''); // Reset on mismatch
        }
      }
    }
  };

  const handleClear = () => {
    setPasscode('');
    setError(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-background/85 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
        <div className="max-w-md w-full flex flex-col items-center justify-center space-y-8 p-8 text-center">
          <div className="relative flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full border border-primary/20 shadow-lg animate-bounce">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">App Locked</h2>
            <p className="text-sm text-muted-foreground">Enter your 4-digit passcode to unlock Safe Journal</p>
          </div>

          <div className="flex gap-4 items-center justify-center py-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border border-primary/50 transition-all ${
                  idx < passcode.length
                    ? 'bg-primary scale-110 shadow-md shadow-primary/30'
                    : 'bg-transparent'
                } ${error ? 'border-destructive bg-destructive' : ''}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive font-semibold animate-pulse">
              Incorrect Passcode. Please try again.
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 max-w-[280px] w-full pt-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handlePinClick(num)}
                className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-xl font-bold hover:bg-accent active:scale-90 transition-all cursor-pointer select-none"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-semibold hover:text-destructive active:scale-90 transition-all cursor-pointer select-none text-muted-foreground"
            >
              Clear
            </button>
            <button
              onClick={() => handlePinClick('0')}
              className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-xl font-bold hover:bg-accent active:scale-90 transition-all cursor-pointer select-none"
            >
              0
            </button>
            <div className="w-16 h-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex overflow-x-hidden">
      {/* Immersive Dynamic Ambient Backdrop */}
      <div className="theme-ambient-backdrop fixed inset-0 pointer-events-none z-0" />
      <Navigation />
      <main className="relative z-10 ml-0 md:ml-64 flex-1 min-h-screen pb-20 md:pb-0 bg-transparent">
        <div className="print-header">Safe Journal</div>
        {children}
      </main>
    </div>
  );
}
