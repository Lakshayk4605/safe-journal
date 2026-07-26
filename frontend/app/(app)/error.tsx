'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Safe Journal Sanctuary Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30 shadow-lg animate-bounce">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-serif">
          Sanctuary State Reset Required
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your journal data is completely safe & encrypted. A temporary layout glitch occurred. Tap below to reload your sanctuary.
        </p>
        {error?.message && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-mono text-destructive text-left overflow-x-auto">
            {error.message}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="bg-gradient-to-r from-teal-600 to-primary hover:from-teal-700 hover:to-primary/90 text-white font-bold py-5 px-6 rounded-2xl cursor-pointer shadow-lg gap-2"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          Reload Sanctuary
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
          className="rounded-2xl font-bold py-5 px-6 border-border cursor-pointer gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
