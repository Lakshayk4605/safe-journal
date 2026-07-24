'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmotionChip } from '@/components/ui/emotion-chip';
import { emotionTags } from '@/lib/mock-data';
import type { Mood } from '@/lib/mock-data';
import { ArrowLeft, Save, Sparkles, Mic, Camera, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { journalApi } from '@/lib/api/journal';
import { toBackendMood } from '@/lib/mood-map';
import { ApiError } from '@/lib/api-client';

const moods: Mood[] = ['excellent', 'great', 'good', 'okay', 'sad', 'anxious'];

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

function FountainPenGraphic({ isWriting = false }: { isWriting?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 400"
      className={`w-12 h-40 filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] transition-transform duration-100 ${
        isWriting ? 'animate-pen-glide scale-105' : ''
      }`}
    >
      <defs>
        <linearGradient id="goldCapNew" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="silverGripNew" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="nibGoldNew" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#fff099" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Main Pen Body */}
      <rect x="42" y="10" width="36" height="230" rx="18" fill="url(#goldCapNew)" stroke="#451a03" strokeWidth="2" />
      {/* Gold Ring Trim */}
      <rect x="42" y="140" width="36" height="10" fill="#fef08a" stroke="#78350f" strokeWidth="1" />
      {/* Clip */}
      <rect x="56" y="25" width="8" height="110" rx="4" fill="#fef08a" stroke="#78350f" strokeWidth="1" />
      {/* Metallic Silver Grip Section */}
      <polygon points="44,240 76,240 70,315 50,315" fill="url(#silverGripNew)" stroke="#0f172a" strokeWidth="1.5" />
      {/* Metallic Gold Nib */}
      <polygon points="50,315 70,315 64,375 60,392 56,375" fill="url(#nibGoldNew)" stroke="#78350f" strokeWidth="1.5" />
      {/* Nib slit & breather hole */}
      <line x1="60" y1="315" x2="60" y2="385" stroke="#451a03" strokeWidth="1.5" />
      <circle cx="60" cy="345" r="3.5" fill="#451a03" />
    </svg>
  );
}

function RuledNotebookEditor({
  content,
  onChange,
  placeholder,
  disabled
}: {
  content: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [penPos, setPenPos] = useState({ left: 45, top: 15, isWriting: false });
  const markerRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  const updatePenPosition = useCallback(() => {
    if (markerRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const markerRect = markerRef.current.getBoundingClientRect();

      const left = markerRect.left - containerRect.left;
      const top = markerRect.top - containerRect.top;

      setPenPos({
        left: Math.max(35, left),
        top: Math.max(10, top),
        isWriting: true
      });

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setPenPos((prev) => ({ ...prev, isWriting: false }));
      }, 700);
    }
  }, []);

  useEffect(() => {
    updatePenPosition();
  }, [content, updatePenPosition]);

  return (
    <div ref={containerRef} className="relative bg-ruled-paper rounded-xl p-6 sm:p-8 shadow-inner border border-amber-950/20 min-h-[360px] overflow-hidden">
      {/* Red Vertical Margin Line */}
      <div className="absolute top-0 bottom-0 left-11 w-[2px] bg-red-400/60 pointer-events-none z-10" />

      {/* Mirror Container for Calculating Caret Coordinates */}
      <div
        className="absolute top-6 sm:top-8 left-6 sm:left-8 right-6 sm:right-8 bottom-6 sm:bottom-8 pointer-events-none whitespace-pre-wrap break-words font-handwriting text-2xl md:text-3xl leading-[2.25rem] pl-8 opacity-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <span>{content}</span>
        <span ref={markerRef} className="inline-block w-1 h-6 bg-red-500">
          |
        </span>
      </div>

      {/* Real Textarea */}
      <textarea
        placeholder={placeholder}
        value={content}
        onChange={(e) => {
          onChange(e.target.value);
          updatePenPosition();
        }}
        onKeyUp={updatePenPosition}
        onClick={updatePenPosition}
        className="relative z-10 w-full min-h-[300px] bg-transparent text-slate-900 dark:text-amber-100 placeholder:text-amber-900/40 dark:placeholder:text-amber-300/30 focus:outline-none font-handwriting text-2xl md:text-3xl leading-[2.25rem] pl-8 resize-none"
        required
        disabled={disabled}
      />

      {/* Real-time Fountain Pen Nib positioned EXACTLY at marker */}
      <div
        className={`absolute z-30 pointer-events-none transition-all duration-75 ease-out`}
        style={{
          left: `${penPos.left - 10}px`,
          top: `${penPos.top - 125}px`
        }}
      >
        <FountainPenGraphic isWriting={penPos.isWriting} />
      </div>
    </div>
  );
}

export default function NewEntryPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 10);
  });
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood>('good');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [promptSuggestion, setPromptSuggestion] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [interimText, setInterimText] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleScanDiary = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment'; // opens camera directly on mobile devices
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsScanning(true);
      setScanProgress(0);

      try {
        if (!(window as any).Tesseract) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.3/dist/tesseract.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load OCR scanning engine.'));
            document.head.appendChild(script);
          });
        }

        const Tesseract = (window as any).Tesseract;
        const result = await Tesseract.recognize(
          file,
          'eng',
          {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                setScanProgress(Math.round(m.progress * 100));
              }
            }
          }
        );

        const text = result.data.text;
        if (text && text.trim()) {
          setContent((prev) => prev + (prev ? '\n\n' : '') + text.trim());
        } else {
          alert('Could not find any readable text in the image. Please make sure the photo is clear and contains legible writing.');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred while scanning the image. Please try again.');
      } finally {
        setIsScanning(false);
        setScanProgress(0);
      }
    };
    fileInput.click();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setContent((prev) => prev + finalTranscript);
            setInterimText('');
          } else {
            setInterimText(interimTranscript);
          }
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setInterimText('');
          if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please allow microphone access in your browser address bar or settings.');
          }
        };

        rec.onend = () => {
          setIsListening(false);
          setInterimText('');
        };

        setRecognition(rec);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [recognition]);

  const handleToggleListening = () => {
    if (!recognition) {
      alert('Voice dictation is not supported in this browser. Please try using Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      try {
        setInterimText('');
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('Could not start recognition:', err);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryPrompt = params.get('prompt');
      if (queryPrompt) {
        setTitle(queryPrompt);
      }
      const queryDate = params.get('date');
      if (queryDate) {
        setCustomDate(queryDate);
      }
    }
    setPromptSuggestion(writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  }, []);

  const handleUsePrompt = () => {
    setTitle(promptSuggestion);
  };

  const handleCyclePrompt = () => {
    let nextPrompt = promptSuggestion;
    while (nextPrompt === promptSuggestion) {
      nextPrompt = writingPrompts[Math.floor(Math.random() * writingPrompts.length)];
    }
    setPromptSuggestion(nextPrompt);
  };

  const handleToggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  };

  const saveEntry = async (requestAiReflection: boolean) => {
    setError('');
    setSaving(true);
    try {
      const { data } = await journalApi.create({
        title,
        content,
        mood: toBackendMood(selectedMood),
        emotions: selectedEmotions,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        entryType: 'TEXT',
        requestAiReflection,
        createdAt: new Date(customDate + 'T12:00:00').toISOString(),
      });
      router.push(`/journal/${data.entry.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Default form submit is standard save without AI
    saveEntry(false);
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Link href="/journal" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm md:text-base flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </Link>
        <h1 className="text-xl md:text-3xl font-bold text-center truncate flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-amber-600" />
          Personal Diary Page
        </h1>
        <div className="w-12 md:w-8 flex-shrink-0" />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 animate-pulse">
          {error}
        </div>
      )}

      {/* Guided Prompt Bar */}
      {promptSuggestion && (
        <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 shadow-sm hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 animate-bounce" />
            <div className="text-sm">
              <span className="font-semibold text-muted-foreground">Guided Prompt suggestion: </span>
              <span className="text-foreground italic font-medium">&quot;{promptSuggestion}&quot;</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleUsePrompt}
              className="text-xs text-primary hover:text-primary-foreground hover:bg-primary border border-primary/20 px-2.5 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              Use
            </button>
            <button
              type="button"
              onClick={handleCyclePrompt}
              className="text-xs text-muted-foreground hover:text-foreground border border-border px-2.5 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer"
            >
              Cycle
            </button>
          </div>
        </div>
      )}

      {/* 3D PHYSICAL HARDCOVER LEATHER DIARY CONTAINER */}
      <div className="relative w-full bg-[#2a170d] border-4 border-[#4a2e19] rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-4 sm:p-8 z-10 overflow-hidden">
        {/* Brass Gold Corner Accents */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-amber-500/80 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-amber-500/80 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-amber-500/80 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-amber-500/80 rounded-br-sm pointer-events-none" />

        {/* Stitching Border */}
        <div className="absolute inset-2 border border-dashed border-amber-700/40 rounded-[22px] pointer-events-none" />

        {/* Central Spiral Rings Visual */}
        <div className="absolute left-6 top-0 bottom-0 flex flex-col justify-around py-6 pointer-events-none z-30 opacity-80">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-8 h-3.5 -ml-10 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-600 shadow-md border border-slate-700" />
          ))}
        </div>

        {/* Satin Red Bookmark Ribbon Hanging out */}
        <div className="absolute right-10 top-0 w-6 h-32 bg-gradient-to-b from-red-700 via-red-600 to-red-800 shadow-xl rounded-b-md z-30 pointer-events-none border-x border-red-900">
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-500/80 clip-triangle" />
        </div>

        {/* OPEN RULED NOTEBOOK PAPER AREA */}
        <div className="relative rounded-xl bg-[#fffdf5] dark:bg-[#181512] shadow-2xl border border-amber-950/20 p-4 sm:p-8 space-y-6 z-10">

          {/* Editor Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Title & Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold font-serif text-amber-950 dark:text-amber-200">Entry Title</label>
                <Input
                  type="text"
                  placeholder="What's on your mind today?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg bg-white/60 dark:bg-black/40 border-amber-900/20 font-serif font-bold text-amber-950 dark:text-amber-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold font-serif text-amber-950 dark:text-amber-200">Date</label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="text-lg cursor-pointer bg-white/60 dark:bg-black/40 border-amber-900/20 font-bold"
                  required
                />
              </div>
            </div>

            {/* Mood Selection */}
            <div className="space-y-3">
              <label className="text-sm font-bold font-serif text-amber-950 dark:text-amber-200">How are you feeling?</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`p-3 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                      selectedMood === mood
                        ? 'bg-amber-700 text-white shadow-md ring-2 ring-amber-500'
                        : 'bg-amber-900/10 text-amber-900 dark:text-amber-200 hover:bg-amber-900/20'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Ruled Paper Content Textarea with Floating 3D Fountain Pen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold font-serif text-amber-950 dark:text-amber-200">Your Journal Page</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleScanDiary}
                    disabled={isScanning}
                    className="gap-2 cursor-pointer transition-all active:scale-95 border-amber-900/20 text-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                    Scan Written Diary
                  </Button>
                  <Button
                    type="button"
                    variant={isListening ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={handleToggleListening}
                    disabled={isScanning}
                    className="gap-2 cursor-pointer transition-all active:scale-95 border-amber-900/20 text-xs"
                  >
                    {isListening ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                        Dictate Voice
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <RuledNotebookEditor
                content={content + interimText}
                onChange={(val) => setContent(val)}
                placeholder="Write your personal thoughts here... your fountain pen glides as you type on ruled paper!"
                disabled={isScanning}
              />

                {isScanning && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg border border-border z-20 animate-in fade-in duration-300">
                    <div className="space-y-4 text-center max-w-xs px-4">
                      <div className="relative w-16 h-16 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center mx-auto shadow-lg">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                        <div className="absolute left-0 right-0 h-0.5 bg-primary top-1/2 -translate-y-1/2 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-foreground text-sm">Scanning written text...</p>
                        <p className="text-xs text-muted-foreground">Tesseract local OCR engine: {scanProgress}%</p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-300" 
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                  </div>
                )}

            {/* Emotions */}
            <div className="space-y-3">
              <label className="text-sm font-bold font-serif text-amber-950 dark:text-amber-200">How do you feel? (Select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {emotionTags.map((emotion) => (
                  <EmotionChip
                    key={emotion}
                    emotion={emotion}
                    selected={selectedEmotions.includes(emotion)}
                    onToggle={() => handleToggleEmotion(emotion)}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-bold font-serif text-amber-950 dark:text-amber-200">Tags (comma-separated)</label>
              <Input
                type="text"
                placeholder="work, personal, health"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-white/60 dark:bg-black/40 border-amber-900/20"
              />
              <p className="text-xs text-muted-foreground">
                Tags help you organize and find entries later
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-900/20">
              <Link href="/journal" className="flex-1 order-3 sm:order-1">
                <Button variant="outline" className="w-full cursor-pointer border-amber-900/20" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                onClick={() => saveEntry(true)}
                disabled={saving || !title || !content}
                className="flex-1 gap-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer order-2 sm:order-2 bg-amber-800 text-white hover:bg-amber-900"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save & Get AI Help'}
              </Button>
              <Button
                type="button"
                onClick={() => saveEntry(false)}
                disabled={saving || !title || !content}
                className="flex-1 gap-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer order-1 sm:order-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
