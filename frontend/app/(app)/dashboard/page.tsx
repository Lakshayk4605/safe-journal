'use client';

import { Button } from '@/components/ui/button';
import { MoodBadge } from '@/components/ui/mood-badge';
import { inspirationalQuotes } from '@/lib/mock-data';
import { PenTool, Calendar, TrendingUp, Zap, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { journalApi } from '@/lib/api/journal';
import { moodApi } from '@/lib/api/mood';
import { fromBackendMood } from '@/lib/mood-map';
import type { BackendJournalEntry, BackendMoodEntry } from '@/lib/api-types';

const writingPrompts = [
  "What is one thing that made you smile today?",
  "What is a challenge you faced today, and how did you handle it?",
  "Write about a person you're grateful for and why.",
  "Describe your day in three sensory words (e.g. warm, noisy, sweet).",
  "What is a small victory you achieved today?",
  "What are you looking forward to tomorrow?",
  "How did you care for yourself today?",
  "If today was a chapter in a book, what would the title be?",
  "What is something you learned today?",
  "Describe a peaceful moment from your day.",
  "What made you feel proud of yourself recently?",
  "Write about a hobby or activity that brings you joy.",
  "What is a goal you want to focus on this week?",
  "Describe the most relaxing part of your week so far."
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<BackendJournalEntry[]>([]);
  const [todayMood, setTodayMood] = useState<BackendMoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showStreakModal, setShowStreakModal] = useState(false);

  const quote = useMemo(
    () => inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)],
    [],
  );

  useEffect(() => {
    setMounted(true);
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
    (async () => {
      try {
        const [entriesResult, moodResult] = await Promise.all([
          journalApi.list({ page: 1, limit: 4, sortBy: 'createdAt', sortOrder: 'desc' }),
          moodApi.history('week'),
        ]);
        setEntries(entriesResult.data);
        setTodayMood(moodResult.data.history[0] ?? null);
      } catch {
        // Dashboard degrades gracefully to empty state on error.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('streak_modal_shown');
      if (!shown) {
        const timer = setTimeout(() => {
          setShowStreakModal(true);
          sessionStorage.setItem('streak_modal_shown', 'true');
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const streakParticles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const angle = (i / 30) * 360;
      const rad = (angle * Math.PI) / 180;
      const distance = 90 + Math.random() * 110;
      const x = Math.cos(rad) * distance;
      const y = Math.sin(rad) * distance;
      const delay = Math.random() * 0.15;
      const size = 6 + Math.random() * 8;
      const rotation = 90 + Math.random() * 270;
      const color = i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#38bdf8' : '#f43f5e'; // Amber, Sky, Rose
      return { x, y, delay, size, rotation, color };
    });
  }, []);

  const handleNextPrompt = () => {
    let nextPrompt = currentPrompt;
    while (nextPrompt === currentPrompt) {
      nextPrompt = writingPrompts[Math.floor(Math.random() * writingPrompts.length)];
    }
    setCurrentPrompt(nextPrompt);
  };

  if (!mounted || !user) return null;

  const todayEntry = entries[0];
  const recentEntries = entries.slice(1, 4);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-sm text-muted-foreground">
          {user.streakDays} day streak • {user.totalEntries} total entries
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/journal/new" className="group">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 cursor-pointer hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold">Write New Entry</h3>
                <p className="text-sm text-muted-foreground">Express your thoughts and feelings</p>
              </div>
              <PenTool className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Link>

        <Link href="/journal/voice" className="group">
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl p-6 cursor-pointer hover:border-secondary/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold">Voice Journal</h3>
                <p className="text-sm text-muted-foreground">Record your thoughts by voice</p>
              </div>
              <MessageSquare className="w-8 h-8 text-secondary" />
            </div>
          </div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Today & Recent */}
        <div className="lg:col-span-2 space-y-8">
          {/* Inspirational Quote */}
          <div className="bg-card border border-border/50 rounded-xl p-6 bg-gradient-to-br from-accent/5 to-accent/10">
            <p className="text-lg italic font-medium">&quot;{quote}&quot;</p>
          </div>

          {/* Guided Journaling Prompt Card */}
          <div className="bg-card border border-border/50 rounded-xl p-6 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 space-y-4 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md cursor-default">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-primary flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" />
                Guided Reflection Prompt
              </h3>
              <button
                onClick={handleNextPrompt}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium border border-border px-2.5 py-1 rounded-md hover:bg-muted cursor-pointer"
              >
                New Prompt
              </button>
            </div>
            <p className="text-lg font-medium text-foreground leading-relaxed">&quot;{currentPrompt}&quot;</p>
            <div className="pt-1">
              <Link href={`/journal/new?prompt=${encodeURIComponent(currentPrompt)}`}>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold transition-transform active:scale-95 cursor-pointer">
                  Write Entry with this Prompt
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading your entries...</p>
          ) : (
            <>
              {/* Today's Entry */}
              {todayEntry && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Latest Reflection</h2>
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{todayEntry.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(todayEntry.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <MoodBadge mood={fromBackendMood(todayEntry.mood)} size="lg" />
                    </div>
                    <p className="text-foreground line-clamp-3">{todayEntry.content}</p>
                    <div className="flex gap-2 flex-wrap">
                      {todayEntry.emotions.slice(0, 3).map(({ emotion }) => (
                        <span
                          key={emotion.id}
                          className="text-xs px-3 py-1 bg-muted rounded-full text-muted-foreground"
                        >
                          {emotion.name}
                        </span>
                      ))}
                    </div>
                    <Link href={`/journal/${todayEntry.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Full Entry
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Recent Entries */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Recent Entries</h2>
                {recentEntries.length > 0 ? (
                  <div className="space-y-3">
                    {recentEntries.map((entry) => (
                      <Link key={entry.id} href={`/journal/${entry.id}`}>
                        <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{entry.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <MoodBadge mood={fromBackendMood(entry.mood)} size="md" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No entries yet — write your first one to see it here.
                  </p>
                )}
                <Link href="/journal">
                  <Button variant="outline" className="w-full">
                    View All Entries
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          {/* Today's Mood */}
          {todayMood && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">Latest Mood</h3>
              <div className="flex items-center gap-4">
                <MoodBadge mood={fromBackendMood(todayMood.mood)} size="lg" />
                <div>
                  <p className="text-2xl font-bold">{todayMood.score}/5</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {fromBackendMood(todayMood.mood)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Current Streak</span>
                </div>
                <span className="font-semibold">{user.streakDays} days</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Total Entries</span>
                </div>
                <span className="font-semibold">{user.totalEntries}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <span>Member Since</span>
                </div>
                <span className="font-semibold">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <Link href="/reports" className="block">
              <Button variant="outline" className="w-full justify-start cursor-pointer">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </Link>
            <Link href="/ai-chat" className="block">
              <Button variant="outline" className="w-full justify-start cursor-pointer">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with AI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Animated Streak Celebration Modal overlay */}
      {showStreakModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-card/90 border border-amber-500/30 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            {/* Glowing Aura Effect */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />

            {/* Exploding Sparkles/Confetti System */}
            {streakParticles.map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full pointer-events-none animate-particle"
                style={{
                  backgroundColor: p.color,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  left: '50%',
                  top: '50%',
                  marginLeft: `-${p.size / 2}px`,
                  marginTop: `-${p.size / 2}px`,
                  '--x': `${p.x}px`,
                  '--y': `${p.y}px`,
                  '--r': `${p.rotation}deg`,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties}
              />
            ))}

            {user.streakDays > 0 ? (
              <>
                {/* Streak Icon Animation container with nested pulsing ripples */}
                <div className="relative flex items-center justify-center w-24 h-24 bg-amber-500/10 rounded-full border border-amber-500/30 shadow-lg animate-bounce duration-1000 z-10">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ripple pointer-events-none" />
                  <Zap className="w-12 h-12 text-amber-500 fill-amber-500 animate-pulse duration-700 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 animate-spin duration-3000" />
                </div>

                <div className="space-y-2 z-10">
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    {user.streakDays} Day Streak!
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You are doing amazing! Keep journaling everyday to maintain your mindfulness streak.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-2 pt-2 z-10">
                  <Button 
                    onClick={() => setShowStreakModal(false)}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Keep it up! 🔥
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Welcome Book Icon with nested pulsing ripples */}
                <div className="relative flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full border border-primary/30 shadow-lg animate-bounce duration-1000 z-10">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ripple pointer-events-none" />
                  <BookOpen className="w-12 h-12 text-primary animate-pulse duration-1000 filter drop-shadow-[0_0_12px_rgba(var(--primary),0.4)]" />
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-accent animate-spin duration-3000" />
                </div>

                <div className="space-y-2 z-10">
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    Welcome! ✨
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Welcome to Safe Journal. This is your private, secure sanctuary to write daily reflections, track manifestations, and log gratitude.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-2 pt-2 z-10">
                  <Link href="/journal/new" className="w-full">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                    >
                      Start Journaling
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost"
                    onClick={() => setShowStreakModal(false)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
