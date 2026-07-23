'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Heart, Calendar, RefreshCw, BookOpen, AlertCircle, Smile } from 'lucide-react';
import { useEffect, useState } from 'react';
import { gratitudeApi } from '@/lib/api/gratitude';
import { ApiError } from '@/lib/api-client';
import type { BackendGratitudeEntry } from '@/lib/api-types';

export default function GratitudePage() {
  // Today's entry state
  const [todayEntry, setTodayEntry] = useState<BackendGratitudeEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [item3, setItem3] = useState('');

  // History state
  const [history, setHistory] = useState<BackendGratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Gratitude jar state
  const [drawnItem, setDrawnItem] = useState<{ item: string; date: string } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [showJarDrawing, setShowJarDrawing] = useState(false);

  // Load today's entry and history
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [todayRes, historyRes] = await Promise.all([
        gratitudeApi.getToday(),
        gratitudeApi.getHistory(),
      ]);

      if (todayRes.data.entry) {
        setTodayEntry(todayRes.data.entry);
        setItem1(todayRes.data.entry.item1);
        setItem2(todayRes.data.entry.item2);
        setItem3(todayRes.data.entry.item3);
        setIsEditing(false);
      } else {
        setTodayEntry(null);
        setItem1('');
        setItem2('');
        setItem3('');
        setIsEditing(true);
      }

      setHistory(historyRes.data.history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load gratitude data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save/log daily gratitude
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item1.trim() || !item2.trim() || !item3.trim()) {
      setError('Please list all 3 items to complete your daily gratitude ritual.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const { data } = await gratitudeApi.log({
        item1: item1.trim(),
        item2: item2.trim(),
        item3: item3.trim(),
      });

      setTodayEntry(data.entry);
      setIsEditing(false);
      
      // Reload history to include the updated entry
      const historyRes = await gratitudeApi.getHistory();
      setHistory(historyRes.data.history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your gratitude items.');
    } finally {
      setSaving(false);
    }
  };

  // Draw random past memory from the jar
  const handleDraw = async () => {
    setDrawing(true);
    setShowJarDrawing(false);
    try {
      const res = await gratitudeApi.getRandom();
      if (res.data) {
        setDrawnItem(res.data);
        setShowJarDrawing(true);
      } else {
        setDrawnItem(null);
        setError('Your gratitude jar is empty! Log your first items to fill it.');
      }
    } catch {
      setError('Could not reach into the jar. Please try again.');
    } finally {
      setDrawing(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
          <Heart className="w-10 h-10 text-amber-500 fill-amber-500/20" />
          Everyday Gratitude Writer
        </h1>
        <p className="text-muted-foreground text-lg">
          Cultivate happiness and mindfulness by writing down three things you are grateful for every day.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-lg animate-pulse flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading your gratitude entries...
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form & History - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Gratitude Section */}
            <div className="bg-card/40 border border-border/55 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Smile className="w-5 h-5 text-amber-500" />
                  Today&apos;s Reflections
                </h2>
                {todayEntry && !isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Today&apos;s Items
                  </Button>
                )}
              </div>

              {!isEditing && todayEntry ? (
                /* Completed State */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    You logged your gratitude for today! Keep the streak going.
                  </div>
                  <div className="grid gap-3 pt-2">
                    {[todayEntry.item1, todayEntry.item2, todayEntry.item3].map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl hover:border-amber-500/30 transition-all duration-300"
                      >
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-full font-bold text-xs">
                          {index + 1}
                        </span>
                        <p className="text-foreground font-medium">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Write/Edit Form State */
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                        <span className="w-5 h-5 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-full font-bold text-xs">1</span>
                        What is one thing that brought you joy today?
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. A kind smile from a stranger, warm coffee..."
                        value={item1}
                        onChange={(e) => setItem1(e.target.value)}
                        className="text-base py-5 border-border/50 bg-background/50 focus:border-amber-500/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                        <span className="w-5 h-5 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-full font-bold text-xs">2</span>
                        What is a recent win or positive outcome?
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Finished a hard task at work, went for a run..."
                        value={item2}
                        onChange={(e) => setItem2(e.target.value)}
                        className="text-base py-5 border-border/50 bg-background/50 focus:border-amber-500/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                        <span className="w-5 h-5 flex items-center justify-center bg-amber-500/10 text-amber-500 rounded-full font-bold text-xs">3</span>
                        What is something simple you are thankful to have?
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. My comfortable bed, clean drinking water..."
                        value={item3}
                        onChange={(e) => setItem3(e.target.value)}
                        className="text-base py-5 border-border/50 bg-background/50 focus:border-amber-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      {saving ? 'Logging Gratitude...' : 'Save Gratitude Entries'}
                    </Button>
                    {todayEntry && (
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => {
                          setItem1(todayEntry.item1);
                          setItem2(todayEntry.item2);
                          setItem3(todayEntry.item3);
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* History Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-500" />
                Gratitude Timeline
              </h2>

              {history.length > 0 ? (
                <div className="relative border-l border-border/60 ml-4 pl-6 space-y-8">
                  {history.map((entry) => (
                    <div key={entry.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-amber-500 bg-background group-hover:scale-125 transition-transform" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>

                        <div className="bg-card/30 border border-border/40 rounded-xl p-4 space-y-2 hover:border-amber-500/20 hover:bg-card/50 transition-all duration-300">
                          <div className="grid gap-1 text-sm md:grid-cols-3">
                            <div className="p-2 border-r border-border/30 last:border-0">
                              <span className="text-xs text-muted-foreground block font-semibold mb-1">JOY</span>
                              <p className="text-foreground font-medium leading-relaxed">{entry.item1}</p>
                            </div>
                            <div className="p-2 border-r border-border/30 last:border-0">
                              <span className="text-xs text-muted-foreground block font-semibold mb-1">WIN</span>
                              <p className="text-foreground font-medium leading-relaxed">{entry.item2}</p>
                            </div>
                            <div className="p-2 last:border-0">
                              <span className="text-xs text-muted-foreground block font-semibold mb-1">SIMPLE COMFORT</span>
                              <p className="text-foreground font-medium leading-relaxed">{entry.item3}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card/25 border border-dashed border-border/60 rounded-2xl p-8 text-center text-muted-foreground">
                  No gratitude logged yet. Write your reflections above to fill your timeline!
                </div>
              )}
            </div>

          </div>

          {/* Gratitude Jar Widget - Right Column */}
          <div className="space-y-6">
            <div className="bg-card/40 border border-border/55 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-between min-h-[450px]">
              
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">Your Gratitude Jar</h3>
                <p className="text-xs text-muted-foreground">Reach inside to remember what makes you happy</p>
              </div>

              {/* Gratitude Jar Graphic */}
              <div className="relative w-44 h-56 my-4 flex items-center justify-center">
                {/* Glass Jar Body */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-amber-500/10 border-2 border-white/20 rounded-[40px] shadow-inner shadow-white/15 flex items-center justify-center overflow-hidden">
                  
                  {/* Glowing core */}
                  <div className="absolute w-28 h-28 rounded-full bg-amber-400/15 blur-2xl animate-pulse" />

                  {/* Little particles representing memories */}
                  <div className="absolute w-2 h-2 rounded-full bg-amber-300 top-20 left-12 animate-bounce opacity-70" style={{ animationDelay: '0.2s', animationDuration: '3s' }} />
                  <div className="absolute w-3 h-3 rounded-full bg-orange-400 top-32 right-14 animate-bounce opacity-65" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
                  <div className="absolute w-2 h-2 rounded-full bg-pink-400 top-24 right-10 animate-bounce opacity-80" style={{ animationDelay: '0.9s', animationDuration: '2.5s' }} />
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 bottom-16 left-16 animate-bounce opacity-75" style={{ animationDelay: '1.2s', animationDuration: '3.5s' }} />
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-orange-300 bottom-24 left-10 animate-bounce opacity-60" style={{ animationDelay: '0.1s', animationDuration: '4.5s' }} />

                  {/* Reflection lines */}
                  <div className="absolute top-8 left-4 w-4 h-16 bg-white/5 rounded-full rotate-12" />
                </div>

                {/* Jar Lid */}
                <div className="absolute -top-1 w-24 h-5 bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-500/50 rounded-lg shadow-md z-10" />
                {/* Jar neck thread */}
                <div className="absolute top-3 w-16 h-2 bg-white/25 rounded-sm z-0" />
              </div>

              {/* Action Button */}
              <Button 
                onClick={handleDraw}
                disabled={drawing}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-5 cursor-pointer shadow-md transition-all duration-300 select-none"
              >
                <Sparkles className={`w-4 h-4 mr-2 ${drawing ? 'animate-spin' : 'animate-pulse'}`} />
                {drawing ? 'Drawing a memory...' : 'Draw a past memory'}
              </Button>

              {/* Memory Display Modal/Popup */}
              {showJarDrawing && drawnItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-card border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-6 text-center animate-in zoom-in-95 duration-300">
                    <Heart className="w-12 h-12 text-amber-500 fill-amber-500/10 mx-auto animate-bounce" />
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(drawnItem.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <h4 className="text-sm font-semibold tracking-wide uppercase text-amber-500">You were grateful for:</h4>
                    </div>

                    <blockquote className="text-xl font-medium text-foreground italic border-y border-border/60 py-4 px-2 leading-relaxed">
                      &ldquo;{drawnItem.item}&rdquo;
                    </blockquote>

                    <div className="pt-2">
                      <Button 
                        onClick={() => setShowJarDrawing(false)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer"
                      >
                        Keep smiling!
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
