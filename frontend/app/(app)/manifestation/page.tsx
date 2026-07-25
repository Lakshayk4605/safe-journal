'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Calendar, RefreshCw, AlertCircle, Eye, Star, Target, CheckCircle2, Heart, Compass, Volume2, ArrowRight, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { manifestationApi } from '@/lib/api/manifestation';
import { ApiError } from '@/lib/api-client';
import type { BackendManifestationEntry } from '@/lib/api-types';

const prewrittenAffirmations = [
  "I am calm, centered, and aligned with limitless opportunities.",
  "I attract positivity, financial abundance, and high-vibration energy.",
  "I trust my inner guidance and believe everything is unfolding perfectly.",
  "I release all fear and step boldly into my highest potential.",
  "I am grateful for my progress and celebrate every small victory.",
  "I command my day with unwavering confidence, clarity, and peace."
];

const bubblePositions = [
  { left: 20, bottom: 15, size: 3, delay: 0.1, duration: 2.1 },
  { left: 45, bottom: 35, size: 5, delay: 0.4, duration: 1.8 },
  { left: 70, bottom: 25, size: 2, delay: 0.7, duration: 2.5 },
  { left: 30, bottom: 65, size: 4, delay: 0.2, duration: 1.9 },
  { left: 60, bottom: 45, size: 3, delay: 0.9, duration: 2.3 },
  { left: 80, bottom: 75, size: 4, delay: 0.5, duration: 1.7 },
];

export default function ManifestationPage() {
  const [todayEntry, setTodayEntry] = useState<BackendManifestationEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [intention, setIntention] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [visualized, setVisualized] = useState(false);

  const [history, setHistory] = useState<BackendManifestationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Breathing timer state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathText, setBreathText] = useState('Visualize');
  const [breathSeconds, setBreathSeconds] = useState(60);

  // Water bottle manifestation state
  const [sipCount, setSipCount] = useState(0);
  const [isDrinking, setIsDrinking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSips = localStorage.getItem('manifest_water_sips');
      const savedDate = localStorage.getItem('manifest_water_date');
      const todayStr = new Date().toDateString();
      if (savedSips && savedDate === todayStr) {
        setSipCount(parseInt(savedSips));
      } else {
        setSipCount(0);
        localStorage.setItem('manifest_water_sips', '0');
        localStorage.setItem('manifest_water_date', todayStr);
      }
    }
  }, []);

  const handleTakeSip = () => {
    if (sipCount >= 4) return;
    setIsDrinking(true);
    const nextSips = sipCount + 1;
    setSipCount(nextSips);
    localStorage.setItem('manifest_water_sips', nextSips.toString());
    
    setTimeout(() => {
      setIsDrinking(false);
    }, 1000);
  };

  const handleRefillBottle = () => {
    setSipCount(0);
    localStorage.setItem('manifest_water_sips', '0');
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [todayRes, historyRes] = await Promise.all([
        manifestationApi.getToday(),
        manifestationApi.getHistory(),
      ]);

      if (todayRes.data.entry) {
        setTodayEntry(todayRes.data.entry);
        setIntention(todayRes.data.entry.intention);
        setAffirmation(todayRes.data.entry.affirmation);
        setVisualized(todayRes.data.entry.visualized);
        setIsEditing(false);
      } else {
        setTodayEntry(null);
        setIntention('');
        setAffirmation('');
        setVisualized(false);
        setIsEditing(true);
      }

      setHistory(historyRes.data.history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load manifestation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Guided breathing loop for visualization
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (breathingActive && breathSeconds > 0) {
      interval = setInterval(() => {
        setBreathSeconds((prev) => prev - 1);
        
        const phase = Math.floor((60 - breathSeconds) / 5) % 3;
        if (phase === 0) setBreathText('Breathe In...');
        else if (phase === 1) setBreathText('Hold Intention...');
        else setBreathText('Exhale & Release...');
      }, 1000);
    } else if (breathSeconds === 0) {
      setBreathingActive(false);
      setVisualized(true);
      setBreathText('Manifested! ✨');
    }

    return () => clearInterval(interval);
  }, [breathingActive, breathSeconds]);

  const startBreathing = () => {
    setBreathingActive(true);
    setBreathSeconds(60);
    setBreathText('Breathe In...');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intention.trim() || !affirmation.trim()) {
      setError('Please provide both your intention and daily affirmation.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const { data } = await manifestationApi.log({
        intention: intention.trim(),
        affirmation: affirmation.trim(),
        visualized,
      });

      setTodayEntry(data.entry);
      setIsEditing(false);

      const historyRes = await manifestationApi.getHistory();
      setHistory(historyRes.data.history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your daily manifestation.');
    } finally {
      setSaving(false);
    }
  };

  const isInhaling = breathText === 'Breathe In...';
  const isHolding = breathText === 'Hold Intention...';
  const isExhaling = breathText === 'Exhale & Release...';

  let bubbleStyle: React.CSSProperties = {
    transition: 'transform 5000ms ease-in-out, background-color 2000ms ease-in-out, border-color 2000ms ease-in-out, box-shadow 2000ms ease-in-out',
  };

  let bubbleBgClass = 'from-purple-500/20 via-pink-500/20 to-amber-500/20 border-purple-400/40 shadow-purple-500/20';

  if (breathingActive) {
    if (isInhaling) {
      bubbleStyle.transform = 'scale(1.4)';
      bubbleBgClass = 'from-indigo-500/35 via-purple-600/30 to-teal-500/30 border-indigo-400/60 shadow-indigo-500/40';
    } else if (isHolding) {
      bubbleStyle.transform = 'scale(1.4)';
      bubbleStyle.transition = 'transform 1000ms ease-in-out';
      bubbleBgClass = 'from-amber-400/40 via-rose-500/35 to-purple-600/40 border-amber-300/60 shadow-amber-400/50';
    } else if (isExhaling) {
      bubbleStyle.transform = 'scale(0.9)';
      bubbleBgClass = 'from-teal-400/35 via-emerald-500/30 to-cyan-500/30 border-teal-300/60 shadow-teal-500/40';
    }
  } else {
    bubbleStyle.transform = 'scale(1.0)';
    bubbleStyle.transition = 'transform 1500ms ease-in-out';
  }

  return (
    <div className="relative min-h-screen p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto overflow-hidden">
      {/* Ambient Background Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-amber-500/15 blur-3xl pointer-events-none animate-aurora-float" />
      <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/20 via-teal-500/20 to-emerald-500/15 blur-3xl pointer-events-none animate-aurora-float-delayed" />

      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 md:p-10 border border-purple-500/30 glass-card-sanctuary shadow-2xl overflow-hidden glow-card-purple">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/20 via-pink-500/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin duration-3000" />
              <span>Manifestation & Abundance Sanctuary</span>
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground font-serif">
              Daily <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">Manifestation Board</span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Focus your energy, set deliberate intentions, and lock in high-vibration affirmations for the day.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/80 border border-border/80 text-xs font-extrabold text-foreground shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>High Vibration Active</span>
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
            <RefreshCw className="w-5 h-5 animate-spin text-purple-500" />
            Connecting to your manifestation space...
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 relative z-10">
          {/* Left Column (2/3 width) - Active Board & Timeline */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Manifestation Card */}
            <div className="glass-card-sanctuary border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl glow-card-purple">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-serif">
                  <Target className="w-5 h-5 text-purple-500" />
                  Today&apos;s High-Vibration Focus
                </h2>
                {todayEntry && !isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer text-xs font-bold rounded-xl border-border/60 hover:bg-muted"
                  >
                    Adjust Intentions
                  </Button>
                )}
              </div>

              {!isEditing && todayEntry ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Glowing Affirmation Card */}
                  <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-amber-500/10 p-8 text-center shadow-xl glow-card-purple">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-4">
                      <Star className="w-10 h-10 text-amber-400 fill-amber-400/20 mx-auto animate-pulse" />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-600 uppercase tracking-widest border border-amber-500/30">
                        Locked-in Affirmation
                      </span>
                      
                      <blockquote className="text-2xl md:text-3xl font-serif font-extrabold italic text-foreground leading-relaxed text-balance">
                        &ldquo;{todayEntry.affirmation}&rdquo;
                      </blockquote>
                    </div>
                  </div>

                  {/* Intention Box */}
                  <div className="p-6 bg-card/60 border border-border/60 rounded-2xl space-y-2">
                    <span className="text-xs uppercase font-extrabold text-purple-500 tracking-wider block">Primary Intention for Today</span>
                    <p className="text-foreground text-lg font-medium leading-relaxed font-serif">&ldquo;{todayEntry.intention}&rdquo;</p>
                  </div>

                  {todayEntry.visualized && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-500 font-bold text-sm shadow-sm">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>Intention successfully visualized & released into the universe today!</span>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-5">
                    
                    {/* Intention Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground">
                        What is your primary intention or focus for today?
                      </label>
                      <textarea
                        placeholder="e.g. I intend to approach all my tasks with calm clarity, creative energy, and confidence..."
                        value={intention}
                        onChange={(e) => setIntention(e.target.value)}
                        className="w-full min-h-28 p-4 rounded-2xl border border-border/60 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-base leading-relaxed"
                        required
                      />
                    </div>

                    {/* Affirmation Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-foreground">
                        Your Daily Affirmation
                      </label>
                      <Input
                        type="text"
                        placeholder="Type a custom affirmation or select a template below..."
                        value={affirmation}
                        onChange={(e) => setAffirmation(e.target.value)}
                        className="text-base py-6 border-border/60 bg-background/60 focus:border-purple-500/50 rounded-2xl"
                        required
                      />

                      {/* Templates List */}
                      <div className="space-y-2 pt-1">
                        <span className="text-xs text-muted-foreground font-bold block uppercase tracking-wider">Quick Affirmation Templates:</span>
                        <div className="flex flex-wrap gap-2">
                          {prewrittenAffirmations.map((aff, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setAffirmation(aff)}
                              className="text-xs text-left px-3.5 py-2.5 bg-card/80 border border-border/50 hover:border-purple-500/50 rounded-xl text-foreground hover:bg-purple-500/10 font-semibold transition-all cursor-pointer"
                            >
                              {aff}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Visualization Checkbox */}
                    <div className="flex items-center gap-3 p-4 bg-muted/40 border border-border/40 rounded-2xl">
                      <input 
                        type="checkbox" 
                        id="visualized" 
                        checked={visualized}
                        onChange={(e) => setVisualized(e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-border rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="visualized" className="text-sm font-semibold text-foreground cursor-pointer select-none">
                        I have spent time visualizing this intention coming to life today
                      </label>
                    </div>

                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-extrabold py-5 px-6 rounded-2xl cursor-pointer shadow-lg shadow-purple-500/25 active:scale-95 transition-all gap-2"
                    >
                      <Sparkles className="w-4 h-4 fill-white" />
                      <span>{saving ? 'Manifesting...' : 'Lock In Manifestation'}</span>
                    </Button>
                    {todayEntry && (
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => {
                          setIntention(todayEntry.intention);
                          setAffirmation(todayEntry.affirmation);
                          setVisualized(todayEntry.visualized);
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

            {/* Manifestation Journey Timeline Stream */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-serif flex items-center gap-2 text-foreground">
                <Calendar className="w-6 h-6 text-purple-500" />
                Manifestation Journey Timeline
              </h2>

              {history.length > 0 ? (
                <div className="relative border-l-2 border-purple-500/30 ml-4 pl-6 space-y-8">
                  {history.map((entry) => (
                    <div key={entry.id} className="relative group">
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-purple-500 bg-background group-hover:scale-125 transition-transform" />

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground font-extrabold flex items-center gap-2">
                          <span>
                            {new Date(entry.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          {entry.visualized && (
                            <span className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                              Visualized ✨
                            </span>
                          )}
                        </div>

                        <div className="glass-card-sanctuary border border-border/60 hover:border-purple-500/40 rounded-2xl p-6 space-y-3 transition-all duration-300 hover:scale-[1.01] shadow-md">
                          <div>
                            <span className="text-[11px] font-extrabold uppercase text-purple-500 tracking-wider block mb-1">Affirmation</span>
                            <p className="text-foreground font-serif font-extrabold italic text-lg leading-relaxed">&ldquo;{entry.affirmation}&rdquo;</p>
                          </div>
                          <div>
                            <span className="text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider block mb-1">Intention</span>
                            <p className="text-foreground text-sm font-medium leading-relaxed">{entry.intention}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card-sanctuary border border-dashed border-border/60 rounded-3xl p-8 text-center text-muted-foreground font-semibold">
                  No manifestation records locked in yet. Set your intention above!
                </div>
              )}
            </div>

          </div>

          {/* Guided Meditation Space & Water Crystal - Right Column (1/3 width) */}
          <div className="space-y-6">

            {/* Guided Breathing Visualization Bubble */}
            <div className="glass-card-sanctuary border border-purple-500/30 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[460px] shadow-xl glow-card-purple">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-base text-foreground flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5 text-purple-500" />
                  Visualization Space
                </h3>
                <p className="text-xs text-muted-foreground font-medium">Breathe & align your consciousness with your goals</p>
              </div>

              <div className="relative w-48 h-48 flex items-center justify-center">
                <div 
                  className={`absolute w-36 h-36 rounded-full transition-all ease-in-out ${
                    breathingActive ? (
                      isInhaling 
                        ? 'bg-indigo-500/20 border border-indigo-500/40 scale-150 duration-[5000ms]' 
                        : isHolding 
                          ? 'bg-amber-500/20 border border-amber-500/40 scale-150 animate-ping duration-[2000ms]' 
                          : 'bg-teal-500/20 border border-teal-500/40 scale-100 duration-[5000ms]'
                    ) : 'bg-purple-500/15 border border-purple-500/30 scale-100 duration-1000'
                  }`} 
                />
                
                <div 
                  style={bubbleStyle}
                  className={`relative z-10 w-32 h-32 rounded-full bg-gradient-to-br border-2 flex flex-col items-center justify-center text-center shadow-xl select-none ${bubbleBgClass}`}
                >
                  <Eye className={`w-6 h-6 mb-1 transition-colors duration-500 ${
                    breathingActive ? (
                      isInhaling ? 'text-indigo-400' : isHolding ? 'text-amber-400 animate-bounce' : 'text-teal-400'
                    ) : 'text-purple-400'
                  }`} />
                  <span className="text-xs font-extrabold text-foreground leading-tight px-2">{breathText}</span>
                  {breathingActive && (
                    <span className="text-xs font-extrabold mt-1 animate-pulse" style={{ color: isInhaling ? '#818cf8' : isHolding ? '#fbbf24' : '#2dd4bf' }}>{breathSeconds}s</span>
                  )}
                </div>
              </div>

              <div className="w-full space-y-2">
                <Button 
                  onClick={startBreathing}
                  disabled={breathingActive}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-extrabold py-5 rounded-2xl cursor-pointer shadow-md transition-all duration-300"
                >
                  {breathingActive ? 'Meditation Active...' : 'Begin 60-Sec Visualization'}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground px-2 leading-relaxed">
                  Take deep, conscious breaths while picturing your intentions as present reality.
                </p>
              </div>
            </div>

            {/* 3D Glass Crystal Elixir Flask Card */}
            <div className="glass-card-sanctuary border border-teal-500/40 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[500px] relative overflow-hidden shadow-2xl glow-card-teal">
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

              <div className="text-center space-y-1.5 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                  <span>Crystal Elixir Flask</span>
                </div>
                <h3 className="font-extrabold text-lg text-foreground font-serif flex items-center justify-center gap-2">
                  Intention Charged Water
                </h3>
                <p className="text-xs text-muted-foreground font-medium">Internalize your goals with mindful sips</p>
              </div>

              {/* 4-Step Hydration Level Drops Track */}
              <div className="flex items-center gap-2 py-2 z-10">
                {[1, 2, 3, 4].map((step) => {
                  const isFilled = sipCount < step;
                  return (
                    <div
                      key={step}
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs transition-all duration-500 ${
                        isFilled
                          ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 border-teal-300 text-white shadow-md shadow-teal-500/30 scale-105'
                          : 'bg-muted/40 border-border/50 text-muted-foreground opacity-40'
                      }`}
                      title={`Sip ${step}`}
                    >
                      💧
                    </div>
                  );
                })}
              </div>

              {/* Ultra-Realistic 3D Glass Crystal Flask Container */}
              <div className={`relative w-36 h-60 my-2 flex items-center justify-center select-none transition-all duration-700 ${
                isDrinking ? 'animate-bottle-drink' : 'hover:scale-105'
              }`}>
                {/* Metallic Rose Gold / Amber Cap */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-5 bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 rounded-t-lg border border-amber-300/80 shadow-md z-30 flex items-center justify-center">
                  <div className="w-6 h-1 bg-amber-600/40 rounded-full" />
                </div>
                
                {/* Glass Rim Collar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 border-2 border-b-0 border-white/40 bg-white/10 rounded-t-sm z-20 backdrop-blur-sm" />

                {/* Glass Bottle Body Sheen */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent border-2 border-white/30 rounded-[36px] shadow-2xl shadow-teal-500/10 overflow-hidden flex flex-col justify-end z-10 backdrop-blur-[2px]">
                  
                  {/* Glass Reflection Glare Streak (Left) */}
                  <div className="absolute top-4 left-2.5 w-2 h-48 bg-gradient-to-b from-white/40 via-white/15 to-transparent rounded-full z-30 pointer-events-none" />

                  {/* Etched Glass Volume Level Indicators (Right) */}
                  <div className="absolute right-2 top-8 bottom-8 flex flex-col justify-between items-end text-[8px] font-extrabold text-white/40 z-30 pointer-events-none">
                    <span className="border-b border-white/30 pr-1">100%</span>
                    <span className="border-b border-white/30 pr-1">75%</span>
                    <span className="border-b border-white/30 pr-1">50%</span>
                    <span className="border-b border-white/30 pr-1">25%</span>
                  </div>

                  {/* Floating Intention Bubble Banner */}
                  {todayEntry && sipCount < 4 && (
                    <div className="absolute inset-x-3 top-6 text-[10px] font-extrabold text-teal-200 bg-teal-950/80 border border-teal-400/50 px-2.5 py-1.5 rounded-2xl text-center leading-tight animate-bounce z-40 shadow-lg line-clamp-2 backdrop-blur-md">
                      ✨ {todayEntry.intention}
                    </div>
                  )}

                  {/* Fluid Liquid Chamber */}
                  <div 
                    className="w-full bg-gradient-to-t from-purple-700/80 via-pink-600/65 via-teal-500/60 to-cyan-400/55 relative transition-all duration-1000 overflow-hidden"
                    style={{ height: `${100 - (sipCount * 25)}%` }}
                  >
                    {/* Glowing Core inside Water */}
                    <div className="absolute inset-x-0 bottom-0 top-1/3 bg-teal-300/25 blur-2xl animate-pulse" />
                    
                    {/* Floating Amethyst Gem inside Water */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-300 animate-crystal-float pointer-events-none opacity-80">
                      💎
                    </div>

                    {/* Fluid Wave SVG Animation at top of water */}
                    <div className="absolute -top-3 inset-x-0 h-6 overflow-hidden pointer-events-none">
                      <svg className="w-[200%] h-full animate-liquid-wave fill-cyan-300/40" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" />
                      </svg>
                    </div>

                    {/* Micro-sparkle Energy Particles */}
                    {bubblePositions.map((bubble, i) => (
                      <div
                        key={i}
                        className={`absolute rounded-full bg-white/60 shadow-sm shadow-white ${
                          isDrinking ? 'animate-ping duration-500' : 'animate-bounce'
                        }`}
                        style={{
                          width: `${bubble.size}px`,
                          height: `${bubble.size}px`,
                          bottom: `${bubble.bottom}%`,
                          left: `${bubble.left}%`,
                          animationDelay: `${bubble.delay}s`,
                          animationDuration: `${bubble.duration}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Water Actions */}
              <div className="w-full space-y-3 z-10 text-center">
                {todayEntry ? (
                  <>
                    {sipCount < 4 ? (
                      <>
                        <Button 
                          onClick={handleTakeSip}
                          disabled={isDrinking}
                          className="w-full bg-gradient-to-r from-teal-500 via-cyan-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold py-4 rounded-2xl cursor-pointer shadow-lg shadow-teal-500/25 select-none transition-all active:scale-95 gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                          <span>Take Mindful Sip ({100 - (sipCount * 25)}% Charged)</span>
                        </Button>
                        <p className="text-[11px] text-muted-foreground px-2 leading-relaxed font-medium">
                          Internalize your intention as you sip from your elixir flask.
                        </p>
                      </>
                    ) : (
                      <>
                        <Button 
                          onClick={handleRefillBottle}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold py-4 rounded-2xl cursor-pointer shadow-lg shadow-purple-500/25 select-none transition-all active:scale-95"
                        >
                          Refill Intention Flask 💧
                        </Button>
                        <p className="text-[11px] text-emerald-400 font-extrabold px-2 leading-relaxed animate-pulse">
                          Manifestation integrated into every cell. Flask empty!
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-card/80 border border-teal-500/30 rounded-2xl text-xs text-foreground leading-normal font-semibold shadow-inner">
                    ✨ Lock in today&apos;s intention above to charge your Crystal Hydration Flask!
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
