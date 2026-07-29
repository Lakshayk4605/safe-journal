'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Heart, Calendar, RefreshCw, BookOpen, AlertCircle, Smile, Star, ArrowRight, Flame } from 'lucide-react';
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
  const [notes, setNotes] = useState('');
  const [writeMode, setWriteMode] = useState<'guided' | 'freeform'>('guided');
  const [freeformText, setFreeformText] = useState('');

  // History state
  const [history, setHistory] = useState<BackendGratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Gratitude jar state
  const [drawnItem, setDrawnItem] = useState<{ item: string; date: string } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [showJarDrawing, setShowJarDrawing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; left: number; top: number; size: number; delay: number }>>([]);

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
        const isFree = !todayRes.data.entry.item2 && !todayRes.data.entry.item3;
        setNotes(todayRes.data.entry.notes || '');
        if (isFree) {
          setWriteMode('freeform');
          setFreeformText(todayRes.data.entry.item1);
          setItem1('');
          setItem2('');
          setItem3('');
        } else {
          setWriteMode('guided');
          setItem1(todayRes.data.entry.item1);
          setItem2(todayRes.data.entry.item2);
          setItem3(todayRes.data.entry.item3);
          setFreeformText('');
        }
        setIsEditing(false);
      } else {
        setTodayEntry(null);
        setItem1('');
        setItem2('');
        setItem3('');
        setNotes('');
        setFreeformText('');
        setWriteMode('guided');
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
    setError('');

    const payload: { item1: string; item2?: string; item3?: string; notes?: string } = {
      item1: '',
      notes: notes.trim() || undefined,
    };

    if (writeMode === 'freeform') {
      if (!freeformText.trim()) {
        setError('Please write your custom gratitude entry before saving.');
        return;
      }
      payload.item1 = freeformText.trim();
      payload.item2 = '';
      payload.item3 = '';
    } else {
      if (!item1.trim() || !item2.trim() || !item3.trim()) {
        setError('Please list all 3 items to complete your daily gratitude prompts.');
        return;
      }
      payload.item1 = item1.trim();
      payload.item2 = item2.trim();
      payload.item3 = item3.trim();
    }

    setSaving(true);
    try {
      const { data } = await gratitudeApi.log(payload);

      setTodayEntry(data.entry);
      setIsEditing(false);
      
      const historyRes = await gratitudeApi.getHistory();
      setHistory(historyRes.data.history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your gratitude items.');
    } finally {
      setSaving(false);
    }
  };

  // Draw random past memory from the jar with shake & sparkle animation
  const handleDraw = async () => {
    setDrawing(true);
    setShowJarDrawing(false);
    setIsShaking(true);

    const newSparkles = Array.from({ length: 14 }).map((_, i) => ({
      id: Math.random() + i,
      left: 25 + Math.random() * 50,
      top: 5 + Math.random() * 20,
      size: 10 + Math.random() * 14,
      delay: Math.random() * 0.4,
    }));
    setSparkles(newSparkles);

    setTimeout(() => {
      setIsShaking(false);
    }, 600);

    setTimeout(() => {
      setSparkles([]);
    }, 1800);

    try {
      const res = await gratitudeApi.getRandom();
      if (res.data) {
        setDrawnItem(res.data);
        setTimeout(() => {
          setShowJarDrawing(true);
        }, 1100);
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
    <div className="relative min-h-screen p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto overflow-hidden">
      {/* Ambient Background Glow Orbs */}
      <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-rose-500/15 blur-3xl pointer-events-none animate-aurora-float" />
      <div className="absolute top-1/3 left-10 w-96 h-96 rounded-full bg-gradient-to-br from-pink-500/20 via-amber-400/20 to-yellow-500/15 blur-3xl pointer-events-none animate-aurora-float-delayed" />

      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 md:p-10 border border-amber-500/30 glass-card-sanctuary shadow-2xl overflow-hidden glow-card-amber">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/20 via-orange-500/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 backdrop-blur-md">
              <Heart className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>Mindfulness & Joy Sanctuary</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground font-serif">
              Everyday <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">Gratitude Writer</span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Cultivate happiness and mindfulness by preserving three positive reflections every single day.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card/80 border border-border/80 text-xs font-extrabold text-foreground shadow-sm">
            <Flame className="w-4.5 h-4.5 text-amber-500 fill-amber-500 animate-bounce" />
            <span>{history.length} Memories Preserved</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl px-5 py-4 flex items-center gap-2.5 shadow-md">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-lg animate-pulse flex items-center gap-2 font-bold">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            Opening your gratitude sanctuary...
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 relative z-10">
          {/* Left Column (2/3 width) - Refelctions & History Timeline */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Gratitude Card */}
            <div className="glass-card-sanctuary border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl glow-card-amber">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-serif">
                  <Smile className="w-5 h-5 text-amber-500" />
                  Today&apos;s Reflections
                </h2>
                {todayEntry && !isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs font-bold rounded-xl border-border/60 hover:bg-muted cursor-pointer"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Today&apos;s Items
                  </Button>
                )}
              </div>

              {!isEditing && todayEntry ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-500 text-sm font-bold flex items-center gap-2.5 shadow-sm">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    You logged your gratitude for today! Keep your mindfulness streak burning strong.
                  </div>
                  
                  {(!todayEntry.item2 && !todayEntry.item3) ? (
                    <div className="p-8 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-pink-500/10 border border-amber-500/30 rounded-3xl text-center relative overflow-hidden shadow-lg glow-card-amber">
                      <Heart className="w-10 h-10 text-amber-500 fill-amber-500/20 mx-auto mb-4 animate-pulse" />
                      <blockquote className="text-xl md:text-2xl font-serif font-bold italic text-foreground leading-relaxed text-balance">
                        &ldquo;{todayEntry.item1}&rdquo;
                      </blockquote>
                    </div>
                  ) : (
                    <div className="grid gap-3 pt-2">
                      {[todayEntry.item1, todayEntry.item2, todayEntry.item3].map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-4 p-5 bg-card/60 border border-border/60 rounded-2xl hover:border-amber-500/40 transition-all duration-300 shadow-sm"
                        >
                          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-full font-extrabold text-xs shadow-md">
                            {index + 1}
                          </span>
                          <p className="text-foreground font-medium text-base pt-0.5">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {todayEntry.notes && (
                    <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <span className="text-xs font-extrabold uppercase text-amber-500 tracking-wider block mb-1">Additional Thoughts</span>
                      <p className="text-foreground leading-relaxed text-sm font-medium italic font-serif">&ldquo;{todayEntry.notes}&rdquo;</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Mode Selector */}
                  <div className="flex bg-muted/60 p-1.5 rounded-2xl border border-border/50 max-w-sm mx-auto mb-4">
                    <button
                      type="button"
                      onClick={() => setWriteMode('guided')}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer ${
                        writeMode === 'guided'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Guided Prompts
                    </button>
                    <button
                      type="button"
                      onClick={() => setWriteMode('freeform')}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer ${
                        writeMode === 'freeform'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Freeform Entry
                    </button>
                  </div>

                  <div className="space-y-4">
                    {writeMode === 'guided' ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-amber-500/15 text-amber-500 rounded-full font-bold text-xs">1</span>
                            What is one thing that brought you joy today?
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. A kind smile from a stranger, warm coffee on a cold morning..."
                            value={item1}
                            onChange={(e) => setItem1(e.target.value)}
                            className="text-base py-6 border-border/60 bg-background/60 focus:border-amber-500/50 rounded-2xl"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-amber-500/15 text-amber-500 rounded-full font-bold text-xs">2</span>
                            What is a recent win or positive outcome?
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. Finished a hard task at work, went for an invigorating run..."
                            value={item2}
                            onChange={(e) => setItem2(e.target.value)}
                            className="text-base py-6 border-border/60 bg-background/60 focus:border-amber-500/50 rounded-2xl"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-amber-500/15 text-amber-500 rounded-full font-bold text-xs">3</span>
                            What is something simple you are thankful to have?
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g. My comfortable bed, clean drinking water, supportive friends..."
                            value={item3}
                            onChange={(e) => setItem3(e.target.value)}
                            className="text-base py-6 border-border/60 bg-background/60 focus:border-amber-500/50 rounded-2xl"
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-sm font-bold text-foreground">
                          What are you grateful for today?
                        </label>
                        <textarea
                          placeholder="Write your custom gratitude entry here in your own words..."
                          value={freeformText}
                          onChange={(e) => setFreeformText(e.target.value)}
                          className="w-full min-h-36 p-4 rounded-2xl border border-border/60 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-base leading-relaxed"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-amber-500/15 text-amber-500 rounded-full font-bold text-xs">
                          {writeMode === 'guided' ? '4' : '2'}
                        </span>
                        Additional Thoughts / Personal Notes (Optional)
                      </label>
                      <textarea
                        placeholder="e.g. Deep realizations, warm feelings, or extra thoughts to seal in your gratitude jar today..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full min-h-24 p-4 rounded-2xl border border-border/60 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-base"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-extrabold py-5 px-6 rounded-2xl cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95 transition-all gap-2"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span>{saving ? 'Logging Gratitude...' : 'Save Gratitude Entries'}</span>
                    </Button>
                    {todayEntry && (
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => {
                          setItem1(todayEntry.item1);
                          setItem2(todayEntry.item2);
                          setItem3(todayEntry.item3);
                          setNotes(todayEntry.notes || '');
                          setIsEditing(false);
                        }}
                        className="rounded-2xl font-bold cursor-pointer"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Gratitude Timeline */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-serif flex items-center gap-2 text-foreground">
                <BookOpen className="w-6 h-6 text-amber-500" />
                Gratitude Timeline
              </h2>

              {history.length > 0 ? (
                <div className="relative border-l-2 border-amber-500/30 ml-4 pl-6 space-y-8">
                  {history.map((entry) => (
                    <div key={entry.id} className="relative group">
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-amber-500 bg-background group-hover:scale-125 transition-transform" />
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-extrabold">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          {new Date(entry.date).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>

                        <div className="glass-card-sanctuary border border-border/60 hover:border-amber-500/40 rounded-2xl p-6 space-y-3 transition-all duration-300 hover:scale-[1.01] shadow-md">
                          {(!entry.item2 && !entry.item3) ? (
                            <div className="py-2 text-center">
                              <Heart className="w-5 h-5 text-amber-500 fill-amber-500/20 mx-auto mb-2 animate-pulse" />
                              <blockquote className="text-base font-serif font-bold italic text-foreground leading-relaxed">
                                &ldquo;{entry.item1}&rdquo;
                              </blockquote>
                            </div>
                          ) : (
                            <div className="grid gap-3 text-sm md:grid-cols-3">
                              <div className="p-3 bg-muted/30 border border-border/40 rounded-xl">
                                <span className="text-[10px] text-amber-500 font-extrabold block uppercase tracking-wider mb-1">JOY</span>
                                <p className="text-foreground font-semibold leading-relaxed">{entry.item1}</p>
                              </div>
                              <div className="p-3 bg-muted/30 border border-border/40 rounded-xl">
                                <span className="text-[10px] text-amber-500 font-extrabold block uppercase tracking-wider mb-1">WIN</span>
                                <p className="text-foreground font-semibold leading-relaxed">{entry.item2}</p>
                              </div>
                              <div className="p-3 bg-muted/30 border border-border/40 rounded-xl">
                                <span className="text-[10px] text-amber-500 font-extrabold block uppercase tracking-wider mb-1">SIMPLE COMFORT</span>
                                <p className="text-foreground font-semibold leading-relaxed">{entry.item3}</p>
                              </div>
                            </div>
                          )}

                          {entry.notes && (
                            <div className="mt-2 pt-3 border-t border-border/40 text-xs text-muted-foreground italic leading-normal">
                              <span className="font-extrabold not-italic block mb-0.5 text-[10px] uppercase text-amber-500">Additional Thoughts:</span>
                              &ldquo;{entry.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card-sanctuary border border-dashed border-border/60 rounded-3xl p-8 text-center text-muted-foreground font-semibold">
                  No gratitude logged yet. Write your reflections above to fill your timeline!
                </div>
              )}
            </div>

          </div>

          {/* 3D Gratitude Memory Jar Widget - Right Column */}
          <div className="space-y-6">
            <div className="glass-card-sanctuary border border-amber-500/30 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[500px] shadow-xl glow-card-amber relative overflow-hidden">
              <div className="text-center space-y-1.5 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Memory Treasury</span>
                </div>
                <h3 className="font-extrabold text-lg text-foreground font-serif">Your Gratitude Jar</h3>
                <p className="text-xs text-muted-foreground font-medium">Reach inside to draw a joyful past memory</p>
              </div>

              {/* 3D Glass Cork Jar Container */}
              <div className={`relative w-48 h-60 my-4 flex items-center justify-center group select-none transition-all duration-300 ${
                isShaking ? 'animate-shake' : 'animate-jar-float'
              }`}>
                {/* Floating particles on draw */}
                {sparkles.map((p) => (
                  <Sparkles
                    key={p.id}
                    className="absolute text-amber-400 fill-amber-300 pointer-events-none animate-float-sparkle z-30"
                    style={{
                      left: `${p.left}%`,
                      top: `${p.top}%`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      animationDelay: `${p.delay}s`,
                    } as React.CSSProperties}
                  />
                ))}

                {/* Floating Paper Slip animation */}
                {drawing && (
                  <div className="absolute z-30 w-14 h-7 bg-gradient-to-tr from-amber-200 via-amber-100 to-yellow-50 border border-amber-300/80 rounded-md shadow-xl animate-paper-draw flex items-center justify-center pointer-events-none">
                    <span className="text-[7px] font-extrabold text-amber-900 tracking-wider uppercase">✨ MEMORY ✨</span>
                  </div>
                )}

                {/* Glass Jar Body Sheen */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-amber-500/15 border-2 border-white/30 rounded-[44px] shadow-2xl shadow-amber-500/10 flex items-center justify-center overflow-hidden backdrop-blur-[2px]">
                  
                  {/* Glowing Inner Core */}
                  <div className={`absolute w-32 h-32 rounded-full bg-amber-400/20 blur-2xl transition-all duration-500 ${
                    drawing ? 'scale-125 bg-amber-300/40 animate-pulse' : 'animate-pulse'
                  }`} />

                  {/* Folded Gratitude Origami Paper Notes inside Jar */}
                  <div className="absolute bottom-4 left-6 w-11 h-6 bg-gradient-to-tr from-amber-200 to-amber-100 border border-amber-300/60 rounded-md rotate-[14deg] shadow-md opacity-90 transition-transform group-hover:translate-y-[-2px]" />
                  <div className="absolute bottom-5 right-7 w-10 h-6 bg-gradient-to-tr from-pink-200 to-pink-100 border border-pink-300/60 rounded-md -rotate-[20deg] shadow-md opacity-95 transition-transform group-hover:translate-y-[-1px]" />
                  <div className="absolute bottom-3 left-14 w-11 h-6 bg-gradient-to-tr from-blue-200 to-blue-100 border border-blue-300/60 rounded-md rotate-[42deg] shadow-md opacity-90 transition-transform group-hover:translate-x-[2px]" />
                  <div className="absolute bottom-7 left-10 w-10 h-6 bg-gradient-to-tr from-emerald-200 to-emerald-100 border border-emerald-300/60 rounded-md -rotate-[32deg] shadow-md opacity-95 transition-transform group-hover:translate-y-[-3px]" />
                  <div className="absolute bottom-9 right-10 w-11 h-5 bg-gradient-to-tr from-purple-200 to-purple-100 border border-purple-300/60 rounded-md rotate-[18deg] shadow-md opacity-90 transition-transform group-hover:translate-x-[-1px]" />

                  {/* Glass Reflection Glare Streaks */}
                  <div className="absolute top-4 left-3 bottom-4 w-3.5 bg-gradient-to-r from-white/40 to-transparent rounded-full opacity-70 pointer-events-none" />
                  <div className="absolute top-4 right-3 bottom-4 w-2 bg-gradient-to-l from-white/20 to-transparent rounded-full opacity-50 pointer-events-none" />
                </div>

                {/* Wooden Cork Lid */}
                <div className={`absolute -top-3 w-22 h-6 bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 border border-amber-700/80 rounded-b-lg shadow-lg z-20 flex items-center justify-center origin-bottom-right transition-all duration-300 ${
                  isShaking || drawing ? 'animate-lid-lift' : ''
                }`}>
                  <div className="w-16 h-1 border-t border-amber-600/40 opacity-60" />
                </div>
                <div className="absolute top-3 w-18 h-1 bg-amber-700/70 rounded-full z-20 animate-pulse" />

                {/* Memory Tag */}
                <div className="absolute top-9 right-2 w-11 h-8 bg-amber-100 dark:bg-amber-900 border border-amber-300 rounded-md rotate-[15deg] flex flex-col items-center justify-center shadow-lg z-20 pointer-events-none">
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-300" />
                  <span className="text-[7px] font-extrabold text-amber-800 dark:text-amber-200 uppercase">JOY</span>
                  <span className="text-[7px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">JAR</span>
                </div>
              </div>

              {/* Draw Memory Button */}
              <Button 
                onClick={handleDraw}
                disabled={drawing}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-extrabold py-5 rounded-2xl cursor-pointer shadow-lg shadow-amber-500/25 transition-all duration-300 select-none gap-2"
              >
                <Sparkles className={`w-4 h-4 ${drawing ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{drawing ? 'Drawing a memory...' : 'Draw a Past Memory'}</span>
              </Button>

              {/* Memory Display Modal */}
              {showJarDrawing && drawnItem && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-[#faf6ee] dark:bg-[#1c1812] border-4 border-double border-amber-600/60 rounded-3xl p-8 max-w-md w-full shadow-2xl relative space-y-6 text-center animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
                    <Sparkles className="absolute top-4 left-4 w-4 h-4 text-amber-500/40" />
                    <Sparkles className="absolute bottom-4 right-4 w-4 h-4 text-amber-500/40" />

                    <Heart className="w-12 h-12 text-amber-500 fill-amber-500/20 mx-auto animate-pulse" />
                    
                    <div className="space-y-1.5">
                      <p className="text-xs text-amber-800/80 dark:text-amber-200/80 font-bold flex items-center justify-center gap-1.5 tracking-wide uppercase">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(drawnItem.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <h4 className="text-[10px] font-extrabold tracking-widest uppercase text-amber-600 dark:text-amber-400">Memory Unfolded</h4>
                    </div>

                    <div className="relative py-6 px-4 bg-white/60 dark:bg-black/30 rounded-2xl border border-amber-900/10 shadow-inner">
                      <blockquote className="text-xl font-bold font-serif italic text-amber-950 dark:text-amber-100 leading-relaxed">
                        &ldquo;{drawnItem.item}&rdquo;
                      </blockquote>
                    </div>

                    <div className="pt-2 relative z-10">
                      <Button 
                        onClick={() => setShowJarDrawing(false)}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold py-5 rounded-2xl cursor-pointer shadow-md transition-all duration-300"
                      >
                        Keep Smiling! ✨
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
