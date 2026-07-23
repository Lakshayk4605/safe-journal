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
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

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
              return sum + entry.content.split(/\s+/).filter(Boolean).length;
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

      {/* Immersive Side Drawer Drawer Details */}
      {showDrawer && selectedDateStr && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setShowDrawer(false)}
            className="absolute inset-0 bg-background/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg h-full bg-card/95 border-l border-border/80 shadow-2xl backdrop-blur-md p-6 flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Entries Detail</h3>
                <p className="text-xs text-muted-foreground font-semibold">{selectedDateFormatted}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowDrawer(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Entries Body list */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {selectedDayEntries.length > 0 ? (
                selectedDayEntries.map((entry) => {
                  const mood = fromBackendMood(entry.mood);
                  const wordCount = entry.content.split(/\s+/).filter(Boolean).length;
                  return (
                    <div
                      key={entry.id}
                      className="border border-border/80 bg-background/30 rounded-xl p-5 space-y-4 hover:border-primary/40 transition-all relative overflow-hidden"
                    >
                      {/* Mood Indicator Ribbon */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${moodBadgeClasses[mood]}`} />

                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground text-lg">{entry.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ⏱️ Logged at{' '}
                            {new Date(entry.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <MoodBadge mood={mood} size="sm" label />
                      </div>

                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {entry.content}
                      </p>

                      {/* Tags & Emotions */}
                      {(entry.tags.length > 0 || entry.emotions.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {entry.tags.map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="text-[10px] px-2 py-0.5 bg-secondary/15 text-secondary rounded-sm font-semibold"
                            >
                              #{tag.name}
                            </span>
                          ))}
                          {entry.emotions.map(({ emotion }) => (
                            <span
                              key={emotion.id}
                              className="text-[10px] px-1.5 py-0.5 bg-muted rounded-sm text-muted-foreground font-semibold"
                            >
                              {emotion.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* AI Reflection box */}
                      {entry.aiReflection && (
                        <div className="bg-accent/5 border-l-4 border-accent p-3 rounded-r-lg space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-accent font-bold">
                            <Sparkles className="w-3 h-3" />
                            <span>AI INSIGHTS</span>
                          </div>
                          <p className="text-xs italic text-foreground/85 leading-normal">
                            {entry.aiReflection.content}
                          </p>
                        </div>
                      )}

                      {/* Stats footer bar */}
                      <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-3 flex justify-between font-semibold">
                        <span>📝 {wordCount} words</span>
                        {entry.isFavorite && (
                          <span className="text-amber-500 flex items-center gap-0.5">
                            ★ Favorite
                          </span>
                        )}
                      </div>

                      {/* Action buttons footer */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border/20">
                        <Link href={`/journal/${entry.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8">
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(entry)}
                          className="gap-1.5 text-xs h-8"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(entry)}
                          className="gap-1.5 text-xs h-8"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="gap-1.5 text-xs h-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No entries logged.</p>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <Link href={`/journal/new?date=${selectedDateStr}`}>
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  Add New Entry
                </Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={() => setShowDrawer(false)}>
                Close Panel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
