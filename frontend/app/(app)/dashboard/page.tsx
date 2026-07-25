'use client';

import { Button } from '@/components/ui/button';
import { MoodBadge } from '@/components/ui/mood-badge';
import { inspirationalQuotes } from '@/lib/mock-data';
import { PenTool, Calendar, TrendingUp, Zap, BookOpen, MessageSquare, Sparkles, Quote, Heart, Bookmark, Edit3, Check, Plus, Trash2, Star, Shield, Sun, Moon, Sunrise, ArrowRight, Activity, Smile } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { journalApi } from '@/lib/api/journal';
import { moodApi } from '@/lib/api/mood';
import { fromBackendMood } from '@/lib/mood-map';
import type { BackendJournalEntry, BackendMoodEntry } from '@/lib/api-types';

interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string; // 'yellow' | 'pink' | 'blue' | 'green'
  isFavorite: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

const STICKY_COLORS = [
  { name: 'Yellow', bg: 'bg-[#fef08a] border-[#fde047]', text: 'text-yellow-950', preview: '#fde047' },
  { name: 'Pink', bg: 'bg-[#fbcfe8] border-[#f9a8d4]', text: 'text-pink-950', preview: '#f9a8d4' },
  { name: 'Blue', bg: 'bg-[#bfdbfe] border-[#93c5fd]', text: 'text-blue-950', preview: '#93c5fd' },
  { name: 'Green', bg: 'bg-[#bbf7d0] border-[#86efac]', text: 'text-green-950', preview: '#86efac' }
];

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
  { emoji: '😢', mood: 'SAD', score: 1, label: 'Sad', color: '#64748b', gradient: 'from-slate-500/20 to-slate-600/10' },
  { emoji: '😰', mood: 'ANXIOUS', score: 2, label: 'Anxious', color: '#f97316', gradient: 'from-orange-500/20 to-amber-600/10' },
  { emoji: '😐', mood: 'OKAY', score: 3, label: 'Okay', color: '#eab308', gradient: 'from-yellow-500/20 to-amber-500/10' },
  { emoji: '🙂', mood: 'GOOD', score: 4, label: 'Good', color: '#3b82f6', gradient: 'from-blue-500/20 to-cyan-500/10' },
  { emoji: '🌟', mood: 'EXCELLENT', score: 5, label: 'Excellent', color: '#22c55e', gradient: 'from-emerald-500/20 to-teal-500/10' },
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
  const [greetingIcon, setGreetingIcon] = useState<'sun' | 'sunrise' | 'moon'>('sun');

  // Sticky Notes States
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [noteFilter, setNoteFilter] = useState<'all' | 'favorites'>('all');
  
  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');

  const quote = useMemo(
    () => inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)],
    [],
  );

  useEffect(() => {
    setMounted(true);
    setCurrentPrompt(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good Morning 🌅');
      setGreetingIcon('sunrise');
    } else if (hours < 17) {
      setGreeting('Good Afternoon ☀️');
      setGreetingIcon('sun');
    } else {
      setGreeting('Good Evening 🌌');
      setGreetingIcon('moon');
    }

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
      const color = i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#38bdf8' : '#f43f5e';
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

    setTimeout(() => {
      setMoodParticles([]);
    }, 1300);

    try {
      const result = await moodApi.create({
        mood: m.mood as any,
        score: m.score,
        notes: 'Quick check-in from dashboard sanctuary',
      });
      setTodayMood(result.data.entry);
    } catch {
      // Degrade silently
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_sticky_notes');
      if (saved) {
        setStickyNotes(JSON.parse(saved));
      } else {
        const defaultNotes: StickyNote[] = [
          {
            id: '1',
            title: 'Mindful Sanctuary 🧘',
            content: 'Take 3 slow, deep breaths. You are present, calm, and grounded.',
            color: 'yellow',
            isFavorite: true,
            isBookmarked: true,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Daily Manifestation 💫',
            content: 'I attract peace, creative clarity, and positive energy into my journey.',
            color: 'blue',
            isFavorite: false,
            isBookmarked: true,
            createdAt: new Date().toISOString()
          }
        ];
        setStickyNotes(defaultNotes);
        localStorage.setItem('dashboard_sticky_notes', JSON.stringify(defaultNotes));
      }
    }
  }, []);

  const saveNotes = (updated: StickyNote[]) => {
    setStickyNotes(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_sticky_notes', JSON.stringify(updated));
    }
  };

  const handleAddNote = () => {
    const newNote: StickyNote = {
      id: String(Date.now()),
      title: 'Personal Reflection ✍️',
      content: 'Write an uplifting thought or intention...',
      color: 'yellow',
      isFavorite: false,
      isBookmarked: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newNote, ...stickyNotes];
    saveNotes(updated);
    
    setEditingNoteId(newNote.id);
    setNoteTitle(newNote.title);
    setNoteContent(newNote.content);
    setNoteColor(newNote.color);
  };

  const handleUpdateNote = (id: string) => {
    const updated = stickyNotes.map((n) =>
      n.id === id ? { ...n, title: noteTitle, content: noteContent, color: noteColor } : n
    );
    saveNotes(updated);
    setEditingNoteId(null);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Delete this sticky note?')) {
      const updated = stickyNotes.filter((n) => n.id !== id);
      saveNotes(updated);
    }
  };

  const handleToggleFavoriteNote = (id: string) => {
    const updated = stickyNotes.map((n) =>
      n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
    );
    saveNotes(updated);
  };

  const handleToggleBookmarkNote = (id: string) => {
    const updated = stickyNotes.map((n) =>
      n.id === id ? { ...n, isBookmarked: !n.isBookmarked } : n
    );
    saveNotes(updated);
  };

  const filteredNotes = useMemo(() => {
    if (noteFilter === 'favorites') {
      return stickyNotes.filter(n => n.isFavorite || n.isBookmarked);
    }
    return stickyNotes;
  }, [stickyNotes, noteFilter]);

  if (!mounted || !user) return null;

  const todayEntry = entries[0];
  const recentEntries = entries.slice(1, 4);

  return (
    <div className="relative min-h-screen p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto overflow-hidden">
      {/* Ambient Aurora Glow Background Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/15 to-cyan-500/10 blur-3xl pointer-events-none animate-aurora-float" />
      <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-rose-500/10 blur-3xl pointer-events-none animate-aurora-float-delayed" />

      {/* Hero Sanctuary Banner */}
      <div className="relative rounded-3xl p-6 md:p-10 border border-white/40 dark:border-white/10 glass-card-sanctuary shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/20 via-rose-500/15 to-transparent rounded-full blur-2xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 animate-spin duration-3000" />
              <span>Personal Wellness Sanctuary</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground font-serif">
              {greeting}, <span className="bg-gradient-to-r from-teal-600 via-primary to-indigo-600 bg-clip-text text-transparent">{user.name}!</span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Your safe space for emotional clarity, guided reflections, and daily mindfulness. Select a check-in below or record your thoughts in peace.
            </p>

            {/* Quick Access Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 border border-border/60 text-xs font-semibold text-foreground">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{user.streakDays} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 border border-border/60 text-xs font-semibold text-foreground">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>{user.totalEntries} Memories Saved</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/60 border border-border/60 text-xs font-semibold text-foreground">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Sigmund Freud Counselor Ready</span>
              </div>
            </div>
          </div>

          {/* Quick Primary Actions Floating Glass Box */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
            <Link href="/journal/new" className="w-full">
              <Button className="w-full h-12 bg-gradient-to-r from-teal-600 to-primary hover:from-teal-700 hover:to-primary/90 text-white font-bold rounded-2xl shadow-lg hover:shadow-teal-500/25 transition-all duration-300 hover:scale-105 active:scale-95 gap-2 cursor-pointer">
                <PenTool className="w-4 h-4" />
                <span>Write Journal Entry</span>
              </Button>
            </Link>

            <Link href="/journal/voice" className="w-full">
              <Button variant="outline" className="w-full h-12 border-primary/30 hover:border-primary text-foreground font-semibold rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 gap-2 cursor-pointer">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span>Voice Sanctuary</span>
              </Button>
            </Link>

            <Link href="/ai-chat" className="w-full">
              <Button variant="secondary" className="w-full h-11 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" />
                <span>AI Counselor Chat</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Column (2/3 width) - Guided Reflections, Notes & Feed */}
        <div className="lg:col-span-2 space-y-8">

          {/* Daily Wisdom Card (Premium Quote Glass Highlight) */}
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 glass-card-sanctuary border border-amber-500/20 shadow-xl group">
            <Quote className="absolute right-6 bottom-4 w-32 h-32 text-amber-500/10 pointer-events-none transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 fill-amber-500/20 animate-pulse" />
                Daily Wisdom Reflection
              </span>
              
              <blockquote className="text-xl md:text-3xl font-serif font-extrabold italic bg-gradient-to-r from-foreground via-foreground to-amber-600 bg-clip-text text-transparent tracking-wide leading-relaxed text-balance">
                &ldquo;{quote}&rdquo;
              </blockquote>
              
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent rounded-full" />
            </div>
          </div>

          {/* Guided Reflection Prompt Card */}
          <div className="glass-card-sanctuary border border-teal-500/20 rounded-3xl p-6 md:p-8 space-y-4 hover:border-teal-500/40 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-teal-500" />
                Guided Reflection Prompt
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPrompt}
                className="text-xs text-muted-foreground hover:text-foreground border-border rounded-xl cursor-pointer"
              >
                Refresh Prompt
              </Button>
            </div>

            <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed italic font-serif">
              &quot;{currentPrompt}&quot;
            </p>

            <div className="pt-2">
              <Link href={`/journal/new?prompt=${encodeURIComponent(currentPrompt)}`}>
                <Button size="sm" className="bg-gradient-to-r from-teal-600 to-primary hover:from-teal-700 hover:to-primary/90 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer gap-2">
                  <span>Write Entry with this Prompt</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Reflections List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-teal-600" />
                Recent Journal Reflections
              </h2>
              <Link href="/journal">
                <Button variant="ghost" size="sm" className="text-xs text-teal-600 hover:text-teal-700 font-bold cursor-pointer">
                  View All ({user.totalEntries})
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading your memories...</div>
            ) : entries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entries.map((entry) => (
                  <Link key={entry.id} href={`/journal/${entry.id}`} className="group">
                    <div className="glass-card-sanctuary border border-border/60 hover:border-teal-500/40 rounded-2xl p-5 space-y-3 transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-xl h-full flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-bold text-base text-foreground group-hover:text-teal-600 transition-colors line-clamp-1">
                            {entry.title}
                          </h4>
                          <MoodBadge mood={fromBackendMood(entry.mood)} size="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {entry.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {new Date(entry.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                          Read Entry &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center glass-card-sanctuary rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground font-semibold">No journal entries written yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Start your journey by writing your first reflection above!</p>
              </div>
            )}
          </div>

          {/* Sticky Notes & Affirmations Board */}
          <div className="space-y-4 pt-6 border-t border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-serif flex items-center gap-2 text-foreground">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Mindful Sticky Notes Board
                </h2>
                <p className="text-xs text-muted-foreground">Pin quick thoughts, affirmations, or manifestation reminders</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-muted/60 p-1 rounded-xl border border-border/40 text-xs">
                  <button
                    onClick={() => setNoteFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      noteFilter === 'all'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Notes
                  </button>
                  <button
                    onClick={() => setNoteFilter('favorites')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      noteFilter === 'favorites'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                    Bookmarked / Favorites
                  </button>
                </div>

                <Button
                  onClick={handleAddNote}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1 text-xs font-bold rounded-xl cursor-pointer h-9 px-4"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="py-10 text-center glass-card-sanctuary border border-dashed border-border/60 rounded-2xl">
                <p className="text-sm font-semibold text-muted-foreground">No sticky notes pinned.</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Click &quot;Add Note&quot; to pin a reminder!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredNotes.map((note) => {
                  const colorConfig = STICKY_COLORS.find(c => c.name.toLowerCase() === note.color.toLowerCase()) || STICKY_COLORS[0];
                  const isEditing = editingNoteId === note.id;

                  return (
                    <div
                      key={note.id}
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border-l-[6px] border-l-current border shadow-md hover:shadow-xl transition-all duration-300 ${colorConfig.bg} ${colorConfig.text} overflow-hidden hover:scale-[1.02]`}
                    >
                      <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                        {isEditing ? (
                          <div className="flex gap-1.5">
                            {STICKY_COLORS.map((c) => (
                              <button
                                key={c.name}
                                onClick={() => setNoteColor(c.name.toLowerCase())}
                                className={`w-4 h-4 rounded-full border border-black/20 ${noteColor === c.name.toLowerCase() ? 'ring-2 ring-black/40 scale-110' : ''}`}
                                style={{ backgroundColor: c.preview }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-bold opacity-60 tracking-wider">
                            Pinned on {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFavoriteNote(note.id)}
                            className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
                            title="Toggle Favorite"
                          >
                            <Heart className={`w-4 h-4 ${note.isFavorite ? 'fill-current text-rose-600' : 'opacity-65 hover:opacity-100'}`} />
                          </button>
                          <button
                            onClick={() => handleToggleBookmarkNote(note.id)}
                            className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
                            title="Toggle Bookmark"
                          >
                            <Bookmark className={`w-4 h-4 ${note.isBookmarked ? 'fill-current text-amber-600' : 'opacity-65 hover:opacity-100'}`} />
                          </button>
                          
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setNoteTitle(note.title);
                                  setNoteContent(note.content);
                                  setNoteColor(note.color);
                                }}
                                className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer opacity-60 hover:opacity-100"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer text-red-950 opacity-60 hover:opacity-100"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                              className="w-full bg-white/40 border border-black/10 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:bg-white/60"
                              placeholder="Note Title"
                            />
                            <textarea
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                              rows={3}
                              className="w-full bg-white/40 border border-black/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white/60 resize-none"
                              placeholder="Note details..."
                            />
                          </div>
                        ) : (
                          <>
                            <h4 className="font-extrabold text-xs tracking-tight">{note.title}</h4>
                            <p className="text-xs font-medium leading-relaxed opacity-95 whitespace-pre-wrap">{note.content}</p>
                          </>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-black/5">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="p-1 px-2.5 bg-black/5 hover:bg-black/10 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-current"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            className="p-1 px-3 bg-black/80 hover:bg-black/90 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width) - Mood Matrix & Wellness Analytics */}
        <div className="space-y-6">

          {/* Interactive Mood Matrix Stage */}
          <div className="glass-card-sanctuary border border-border/60 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                <Smile className="w-4 h-4 text-amber-500" />
                How are you feeling right now?
              </h3>
            </div>
            
            {todayMood ? (
              <div className="flex items-center gap-3 bg-teal-500/10 p-3.5 rounded-2xl border border-teal-500/20">
                <MoodBadge mood={fromBackendMood(todayMood.mood)} size="md" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Logged today:</span>{' '}
                  <span className="font-bold capitalize text-foreground">{fromBackendMood(todayMood.mood)} ({todayMood.score}/5)</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Tap an emoji below to check-in and log your emotional state.</p>
            )}

            <div className="relative flex items-center justify-between gap-1 pt-2">
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
                  className={`relative p-3 text-2xl rounded-2xl bg-gradient-to-br ${m.gradient} hover:scale-125 transition-all duration-300 cursor-pointer active:scale-95 z-10 border border-border/40 hover:border-primary/50 shadow-sm`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Life Sanctuary Balance Radar */}
          <div className="glass-card-sanctuary border border-border/60 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              Mindful Sanctuary Metrics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Emotional Harmony</span>
                  <span className="text-teal-600 font-bold">94%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full w-[94%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Streak Consistency</span>
                  <span className="text-amber-500 font-bold">{user.streakDays * 20 > 100 ? 100 : user.streakDays * 20}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-full" style={{ width: `${Math.min(100, user.streakDays * 20)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Reflection Depth</span>
                  <span className="text-indigo-600 font-bold">88%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[88%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Sanctuary */}
          <div className="glass-card-sanctuary border border-border/60 rounded-3xl p-6 space-y-3 shadow-xl">
            <h3 className="font-bold text-sm text-foreground mb-4">Sanctuary Tools</h3>
            <Link href="/reports" className="block">
              <Button variant="outline" className="w-full justify-start cursor-pointer rounded-2xl h-11 border-border/60 hover:bg-primary/10">
                <TrendingUp className="w-4 h-4 mr-2 text-teal-600" />
                View Emotional Reports
              </Button>
            </Link>
            <Link href="/gratitude" className="block">
              <Button variant="outline" className="w-full justify-start cursor-pointer rounded-2xl h-11 border-border/60 hover:bg-rose-500/10">
                <Heart className="w-4 h-4 mr-2 text-rose-500" />
                Gratitude Journal
              </Button>
            </Link>
            <Link href="/manifestation" className="block">
              <Button variant="outline" className="w-full justify-start cursor-pointer rounded-2xl h-11 border-border/60 hover:bg-purple-500/10">
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                Manifestation Sanctuary
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Streak Modal */}
      {showStreakModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="glass-card-sanctuary border border-amber-500/30 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />

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
                <div className="relative flex items-center justify-center w-24 h-24 bg-amber-500/10 rounded-full border border-amber-500/30 shadow-lg animate-bounce duration-1000 z-10">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ripple pointer-events-none" />
                  <Zap className="w-12 h-12 text-amber-500 fill-amber-500 animate-pulse duration-700 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 animate-spin duration-3000" />
                </div>

                <div className="space-y-2 z-10">
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-serif">
                    {user.streakDays} Day Streak!
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You are doing amazing! Keep journaling everyday to maintain your mindfulness streak.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-2 pt-2 z-10">
                  <Button 
                    onClick={() => setShowStreakModal(false)}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Keep it up! 🔥
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="relative flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full border border-primary/30 shadow-lg animate-bounce duration-1000 z-10">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ripple pointer-events-none" />
                  <BookOpen className="w-12 h-12 text-primary animate-pulse duration-1000" />
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-accent animate-spin duration-3000" />
                </div>

                <div className="space-y-2 z-10">
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-serif">
                    Welcome! ✨
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Welcome to Safe Journal. This is your private, secure sanctuary to write daily reflections, track manifestations, and log gratitude.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-2 pt-2 z-10">
                  <Link href="/journal/new" className="w-full">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
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
