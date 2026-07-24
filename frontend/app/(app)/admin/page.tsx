'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { adminApi, AdminUserEntry } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Lock, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Calendar, 
  User, 
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';

const moodLabels: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GREAT: 'Great',
  GOOD: 'Good',
  OKAY: 'Okay',
  SAD: 'Sad',
  ANXIOUS: 'Anxious',
};

const moodBgColors: Record<string, string> = {
  EXCELLENT: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  GREAT: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  GOOD: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  OKAY: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  SAD: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  ANXIOUS: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

function EntryCard({ entry }: { entry: AdminUserEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const wordLimit = 40;
  const words = entry.content.split(/\s+/);
  const isLong = words.length > wordLimit;

  const displayContent = isExpanded 
    ? entry.content 
    : words.slice(0, wordLimit).join(' ') + (isLong ? '...' : '');

  const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const typeConfig = {
    journal: {
      label: 'Journal',
      bg: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      icon: BookOpen,
    },
    gratitude: {
      label: 'Gratitude',
      bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      icon: Heart,
    },
    manifestation: {
      label: 'Manifestation',
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      icon: Sparkles,
    },
  }[entry.type] || {
    label: entry.type,
    bg: 'bg-muted text-muted-foreground border-border',
    icon: User,
  };

  const TypeIcon = typeConfig.icon;

  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-blue-500 text-white',
      'bg-purple-500 text-white',
      'bg-indigo-500 text-white',
      'bg-pink-500 text-white',
      'bg-emerald-500 text-white',
      'bg-amber-500 text-white',
    ];
    let sum = 0;
    for (let i = 0; i < email.length; i++) sum += email.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm select-none shadow-sm ${getAvatarColor(entry.user.email)}`}>
            {entry.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-foreground leading-none">{entry.user.name}</h4>
            <span className="text-xs text-muted-foreground leading-normal">{entry.user.email}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig.bg}`}>
            <TypeIcon className="w-3.5 h-3.5" />
            {typeConfig.label}
          </span>

          {entry.type === 'journal' && entry.mood && moodLabels[entry.mood] && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${moodBgColors[entry.mood] || 'bg-muted'}`}>
              {moodLabels[entry.mood]}
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-accent/40 px-3 py-1 rounded-full border border-border/30">
            <Calendar className="w-3.5 h-3.5" />
            {dateStr}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {entry.type === 'journal' && entry.title && (
          <h3 className="text-lg font-bold text-foreground tracking-tight">{entry.title}</h3>
        )}
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </p>

        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors mt-2 cursor-pointer"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Read More <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<AdminUserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const fetchEntries = async () => {
        try {
          setLoading(true);
          const response = await adminApi.getEntries();
          setEntries(response.data || []);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to fetch user entries.');
        } finally {
          setLoading(false);
        }
      };

      fetchEntries();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center w-20 h-20 bg-destructive/10 rounded-full border border-destructive/20 shadow-md mb-6">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          This panel is restricted to system administrators. If you believe this is an error, please contact the developer.
        </p>
        <Link href="/dashboard">
          <Button className="gap-2 px-6 py-5 rounded-xl font-semibold">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-6">
        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm text-primary">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">All user entries and logs submitted on the platform.</p>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading all entries...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-destructive/5 border border-destructive/15 rounded-2xl max-w-lg mx-auto">
          <p className="text-sm text-destructive font-semibold mb-2">Error Occurred</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-20 text-center bg-card/25 backdrop-blur-md border border-border/30 rounded-2xl">
          <p className="text-base font-bold text-foreground">No entries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
