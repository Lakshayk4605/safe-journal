'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mic, Square, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Mood } from '@/lib/mock-data';
import { journalApi } from '@/lib/api/journal';
import { toBackendMood } from '@/lib/mood-map';
import { ApiError } from '@/lib/api-client';

const moods: Mood[] = ['excellent', 'great', 'good', 'okay', 'sad', 'anxious'];

export default function VoiceJournalPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<Mood>('good');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startVisualizer = (stream: MediaStream) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        // Adjust canvas resolution dynamically
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw background grid lines for a high-tech lab feel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }
        for (let i = 0; i < height; i += 20) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
          ctx.stroke();
        }

        // Generate glowing linear gradient for the waveform
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'var(--primary)');
        gradient.addColorStop(0.5, 'var(--accent)');
        gradient.addColorStop(1, 'var(--excellent, #22c55e)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(224, 122, 60, 0.4)';

        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      };

      draw();
    } catch (e) {
      console.error('Failed to init visualizer', e);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // Clean up mic access and any running timer if the user navigates away mid-recording.
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      stopVisualizer();
    };
  }, []);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
      startVisualizer(stream);
    } catch {
      setError('Could not access your microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopVisualizer();
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleReRecord = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    stopVisualizer();
  };

  const handleSave = async () => {
    if (!audioBlob) {
      setError('Record something first!');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const upload = await journalApi.uploadVoice(audioBlob);
      const { data } = await journalApi.create({
        title: title.trim() || `Voice entry — ${new Date().toLocaleDateString()}`,
        content: title.trim()
          ? title.trim()
          : `A ${recordingTime}-second voice journal entry recorded on ${new Date().toLocaleDateString()}.`,
        mood: toBackendMood(mood),
        entryType: 'VOICE',
        audioUrl: upload.url,
        audioDurationSeconds: recordingTime,
      });
      router.push(`/journal/${data.entry.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your recording. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/journal" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Voice Journal Entry</h1>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Recording Section */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-12 space-y-8 text-center">
        {/* Recording Indicator */}
        <div className="space-y-4">
          <div className="inline-block">
            {isRecording && (
              <div className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <span className="font-medium text-destructive">
                  Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            {!isRecording && recordingTime > 0 && (
              <span className="text-muted-foreground">
                {audioBlob ? 'Recorded' : ''} {Math.floor(recordingTime / 60)}:
                {(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Reactive Waveform Canvas */}
          <div className="relative w-full h-24 my-4 flex items-center justify-center">
            {isRecording ? (
              <canvas
                ref={canvasRef}
                className="w-full h-full rounded-xl bg-card border border-border/50 block shadow-inner"
              />
            ) : (
              <div className="w-full h-0.5 bg-muted rounded-full opacity-40" />
            )}
          </div>
        </div>

        {/* Recording Button */}
        {!audioBlob && (
          <>
            <button
              onClick={handleToggleRecording}
              className={`inline-block p-8 rounded-full transition-all ${
                isRecording ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-sm text-muted-foreground">
              {isRecording ? 'Click to stop recording' : 'Click to start recording'}
            </p>
          </>
        )}

        {audioBlob && !isRecording && (
          <div className="space-y-4">
            <audio controls src={URL.createObjectURL(audioBlob)} className="mx-auto" />
            <p className="text-sm text-muted-foreground">Listen back before saving, or re-record.</p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            type="text"
            placeholder="Give your recording a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Mood */}
        <div className="space-y-3">
          <label className="text-sm font-medium">How are you feeling?</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`p-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  mood === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Link href="/journal" className="flex-1">
          <Button variant="outline" className="w-full" disabled={saving}>
            Discard
          </Button>
        </Link>
        <Button variant="outline" className="gap-2" onClick={handleReRecord} disabled={saving || (!audioBlob && !isRecording)}>
          <RefreshCw className="w-4 h-4" />
          Re-record
        </Button>
        <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving || !audioBlob}>
          {saving ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
}
