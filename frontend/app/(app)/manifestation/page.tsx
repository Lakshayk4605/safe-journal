'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Calendar, RefreshCw, AlertCircle, Eye, Star, Target, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { manifestationApi } from '@/lib/api/manifestation';
import { ApiError } from '@/lib/api-client';
import type { BackendManifestationEntry } from '@/lib/api-types';

const prewrittenAffirmations = [
  "I am calm, centered, and ready for whatever the day brings.",
  "I attract positivity, abundance, and healthy relationships.",
  "I trust my journey and believe that things are working out for me.",
  "I release what I cannot control and focus my energy on what I can.",
  "I am proud of my progress and will remain patient with myself.",
  "I command my day with confidence, clarity, and peace."
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
        
        // Cycle breath instructions every 5 seconds
        const phase = Math.floor((60 - breathSeconds) / 5) % 3;
        if (phase === 0) setBreathText('Breathe In...');
        else if (phase === 1) setBreathText('Hold...');
        else setBreathText('Breathe Out...');
      }, 1000);
    } else if (breathSeconds === 0) {
      setBreathingActive(false);
      setVisualized(true);
      setBreathText('Visualized!');
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

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-purple-400 fill-purple-400/20" />
          Daily Manifestation Board
        </h1>
        <p className="text-muted-foreground text-lg">
          Focus your energy, set deliberate intentions, and lock in positive affirmations for the day.
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
            Loading your manifestation board...
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form / Active Board - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Manifestation Card */}
            <div className="bg-card/40 border border-border/55 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Today&apos;s Focus
                </h2>
                {todayEntry && !isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer"
                  >
                    Adjust Focus
                  </Button>
                )}
              </div>

              {!isEditing && todayEntry ? (
                /* Active Manifestation Board View */
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Glowing Affirmation Board */}
                  <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-amber-500/5 p-8 text-center shadow-xl shadow-purple-500/5">
                    
                    {/* Background glow orb */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />

                    <div className="relative z-10 space-y-4">
                      <Star className="w-8 h-8 text-amber-400 fill-amber-400/20 mx-auto animate-pulse" />
                      <p className="text-xs tracking-widest uppercase font-semibold text-purple-400">Daily Affirmation</p>
                      <blockquote className="text-2xl font-bold text-foreground leading-relaxed">
                        &ldquo;{todayEntry.affirmation}&rdquo;
                      </blockquote>
                    </div>
                  </div>

                  {/* Intention Details */}
                  <div className="p-5 bg-muted/40 border border-border/40 rounded-xl space-y-2">
                    <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block">Intention for Today</span>
                    <p className="text-foreground text-lg font-medium leading-relaxed">{todayEntry.intention}</p>
                  </div>

                  {/* Visualization Confirmation badge */}
                  {todayEntry.visualized && (
                    <div className="flex items-center gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      You visualized this intention today. Sent to the universe!
                    </div>
                  )}
                </div>
              ) : (
                /* Write Manifestation Form */
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-5">
                    
                    {/* Intention Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">
                        What is your primary intention or focus for today?
                      </label>
                      <textarea
                        placeholder="e.g. I intend to complete my tasks with ease and maintain a state of calm, regardless of distractions..."
                        value={intention}
                        onChange={(e) => setIntention(e.target.value)}
                        className="w-full min-h-24 p-3 rounded-lg border border-border/50 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-base"
                        required
                      />
                    </div>

                    {/* Affirmation Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-muted-foreground">
                        Your Daily Affirmation
                      </label>
                      <Input
                        type="text"
                        placeholder="Type a custom affirmation or pick from templates below..."
                        value={affirmation}
                        onChange={(e) => setAffirmation(e.target.value)}
                        className="text-base py-5 border-border/50 bg-background/50 focus:border-purple-500/50"
                        required
                      />

                      {/* Templates list */}
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-semibold block">Affirmation Templates:</span>
                        <div className="flex flex-wrap gap-2">
                          {prewrittenAffirmations.map((aff, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setAffirmation(aff)}
                              className="text-xs text-left px-3 py-2 bg-muted/50 border border-border/30 hover:border-purple-500/40 rounded-lg text-foreground hover:bg-muted font-medium transition-all"
                            >
                              {aff}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Visualization checkbox */}
                    <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border/40 rounded-xl">
                      <input 
                        type="checkbox" 
                        id="visualized" 
                        checked={visualized}
                        onChange={(e) => setVisualized(e.target.checked)}
                        className="w-5 h-5 text-purple-500 border-border rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="visualized" className="text-sm font-medium text-foreground cursor-pointer select-none">
                        I have spent a brief moment visualizing this coming to life today
                      </label>
                    </div>

                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                    >
                      <Sparkles className="w-4 h-4 fill-white" />
                      {saving ? 'Manifesting...' : 'Lock In Manifestation'}
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
                <Calendar className="w-6 h-6 text-purple-400" />
                Manifestation Journey
              </h2>

              {history.length > 0 ? (
                <div className="relative border-l border-border/60 ml-4 pl-6 space-y-8">
                  {history.map((entry) => (
                    <div key={entry.id} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-purple-400 bg-background group-hover:scale-125 transition-transform" />

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground font-semibold">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {entry.visualized && (
                            <span className="ml-3 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">VISUALIZED</span>
                          )}
                        </div>

                        <div className="bg-card/30 border border-border/40 rounded-xl p-5 space-y-3 hover:border-purple-500/20 hover:bg-card/50 transition-all duration-300">
                          <div>
                            <span className="text-xs font-semibold uppercase text-purple-400 block tracking-wider mb-0.5">Affirmation</span>
                            <p className="text-foreground font-bold italic leading-relaxed">&ldquo;{entry.affirmation}&rdquo;</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase text-muted-foreground block tracking-wider mb-0.5">Intention</span>
                            <p className="text-foreground text-sm font-medium leading-relaxed">{entry.intention}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card/25 border border-dashed border-border/60 rounded-2xl p-8 text-center text-muted-foreground">
                  No manifestation records yet. Lock in today&apos;s intentions above!
                </div>
              )}
            </div>

          </div>

          {/* Guided Meditation Space - Right Column */}
          <div className="space-y-6">
            <div className="bg-card/40 border border-border/55 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-between min-h-[450px]">
              
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">Visualization Space</h3>
                <p className="text-xs text-muted-foreground font-medium">Breathe and guide your attention to your manifestations</p>
              </div>

              {/* Animated breathing bubble */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Pulsing visual circles */}
                <div 
                  className={`absolute w-36 h-36 rounded-full bg-purple-500/10 border border-purple-500/25 transition-all duration-1000 ${
                    breathingActive ? 'animate-ping scale-110 opacity-70' : 'scale-100'
                  }`} 
                />
                
                <div 
                  className={`relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-white/20 flex flex-col items-center justify-center text-center shadow-xl shadow-purple-500/5 select-none transition-transform duration-1000 ${
                    breathingActive ? 'scale-125' : 'scale-100'
                  }`}
                >
                  <Eye className="w-5 h-5 text-purple-400 mb-1" />
                  <span className="text-xs font-bold text-foreground leading-tight px-2">{breathText}</span>
                  {breathingActive && (
                    <span className="text-[10px] text-purple-400 font-bold mt-1">{breathSeconds}s</span>
                  )}
                </div>
              </div>

              <div className="w-full space-y-2">
                <Button 
                  onClick={startBreathing}
                  disabled={breathingActive}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-5 cursor-pointer shadow-md select-none transition-all duration-300"
                >
                  {breathingActive ? 'Meditation Active...' : 'Begin 1-Minute Focus'}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground px-2 leading-relaxed">
                  Click to start a 60-second breathing timer. Take deep breaths and picture your affirmations as reality.
                </p>
              </div>

            </div>

            {/* Manifest Water Bottle Card */}
            <div className="bg-card/40 border border-border/55 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden card-glow shadow-neon-primary">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Intention Charged Water
                </h3>
                <p className="text-xs text-muted-foreground font-medium">Charge your water with intention and take mindful sips</p>
              </div>

              {/* Water Bottle Graphic */}
              <div className={`relative w-28 h-52 my-6 flex items-center justify-center transition-all duration-300 ${
                isDrinking ? 'scale-95 duration-100 animate-pulse' : 'scale-100'
              }`}>
                {/* Bottle Cap */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 bg-purple-500 rounded-t-md border border-purple-400/50 shadow z-20" />
                {/* Bottle Neck */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-6 border-2 border-b-0 border-white/20 dark:border-white/10 bg-white/5 rounded-t-sm z-10" />
                
                {/* Glass Bottle Body */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent border-2 border-white/20 rounded-[28px] shadow-inner shadow-white/10 overflow-hidden flex flex-col justify-end">
                  
                  {/* Floating intention bubble inside bottle */}
                  {todayEntry && sipCount < 4 && (
                    <div className="absolute inset-x-2 top-8 text-[9px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1.5 rounded-lg text-center leading-tight animate-bounce z-20 pointer-events-none line-clamp-3">
                      {todayEntry.intention}
                    </div>
                  )}

                  {/* Water container */}
                  <div 
                    className="w-full bg-gradient-to-t from-purple-500/50 via-pink-400/40 to-cyan-400/35 relative transition-all duration-1000 overflow-hidden"
                    style={{ height: `${100 - (sipCount * 25)}%` }}
                  >
                    {/* Glowing Core inside Water */}
                    <div className="absolute inset-x-0 bottom-0 top-1/2 bg-cyan-400/10 blur-xl animate-pulse" />
                    
                    {/* Bubbles */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full bg-white/35 animate-bounce"
                        style={{
                          width: `${2 + Math.random() * 4}px`,
                          height: `${2 + Math.random() * 4}px`,
                          bottom: `${Math.random() * 80}%`,
                          left: `${15 + Math.random() * 70}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: `${1.5 + Math.random() * 2}s`,
                        }}
                      />
                    ))}

                    {/* Wave outline line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-white/35 dark:bg-white/20 rounded-full animate-wave" />
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
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 cursor-pointer shadow-md select-none transition-all active:scale-95"
                        >
                          Take a Mindful Sip ({100 - (sipCount * 25)}% full)
                        </Button>
                        <p className="text-[10px] text-muted-foreground px-2 leading-relaxed">
                          Sip mindfully while internalizing today&apos;s intention.
                        </p>
                      </>
                    ) : (
                      <>
                        <Button 
                          onClick={handleRefillBottle}
                          className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-4 cursor-pointer shadow-md select-none transition-all active:scale-95"
                        >
                          Refill Intention Bottle 💧
                        </Button>
                        <p className="text-[10px] text-emerald-400 font-bold px-2 leading-relaxed animate-pulse">
                          Manifestation successfully integrated. Bottle empty.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-muted/40 border border-border/40 rounded-xl text-xs text-muted-foreground leading-normal">
                    Lock in today&apos;s intention above to fill your Manifestation Water Bottle!
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
