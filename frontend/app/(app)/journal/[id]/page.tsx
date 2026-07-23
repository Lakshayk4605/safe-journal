'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoodBadge } from '@/components/ui/mood-badge';
import type { Mood } from '@/lib/mock-data';
import { ArrowLeft, Edit2, Trash2, Share2, X, Save, Zap, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { journalApi } from '@/lib/api/journal';
import { fromBackendMood, toBackendMood } from '@/lib/mood-map';
import { ApiError } from '@/lib/api-client';
import type { BackendJournalEntry } from '@/lib/api-types';

const moods: Mood[] = ['excellent', 'great', 'good', 'okay', 'sad', 'anxious'];

function renderReflectionContent(text: string) {
  return text.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-base font-bold text-foreground mt-4 mb-1.5 flex items-center gap-1.5">
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-lg font-bold text-foreground mt-4 mb-2">
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('- **') || trimmed.startsWith('* **')) {
      const parts = trimmed.slice(2).split('**');
      if (parts.length >= 3) {
        const title = parts[1];
        const content = parts.slice(2).join('**');
        return (
          <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90 pl-4 mt-1">
            <span className="text-accent mt-1.5 font-bold text-[10px]">•</span>
            <span>
              <strong className="text-foreground">{title}</strong>{content}
            </span>
          </div>
        );
      }
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90 pl-4 mt-1">
          <span className="text-accent mt-1.5 font-bold text-[10px]">•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    if (trimmed === '') {
      return <div key={idx} className="h-1.5" />;
    }
    return (
      <p key={idx} className="text-sm text-foreground/95 leading-relaxed whitespace-pre-wrap">
        {line}
      </p>
    );
  });
}

export default function EntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<BackendJournalEntry | null>(null);
  const [neighbors, setNeighbors] = useState<{ prevId: string | null; nextId: string | null }>({
    prevId: null,
    nextId: null,
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [generatingReflection, setGeneratingReflection] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<Mood>('good');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    journalApi
      .get(entryId)
      .then(({ data }) => {
        setEntry(data.entry);
        setEditTitle(data.entry.title);
        setEditContent(data.entry.content);
        setEditMood(fromBackendMood(data.entry.mood));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError('Could not load this entry.');
        }
      })
      .finally(() => setLoading(false));

    // Fetch a window of recent entries to derive prev/next navigation.
    journalApi
      .list({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .then(({ data }) => {
        const index = data.findIndex((e) => e.id === entryId);
        if (index !== -1) {
          setNeighbors({
            prevId: index < data.length - 1 ? data[index + 1].id : null,
            nextId: index > 0 ? data[index - 1].id : null,
          });
        }
      })
      .catch(() => undefined);
  }, [entryId]);

  const handleStartEdit = () => {
    if (!entry) return;
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditMood(fromBackendMood(entry.mood));
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await journalApi.update(entryId, {
        title: editTitle,
        content: editContent,
        mood: toBackendMood(editMood),
      });
      setEntry(data.entry);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await journalApi.remove(entryId);
      router.push('/journal');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this entry.');
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied! Note: this link is only viewable when signed in to your account.');
    } catch {
      alert(window.location.href);
    }
  };

  const handleGenerateReflection = async () => {
    setGeneratingReflection(true);
    setError('');
    try {
      const { data } = await journalApi.generateReflection(entryId);
      setEntry(data.entry);
      setShowReflection(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate a reflection right now.');
    } finally {
      setGeneratingReflection(false);
    }
  };

  const handleShareReflection = async () => {
    if (!entry?.aiReflection) return;
    try {
      await navigator.clipboard.writeText(entry.aiReflection.content);
      alert('Reflection copied to clipboard!');
    } catch {
      // clipboard API unavailable — silently ignore
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading entry...</div>;
  }

  if (notFound || !entry) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">Entry not found</h1>
        <Link href="/journal">
          <Button variant="outline">Back to Entries</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex gap-2">
          {editing ? (
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95" onClick={() => setEditing(false)}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95" onClick={handleStartEdit}>
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive cursor-pointer transition-all hover:scale-105 active:scale-95" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95" onClick={() => window.print()}>
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-card border border-border rounded-xl p-8 space-y-6 bg-gradient-to-br from-card via-card to-secondary/5 shadow-sm hover:shadow-md transition-shadow duration-300">
        {editing ? (
          <div className="space-y-4">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-2xl font-bold" />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {moods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEditMood(m)}
                  className={`p-2 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer ${
                    editMood === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-64 p-4 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <Button className="gap-2 bg-primary hover:bg-primary/90 cursor-pointer" onClick={handleSaveEdit} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <>
            {/* Title & Meta */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-bold flex-1">{entry.title}</h1>
                <MoodBadge mood={fromBackendMood(entry.mood)} size="lg" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {entry.entryType === 'VOICE' && (
                  <>
                    <span>•</span>
                    <span>Voice Entry</span>
                  </>
                )}
              </div>
            </div>

            {entry.audioUrl && (
              <audio controls src={entry.audioUrl} className="w-full">
                Your browser does not support the audio element.
              </audio>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {entry.tags.map(({ tag }) => (
                <span key={tag.id} className="text-sm px-3 py-1 bg-secondary/10 text-secondary rounded-full">
                  #{tag.name}
                </span>
              ))}
            </div>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>

            {/* Emotions */}
            {entry.emotions.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-border">
                <h3 className="font-semibold">Emotions</h3>
                <div className="flex flex-wrap gap-2">
                  {entry.emotions.map(({ emotion }) => (
                    <span key={emotion.id} className="text-sm px-3 py-1.5 bg-muted rounded-full text-muted-foreground hover:scale-105 transition-transform duration-200">
                      {emotion.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reflection */}
            <div className="space-y-3 pt-6 border-t border-border">
              {entry.aiReflection ? (
                <>
                  <button
                    onClick={() => setShowReflection(!showReflection)}
                    className="flex items-center gap-2 font-semibold hover:text-primary transition-colors"
                  >
                    <Zap className="w-4 h-4 text-accent" />
                    AI Reflection
                  </button>
                  {showReflection && (
                    <div className="bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-lg p-4 space-y-3">
                      <div className="space-y-2 text-sm leading-relaxed">{renderReflectionContent(entry.aiReflection.content)}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={handleShareReflection}>
                          Copy Reflection
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 animate-pulse hover:animate-none hover:scale-105 active:scale-95 duration-200"
                  onClick={handleGenerateReflection}
                  disabled={generatingReflection}
                >
                  <Zap className="w-4 h-4 text-accent" />
                  {generatingReflection ? 'Generating...' : 'Generate AI Reflection'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      {!editing && (
        <div className="flex justify-between">
          {neighbors.prevId && (
            <Link href={`/journal/${neighbors.prevId}`}>
              <Button variant="outline">Previous Entry</Button>
            </Link>
          )}
          {neighbors.nextId && (
            <Link href={`/journal/${neighbors.nextId}`} className="ml-auto">
              <Button variant="outline">Next Entry</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
