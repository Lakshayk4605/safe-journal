'use client';

import { Button } from '@/components/ui/button';
import { MoodBadge } from '@/components/ui/mood-badge';
import { inspirationalQuotes } from '@/lib/mock-data';
import { PenTool, Calendar, TrendingUp, Zap, BookOpen, MessageSquare, Sparkles, Quote } from 'lucide-react';
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

const MOOD_BUTTONS = [
  { emoji: '😢', mood: 'SAD', score: 1, label: 'Sad', color: '#64748b' },
  { emoji: '😰', mood: 'ANXIOUS', score: 2, label: 'Anxious', color: '#f97316' },
  { emoji: '😐', mood: 'OKAY', score: 3, label: 'Okay', color: '#eab308' },
  { emoji: '🙂', mood: 'GOOD', score: 4, label: 'Good', color: '#3b82f6' },
  { emoji: '🌟', mood: 'EXCELLENT', score: 5, label: 'Excellent', color: '#22c55e' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<BackendJournalEntry[]>([]);
  const [todayMood, setTodayMood] = useState<BackendMoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [moodParticles, setMoodParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    r: number;
    color: string;
    size: number;
  }>>([]);
  const [greeting, setGreeting] = useState('Welcome back');

  const quote = useMemo(
    () => inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)],
    [],
  );

  useEffect(() => {
    setMounted(true);
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good morning 🌅');
    else if (hours < 17) setGreeting('Good afternoon ☀️');
    else setGreeting('Good evening 🌌');

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

  const handleLogMood = async (m: typeof MOOD_BUTTONS[0], e: React.MouseEvent<HTMLButtonElement>) => {
    // Generate explosive particle burst relative to click location in card
    const newParticles = Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 40 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const r = 45 + Math.random() * 180;
      const size = 5 + Math.random() * 6;
      return {
        id: Math.random() + i,
        x,
        y,
        r,
        color: m.color,
        size,
      };
    });
    setMoodParticles(newParticles);

    // Clear particles after animation
    setTimeout(() => {
      setMoodParticles([]);
    }, 1300);

    try {
      const result = await moodApi.create({
        mood: m.mood as any,
        score: m.score,
        notes: 'Quick check-in from dashboard',
      });
      setTodayMood(result.data.entry);
    } catch {
      // Degrade silently
    }
  };

  if (!mounted || !user) return null;

  const todayEntry = entries[0];
  const recentEntries = entries.slice(1, 4);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-6xl mx-auto">
      {/* Bento Sanctuary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sanctuary Hero Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-card via-card to-secondary/5 border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between shadow-neon-primary card-glow min-h-[190px]">
          {/* Animated Ambient background circle representing sun/moon */}
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-36 h-36 rounded-full bg-accent/15 blur-3xl animate-pulse pointer-events-none" />
          
          <div className="space-y-2.5 z-10">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary/95 bg-primary/10 px-2 py-0.5 rounded-full">Daily Sanctuary</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {greeting}, {user.name}!
            </h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Welcome to your private wellness space. How has your journey been today? Select a reflection below or record your thoughts.
            </p>
          </div>
          
          {/* Small decorative orbital icon in corner */}
          <div className="absolute right-6 bottom-6 w-12 h-12 rounded-full border border-border/40 flex items-center justify-center animate-orbit bg-background/30 backdrop-blur-sm pointer-events-none">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          </div>
        </div>

        {/* Quick Stats Bento Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          {/* Streak Bento Widget */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-300 shadow-neon-accent card-glow">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Zap className="w-6 h-6 fill-accent/10" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold tracking-tight">{user.streakDays} Days</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Current Streak</p>
            </div>
          </div>

          {/* Reflections Bento Widget */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-300 shadow-neon-primary card-glow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold tracking-tight">{user.totalEntries}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/journal/new" className="group">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-6 cursor-pointer hover:border-primary/40 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-gradient-shift">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">Write New Entry</h3>
                <p className="text-sm text-muted-foreground">Express your thoughts and feelings</p>
              </div>
              <PenTool className="w-8 h-8 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </div>
          </div>
        </Link>

        <Link href="/journal/voice" className="group">
          <div className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent border border-secondary/20 rounded-xl p-6 cursor-pointer hover:border-secondary/40 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 relative overflow-hidden bg-gradient-shift">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-secondary transition-colors">Voice Journal</h3>
                <p className="text-sm text-muted-foreground">Record your thoughts by voice</p>
              </div>
              <MessageSquare className="w-8 h-8 text-secondary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </div>
          </div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Today & Recent */}
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Wisdom Card (Premium Quote Highlight) */}
          <div className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-accent/5 via-accent/10 to-transparent shadow-neon-accent card-glow group">
            {/* Absolute quotes icon in background */}
            <Quote className="absolute right-6 bottom-4 w-28 h-28 text-accent/5 pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-accent/10 text-accent uppercase tracking-wider">
                <Sparkles className="w-3 h-3 fill-accent/20 animate-pulse" />
                Daily Wisdom
              </span>
              
              <blockquote className="text-lg md:text-xl font-serif font-medium text-foreground tracking-wide leading-relaxed text-balance">
                &ldquo;{quote}&rdquo;
              </blockquote>
              
              <div className="w-12 h-0.5 bg-gradient-to-r from-accent/40 to-transparent rounded-full" />
            </div>
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
          {/* Interactive Mood Logger Widget */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 relative overflow-hidden">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              How are you feeling right now?
            </h3>
            
            {todayMood ? (
              <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/40">
                <MoodBadge mood={fromBackendMood(todayMood.mood)} size="md" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Logged today:</span>{' '}
                  <span className="font-bold capitalize text-foreground">{fromBackendMood(todayMood.mood)} ({todayMood.score}/5)</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Tap an emoji below to check-in and log your mood.</p>
            )}

            <div className="relative flex items-center justify-between gap-1 pt-1">
              {/* Confetti Particles */}
              {moodParticles.map((p) => (
                <span
                  key={p.id}
                  className="absolute rounded-full pointer-events-none animate-particle z-20"
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
                    '--r': `${p.r}deg`,
                  } as React.CSSProperties}
                />
              ))}

              {MOOD_BUTTONS.map((m) => (
                <button
                  key={m.mood}
                  onClick={(e) => handleLogMood(m, e)}
                  title={m.label}
                  className="relative p-2.5 text-2xl rounded-full bg-muted/40 hover:bg-muted/90 hover:scale-125 transition-all duration-300 cursor-pointer active:scale-95 z-10"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

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
