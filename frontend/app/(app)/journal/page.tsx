'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoodBadge } from '@/components/ui/mood-badge';
import type { Mood } from '@/lib/mock-data';
import {
  Search,
  Filter,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  X,
  Edit2,
  Trash2,
  Copy,
  Share2,
  Sparkles,
  Star,
  FileText,
  Heart,
  Bookmark,
  Edit3,
  Check,
  Quote,
  BookOpen
} from 'lucide-react';

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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { journalApi } from '@/lib/api/journal';
import { fromBackendMood, toBackendMood } from '@/lib/mood-map';
import type { BackendJournalEntry } from '@/lib/api-types';

const moods: Mood[] = ['excellent', 'great', 'good', 'okay', 'sad', 'anxious'];

const moodEmojis: Record<Mood, string> = {
  excellent: '🌟',
  great: '😄',
  good: '🙂',
  okay: '😐',
  sad: '😢',
  anxious: '😟',
};

const moodBgClasses: Record<Mood, string> = {
  excellent: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30',
  great: 'bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/30',
  good: 'bg-sky-500/20 border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/30',
  okay: 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30',
  sad: 'bg-slate-500/20 border-slate-500/40 text-slate-600 dark:text-slate-400 hover:bg-slate-500/30',
  anxious: 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30',
};

const moodBadgeClasses: Record<Mood, string> = {
  excellent: 'bg-emerald-500',
  great: 'bg-green-500',
  good: 'bg-sky-500',
  okay: 'bg-amber-500',
  sad: 'bg-slate-500',
  anxious: 'bg-rose-500',
};

function FountainPenGraphic() {
  return (
    <svg viewBox="0 0 120 400" className="w-14 h-44 drop-shadow-2xl animate-pen-glide filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)]">
      <defs>
        <linearGradient id="goldCap" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="silverGrip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="nibGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#fff099" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Main Pen Body */}
      <rect x="42" y="10" width="36" height="230" rx="18" fill="url(#goldCap)" stroke="#451a03" strokeWidth="2" />
      {/* Gold Ring Trim */}
      <rect x="42" y="140" width="36" height="10" fill="#fef08a" stroke="#78350f" strokeWidth="1" />
      {/* Clip */}
      <rect x="56" y="25" width="8" height="110" rx="4" fill="#fef08a" stroke="#78350f" strokeWidth="1" />
      {/* Metallic Silver Grip Section */}
      <polygon points="44,240 76,240 70,315 50,315" fill="url(#silverGrip)" stroke="#0f172a" strokeWidth="1.5" />
      {/* Metallic Gold Nib */}
      <polygon points="50,315 70,315 64,375 60,392 56,375" fill="url(#nibGold)" stroke="#78350f" strokeWidth="1.5" />
      {/* Nib slit & breather hole */}
      <line x1="60" y1="315" x2="60" y2="385" stroke="#451a03" strokeWidth="1.5" />
      <circle cx="60" cy="345" r="3.5" fill="#451a03" />
    </svg>
  );
}

function HandwritingWriter({ text = '' }: { text?: string }) {
  const safeText = text || '';
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const [penPos, setPenPos] = useState({ left: 45, top: 15 });

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [safeText]);

  useEffect(() => {
    if (currentIndex < safeText.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + safeText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [safeText, currentIndex]);

  useEffect(() => {
    if (markerRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const markerRect = markerRef.current.getBoundingClientRect();
      const left = markerRect.left - containerRect.left;
      const top = markerRect.top - containerRect.top;
      setPenPos({
        left: Math.max(35, left),
        top: Math.max(10, top)
      });
    }
  }, [displayedText]);

  return (
    <div ref={containerRef} className="relative font-handwriting text-2xl md:text-3xl text-slate-900 dark:text-amber-100 tracking-wide leading-[2.25rem] pt-0.5 select-none bg-ruled-paper px-12 py-4 rounded-lg shadow-inner min-h-[180px] border border-amber-900/10 overflow-hidden">
      {/* Red margin line indicator visual */}
      <div className="absolute top-0 bottom-0 left-11 w-[2px] bg-red-400/60 pointer-events-none" />

      <span className="whitespace-pre-wrap">{displayedText}</span>
      <span ref={markerRef} className="inline-block w-0 h-6 opacity-0">|</span>

      {/* Floating 3D Pen Graphic attached to active cursor */}
      {currentIndex < safeText.length && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-75 ease-out"
          style={{
            left: `${penPos.left - 10}px`,
            top: `${penPos.top - 125}px`
          }}
        >
          <FountainPenGraphic isWriting={true} />
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [entries, setEntries] = useState<BackendJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [filterFavorite, setFilterFavorite] = useState(false);

  // Drawer detail state
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Sticky Notes States
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [noteFilter, setNoteFilter] = useState<'all' | 'favorites'>('all');
  
  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch entries for active user filters
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await journalApi.list({
        page: 1,
        limit: 500, // retrieve ample entries to map across month layout
        search: searchQuery.trim() || undefined,
        mood: selectedMood ? toBackendMood(selectedMood) : undefined,
        favoriteOnly: filterFavorite || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setEntries(result.data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedMood, filterFavorite]);

  useEffect(() => {
    const timeout = setTimeout(fetchEntries, 300);
    return () => clearTimeout(timeout);
  }, [fetchEntries]);

  // Format Helper: YYYY-MM-DD local
  const toLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group entries by local date string
  const entriesByDate = useMemo(() => {
    const map: Record<string, BackendJournalEntry[]> = {};
    entries.forEach((entry) => {
      const d = new Date(entry.createdAt);
      const dateStr = toLocalDateString(d);
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(entry);
    });
    return map;
  }, [entries]);

  // Jumps to today's month/year
  const handleGoToToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(toLocalDateString(new Date()));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1));
  };

  // Calculate Streak count leading up to a specific date
  const getStreakForDate = useCallback((dateStr: string) => {
    let streak = 0;
    const checkDate = new Date(dateStr);
    while (true) {
      const key = toLocalDateString(checkDate);
      if (entriesByDate[key] && entriesByDate[key].length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [entriesByDate]);

  // Calendar cells computation (Monday start)
  const calendarCells = useMemo(() => {
    const cells = [];
    const firstDayOfActiveMonth = new Date(currentYear, currentMonth, 1);
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    const firstDayIndex = (firstDayOfActiveMonth.getDay() + 6) % 7;
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 1. Previous Month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = totalDaysInPrevMonth - i;
      const cellDate = new Date(currentYear, currentMonth - 1, day);
      cells.push({
        date: cellDate,
        dateStr: toLocalDateString(cellDate),
        dayNum: day,
        isCurrentMonth: false,
      });
    }

    // 2. Current Month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const cellDate = new Date(currentYear, currentMonth, i);
      cells.push({
        date: cellDate,
        dateStr: toLocalDateString(cellDate),
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    // 3. Next Month padding days (fill layout grid to a multiple of 7)
    const totalGridCells = Math.ceil(cells.length / 7) * 7;
    const paddingDaysCount = totalGridCells - cells.length;
    for (let i = 1; i <= paddingDaysCount; i++) {
      const cellDate = new Date(currentYear, currentMonth + 1, i);
      cells.push({
        date: cellDate,
        dateStr: toLocalDateString(cellDate),
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Drawer handlers
  const handleDateClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    const dayEntries = entriesByDate[dateStr] || [];
    if (dayEntries.length > 0) {
      setShowDrawer(true);
    } else {
      router.push(`/journal/new?date=${dateStr}`);
    }
  };

  const handleDuplicate = async (entry: BackendJournalEntry) => {
    try {
      const tagNames = entry.tags.map((t) => t.tag.name);
      const emotionNames = entry.emotions.map((e) => e.emotion.name);
      await journalApi.create({
        title: `${entry.title} (Duplicate)`,
        content: entry.content,
        mood: entry.mood,
        tags: tagNames,
        emotions: emotionNames,
        createdAt: entry.createdAt,
      });
      fetchEntries();
      alert('Entry duplicated successfully!');
    } catch {
      alert('Could not duplicate entry.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) return;
    try {
      await journalApi.remove(id);
      fetchEntries();
      setShowDrawer(false);
      alert('Entry deleted successfully.');
    } catch {
      alert('Could not delete entry.');
    }
  };

  const handleShare = async (entry: BackendJournalEntry) => {
    try {
      const textToCopy = `📓 ${entry.title}\n📅 ${new Date(entry.createdAt).toLocaleDateString()}\n\n${entry.content}`;
      await navigator.clipboard.writeText(textToCopy);
      alert('Entry text copied to clipboard!');
    } catch {
      alert('Failed to copy to clipboard.');
    }
  };

  const selectedDayEntries = selectedDateStr ? entriesByDate[selectedDateStr] || [] : [];
  const selectedDateFormatted = selectedDateStr
    ? new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load sticky notes from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_sticky_notes');
      try {
        if (saved) {
          setStickyNotes(JSON.parse(saved));
        } else {
          const defaultNotes: StickyNote[] = [
            {
              id: '1',
              title: 'Mindful Reminder 🧘',
              content: 'Take 3 deep breaths before starting work. Smile!',
              color: 'yellow',
              isFavorite: true,
              isBookmarked: true,
              createdAt: new Date().toISOString()
            },
            {
              id: '2',
              title: 'Weekly Manifestation 💫',
              content: 'I am capable of achieving all my goals with calmness and focus.',
              color: 'blue',
              isFavorite: false,
              isBookmarked: true,
              createdAt: new Date().toISOString()
            }
          ];
          setStickyNotes(defaultNotes);
          localStorage.setItem('dashboard_sticky_notes', JSON.stringify(defaultNotes));
        }
      } catch (e) {
        console.error('Failed to parse sticky notes:', e);
        localStorage.removeItem('dashboard_sticky_notes');
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
      title: 'New Note',
      content: 'Write something here...',
      color: 'yellow',
      isFavorite: false,
      isBookmarked: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newNote, ...stickyNotes];
    saveNotes(updated);
    
    // Auto start editing the new note
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

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  const filteredNotes = useMemo(() => {
    if (noteFilter === 'favorites') {
      return stickyNotes.filter(n => n.isFavorite || n.isBookmarked);
    }
    return stickyNotes;
  }, [stickyNotes, noteFilter]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Journal Calendar
          </h1>
          <p className="text-muted-foreground">Interact with dates to view or record entries.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => window.print()}
            className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 no-print"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
          <Link href="/journal/new">
            <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
              <PenTool className="w-4 h-4" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-card/40 border border-border/60 backdrop-blur-md rounded-2xl p-6 space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <Button
            variant={filterFavorite ? 'default' : 'outline'}
            onClick={() => setFilterFavorite(!filterFavorite)}
            className="gap-2"
          >
            <Star className={`w-4 h-4 ${filterFavorite ? 'fill-current' : ''}`} />
            {filterFavorite ? 'Favorites Filtered' : 'Show Favorites Only'}
          </Button>
        </div>

        {/* Mood filter chips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filter calendar nodes by mood:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMood(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedMood === null
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
              }`}
            >
              All Moods
            </button>
            {moods.map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedMood === mood
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                }`}
              >
                <span>{moodEmojis[mood]}</span>
                <span className="capitalize">{mood}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Month Navigation Control Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/20 border border-border/40 rounded-xl p-4 no-print">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {/* Custom Month Dropdown */}
          <select
            value={currentMonth}
            onChange={handleMonthChange}
            className="h-9 px-3 rounded-lg border border-border bg-background/80 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          {/* Custom Year Dropdown */}
          <select
            value={currentYear}
            onChange={handleYearChange}
            className="h-9 px-3 rounded-lg border border-border bg-background/80 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleGoToToday} className="font-semibold">
            Today
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {months[currentMonth]} {currentYear}
          </span>
        </div>
      </div>

      {/* Calendar Grid Wrapper */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2 font-medium text-sm text-primary animate-pulse">
              <CalendarIcon className="w-5 h-5 animate-spin" />
              Loading entries...
            </div>
          </div>
        )}

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-xs font-bold text-muted-foreground/80 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell) => {
            const dayEntries = entriesByDate[cell.dateStr] || [];
            const hasEntries = dayEntries.length > 0;
            const primaryEntry = dayEntries[0];
            const mood = primaryEntry ? fromBackendMood(primaryEntry.mood) : null;
            const isToday = toLocalDateString(new Date()) === cell.dateStr;

            // Compute word count sum for cell tooltip
            const totalWords = dayEntries.reduce((sum, entry) => {
              return sum + (entry.content ? entry.content.split(/\s+/).filter(Boolean).length : 0);
            }, 0);

            // Fetch active streak for date
            const streakCount = hasEntries ? getStreakForDate(cell.dateStr) : 0;

            return (
              <div
                key={cell.dateStr}
                onClick={() => handleDateClick(cell.dateStr)}
                className={`relative group h-24 p-2 border border-border/50 rounded-xl flex flex-col justify-between transition-all cursor-pointer select-none ${
                  cell.isCurrentMonth ? 'bg-background/25' : 'bg-muted/10 opacity-40'
                } ${
                  isToday
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : ''
                } ${
                  mood ? moodBgClasses[mood] : 'hover:bg-secondary/15 hover:border-border'
                }`}
              >
                {/* Cell Header: Day Number + Multiple Badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>
                    {cell.dayNum}
                  </span>
                  {dayEntries.length > 1 && (
                    <span className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded-full">
                      {dayEntries.length}
                    </span>
                  )}
                </div>

                {/* Mood Indicator / Icon */}
                {mood && (
                  <div className="flex items-center justify-center text-lg mt-1">
                    {moodEmojis[mood]}
                  </div>
                )}

                {/* Streak/Badge Indicator */}
                {streakCount > 1 && (
                  <div className="absolute bottom-1 right-1 text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-1 rounded-sm flex items-center gap-0.5">
                    🔥 {streakCount}
                  </div>
                )}

                {/* Premium Hover Tooltip (Pure CSS trigger) */}
                {hasEntries && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-30 w-56 p-3 bg-card/95 border border-border/80 backdrop-blur-md rounded-xl shadow-xl text-xs pointer-events-none transition-all scale-95 origin-bottom group-hover:scale-100 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                      <span className="font-bold text-foreground">
                        {new Date(cell.dateStr + 'T12:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {mood && (
                        <span className="capitalize font-semibold text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          {moodEmojis[mood]} {mood}
                        </span>
                      )}
                    </div>
                    {/* Entries List */}
                    <div className="py-2 space-y-1.5 max-h-24 overflow-y-auto">
                      {dayEntries.map((e) => (
                        <div key={e.id} className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{e.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            ⏱️ {new Date(e.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Footer stats */}
                    <div className="pt-1.5 border-t border-border/60 flex justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>📝 {totalWords} words</span>
                      {streakCount > 0 && <span>🔥 {streakCount}-day streak</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mood Legend bar */}
      <div className="bg-card/30 border border-border/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Mood Indicator Legend:
        </span>
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>🌟 Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>😄 Great</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500" />
            <span>🙂 Good</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>😐 Okay</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500" />
            <span>😢 Sad</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>😟 Anxious</span>
          </div>
        </div>
      </div>

      {/* Sticky Notes & Favorites Board */}
      <div className="space-y-4 pt-6 border-t border-border/40 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Quote className="w-5 h-5 text-primary rotate-180" />
              Sticky Notes Board
            </h2>
            <p className="text-xs text-muted-foreground">Pin quick thoughts, affirmations, or bookmark manifestations</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filters */}
            <div className="flex bg-muted/65 p-1 rounded-lg border border-border/40 text-xs">
              <button
                onClick={() => setNoteFilter('all')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  noteFilter === 'all'
                    ? 'bg-card text-foreground shadow-sm border border-border/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Notes
              </button>
              <button
                onClick={() => setNoteFilter('favorites')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  noteFilter === 'favorites'
                    ? 'bg-card text-foreground shadow-sm border border-border/20'
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
              className="bg-primary hover:bg-primary/95 text-white gap-1 text-xs font-semibold cursor-pointer h-8 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Note
            </Button>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="py-10 text-center bg-card/40 border border-dashed border-border/60 rounded-2xl">
            <p className="text-sm font-semibold text-muted-foreground">No sticky notes found.</p>
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
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border-l-[6px] border-l-current border shadow-sm hover:shadow-md transition-all duration-300 ${colorConfig.bg} ${colorConfig.text} overflow-hidden`}
                >
                  {/* Top Action Bar */}
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
                      <span className="text-[9px] uppercase font-bold opacity-60 tracking-wider">
                        Pinned on {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Favorite / Bookmark Toggle Buttons */}
                      <button
                        onClick={() => handleToggleFavoriteNote(note.id)}
                        className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
                        title="Toggle Favorite"
                      >
                        <Heart className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-current text-rose-600' : 'opacity-65 hover:opacity-100'}`} />
                      </button>
                      <button
                        onClick={() => handleToggleBookmarkNote(note.id)}
                        className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
                        title="Toggle Bookmark"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${note.isBookmarked ? 'fill-current text-amber-600' : 'opacity-65 hover:opacity-100'}`} />
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

                  {/* Content Card Body */}
                  <div className="flex-1 space-y-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          className="w-full bg-white/40 border border-black/10 rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:bg-white/60"
                          placeholder="Note Title"
                        />
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          rows={3}
                          className="w-full bg-white/40 border border-black/10 rounded px-2.5 py-1 text-xs focus:outline-none focus:bg-white/60 resize-none"
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

                  {/* Editing confirmation toolbar */}
                  {isEditing && (
                    <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-black/5">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="p-1 px-2 bg-black/5 hover:bg-black/10 rounded text-[9px] font-bold transition-all cursor-pointer text-current"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        className="p-1 px-2.5 bg-black/80 hover:bg-black/90 text-white rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
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

      {/* Immersive 3D Physical Open Leather Diary Details */}
      {showDrawer && selectedDateStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          {/* Backdrop Clicker */}
          <div className="absolute inset-0" onClick={() => setShowDrawer(false)} />

          {/* 3D Physical Open Notebook Container */}
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#2a170d] border-4 border-[#4a2e19] rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-3 sm:p-6 flex flex-col z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
            {/* Gold Brass Corner Accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-amber-500/80 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-amber-500/80 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-amber-500/80 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-amber-500/80 rounded-br-sm pointer-events-none" />

            {/* Book Cover Stitch Pattern */}
            <div className="absolute inset-2 border border-dashed border-amber-700/40 rounded-[22px] pointer-events-none" />

            {/* Notebook Header Bar */}
            <div className="flex items-center justify-between pb-3 px-4 z-20 border-b border-amber-900/40 text-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-900/60 border border-amber-600/50 flex items-center justify-center text-amber-300 shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-amber-100 tracking-wide">Personal Journal Diary</h3>
                  <p className="text-xs text-amber-300/80 font-medium">📅 {selectedDateFormatted}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDrawer(false)}
                className="text-amber-300 hover:text-white hover:bg-amber-900/50 rounded-full cursor-pointer"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Open Ruled Notebook Paper Area */}
            <div className="flex-1 overflow-y-auto my-3 relative rounded-xl bg-[#fffdf5] dark:bg-[#181512] shadow-2xl border border-amber-950/20 p-4 sm:p-8 space-y-8">
              
              {/* Central Spiral Binder Rings Visual */}
              <div className="absolute left-6 top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none z-20 opacity-80">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-8 h-3.5 -ml-10 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-600 shadow-md border border-slate-700" />
                ))}
              </div>

              {/* Satin Red Bookmark Ribbon Hanging out */}
              <div className="absolute right-12 top-0 w-6 h-28 bg-gradient-to-b from-red-700 via-red-600 to-red-800 shadow-xl rounded-b-md z-20 pointer-events-none border-x border-red-900">
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-500/80 clip-triangle" />
              </div>

              {selectedDayEntries.length > 0 ? (
                selectedDayEntries.map((entry) => {
                  const mood = fromBackendMood(entry.mood);
                  const wordCount = entry.content ? entry.content.split(/\s+/).filter(Boolean).length : 0;
                  return (
                    <div
                      key={entry.id}
                      className="relative bg-ruled-paper rounded-xl p-6 sm:p-8 shadow-md border border-amber-900/10 space-y-4 overflow-hidden"
                    >
                      {/* Entry Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-300/40 pb-3 pl-6">
                        <div>
                          <h4 className="font-script text-3xl font-bold text-amber-950 dark:text-amber-100 tracking-wide">
                            {entry.title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-semibold mt-1">
                            ⏱️ Recorded at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <MoodBadge mood={mood} size="sm" label />
                      </div>

                      {/* Animated Pen Fountain Writing Area */}
                      <HandwritingWriter text={entry.content} />

                      {/* AI Reflections & Tags */}
                      {entry.aiReflection && (
                        <div className="ml-6 bg-amber-500/10 border-l-4 border-amber-600 p-4 rounded-r-xl space-y-1 my-4">
                          <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400 font-bold">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>THERAPIST INSIGHT</span>
                          </div>
                          <p className="text-sm italic font-serif text-amber-950 dark:text-amber-200">
                            &quot;{entry.aiReflection.content}&quot;
                          </p>
                        </div>
                      )}

                      {/* Footer Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-amber-900/10 text-xs font-semibold pl-6">
                        <span className="text-amber-900/70 dark:text-amber-400/80">📝 {wordCount} words recorded</span>
                        
                        <div className="flex items-center gap-2">
                          <Link href={`/journal/${entry.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-amber-800/30">
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleDuplicate(entry)} className="gap-1.5 h-8 text-xs border-amber-800/30">
                            <Copy className="w-3.5 h-3.5" /> Duplicate
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleShare(entry)} className="gap-1.5 h-8 text-xs border-amber-800/30">
                            <Share2 className="w-3.5 h-3.5" /> Share
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(entry.id)} className="gap-1.5 h-8 text-xs text-rose-600 hover:bg-rose-500/10 border-rose-300">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-amber-800/40 mx-auto" />
                  <p className="text-lg font-serif text-amber-900/70 dark:text-amber-400">No diary entry written for this date.</p>
                </div>
              )}
            </div>

            {/* Notebook Footer Bar */}
            <div className="pt-2 px-4 flex items-center justify-between border-t border-amber-900/40">
              <Link href={`/journal/new?date=${selectedDateStr}`} className="w-full sm:w-auto">
                <Button className="w-full gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold shadow-lg">
                  <Plus className="w-4 h-4" />
                  Write New Diary Page
                </Button>
              </Link>
              <Button variant="ghost" className="text-amber-300 hover:text-white" onClick={() => setShowDrawer(false)}>
                Close Diary
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
