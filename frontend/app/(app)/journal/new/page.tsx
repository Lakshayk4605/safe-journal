'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmotionChip } from '@/components/ui/emotion-chip';
import { emotionTags } from '@/lib/mock-data';
import type { Mood } from '@/lib/mock-data';
import { ArrowLeft, Save, Sparkles, Mic, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
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
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/journal" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold">New Journal Entry</h1>
        <div className="w-8" />
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

      {/* Editor Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Title & Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              type="text"
              placeholder="What's on your mind today?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-lg cursor-pointer"
              required
            />
          </div>
        </div>

        {/* Mood Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">How are you feeling?</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {moods.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => setSelectedMood(mood)}
                className={`p-3 rounded-lg font-medium capitalize transition-all ${
                  selectedMood === mood
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                    : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Entry</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleScanDiary}
                disabled={isScanning}
                className="gap-2 cursor-pointer transition-all active:scale-95 no-print"
              >
                <Camera className="w-3.5 h-3.5 text-primary" />
                Scan Written Diary
              </Button>
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleToggleListening}
                disabled={isScanning}
                className="gap-2 cursor-pointer transition-all active:scale-95 no-print"
              >
                {isListening ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    Listening (Click to Stop)...
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-primary animate-pulse" />
                    Dictate with Voice
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="relative">
            <textarea
              placeholder="Write your thoughts, feelings, and experiences here. Be as detailed as you'd like..."
              value={content + interimText}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-96 p-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none animate-in fade-in"
              required
              disabled={isScanning}
            />
            {isScanning && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg border border-border z-20 animate-in fade-in duration-300">
                <div className="space-y-4 text-center max-w-xs px-4">
                  {/* Bouncing Scanner Laser Visualizer */}
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
              </div>
            )}
          </div>
        </div>

        {/* Emotions */}
        <div className="space-y-3">
          <label className="text-sm font-medium">How do you feel? (Select all that apply)</label>
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
          <label className="text-sm font-medium">Tags (comma-separated)</label>
          <Input
            type="text"
            placeholder="work, personal, health"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Tags help you organize and find entries later
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Link href="/journal" className="flex-1">
            <Button variant="outline" className="w-full cursor-pointer" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={() => saveEntry(true)}
            disabled={saving || !title || !content}
            className="flex-1 gap-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-secondary-foreground" />
            {saving ? 'Saving...' : 'Save & Get AI Help'}
          </Button>
          <Button
            type="button"
            onClick={() => saveEntry(false)}
            disabled={saving || !title || !content}
            className="flex-1 gap-2 hover:scale-105 active:scale-95 duration-200 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
}
