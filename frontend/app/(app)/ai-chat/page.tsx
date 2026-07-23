'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  Pin,
  Search,
  MessageSquare,
  Copy,
  RefreshCw,
  MoreVertical,
  Star,
  Activity,
  Heart,
  Tag,
  BookOpen,
  CornerDownLeft,
  X
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { chatApi } from '@/lib/api/chat';
import { ApiError } from '@/lib/api-client';
import type { BackendChatSession, BackendChatMessage } from '@/lib/api-types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi there ❤️\n\nI'm your AI wellness companion. I'm here to listen, support, and help you reflect on whatever is on your mind today. How are you holding up so far?",
};

export default function AIChatPage() {
  const [sessions, setSessions] = useState<BackendChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<BackendChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');

  // Sidebar controls
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Clipboard copy feedback state
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarEndRef = useRef<HTMLDivElement>(null);

  // Load chat session list
  const loadSessions = async () => {
    try {
      const { data } = await chatApi.listSessions(1, 100);
      setSessions(data);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load messages for the selected session
  const selectSession = async (session: BackendChatSession) => {
    setLoadingHistory(true);
    setError('');
    try {
      const { data } = await chatApi.getSession(session.id);
      setActiveSession(data.session);
      
      const mapped = data.session.messages.map((m) => ({
        id: m.id,
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt,
      }));

      setMessages(mapped.length > 0 ? mapped : [WELCOME_MESSAGE]);
    } catch {
      setError('Could not retrieve chat history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Create new session
  const handleNewChat = async () => {
    setError('');
    try {
      const { data } = await chatApi.createSession();
      setSessions((prev) => [data.session, ...prev]);
      setActiveSession(data.session);
      setMessages([WELCOME_MESSAGE]);
    } catch {
      setError('Failed to initialize a new conversation.');
    }
  };

  // Inline simulation of streaming word-by-word responses
  const streamText = (fullText: string, messageId: string) => {
    let index = 0;
    const words = fullText.split(' ');
    
    // Initial blank bubble
    setMessages((prev) => [
      ...prev,
      { id: messageId, role: 'assistant', content: '' }
    ]);

    const interval = setInterval(() => {
      if (index >= words.length) {
        clearInterval(interval);
        // Reload session data silently in the background to fetch updated AI summary/tags/timeline
        loadSessions().then(() => {
          if (activeSession) {
            chatApi.getSession(activeSession.id).then(({ data }) => {
              setActiveSession(data.session);
            });
          }
        });
        return;
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: words.slice(0, index + 1).join(' ') }
            : msg
        )
      );
      index++;
    }, 45); // Typing speed
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setError('');

    // Ensure session initialized
    let sessionId = activeSession?.id;
    if (!sessionId) {
      try {
        const { data } = await chatApi.createSession();
        sessionId = data.session.id;
        setActiveSession(data.session);
        setSessions((prev) => [data.session, ...prev]);
      } catch {
        setError('Failed to open a chat session.');
        return;
      }
    }

    const localMessageId = `local-${Date.now()}`;
    const userMessage: Message = {
      id: localMessageId,
      role: 'user',
      content: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data } = await chatApi.sendMessage(sessionId, userText);
      setLoading(false);
      // Stream response word-by-word
      streamText(data.message.content, data.message.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The AI companion is unavailable right now.');
      setLoading(false);
    }
  };

  // Actions: Rename
  const handleStartRename = (session: BackendChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = async (sessionId: string) => {
    if (!editingTitle.trim()) return;
    try {
      await chatApi.updateSession(sessionId, { title: editingTitle.trim() });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: editingTitle.trim() } : s))
      );
      if (activeSession?.id === sessionId) {
        setActiveSession((prev) => (prev ? { ...prev, title: editingTitle.trim() } : null));
      }
    } catch {
      setError('Could not rename conversation.');
    } finally {
      setEditingSessionId(null);
    }
  };

  // Actions: Delete
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await chatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([WELCOME_MESSAGE]);
      }
    } catch {
      setError('Could not delete conversation.');
    }
  };

  // Actions: Toggle Pin
  const handleTogglePin = async (session: BackendChatSession) => {
    try {
      const { data } = await chatApi.updateSession(session.id, { isPinned: !session.isPinned });
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, isPinned: data.session.isPinned } : s))
      );
      if (activeSession?.id === session.id) {
        setActiveSession((prev) => (prev ? { ...prev, isPinned: data.session.isPinned } : null));
      }
    } catch {
      setError('Could not pin/unpin conversation.');
    }
  };

  // Actions: Toggle Favorite
  const handleToggleFavorite = async (session: BackendChatSession) => {
    try {
      const { data } = await chatApi.updateSession(session.id, { isFavorite: !session.isFavorite });
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, isFavorite: data.session.isFavorite } : s))
      );
      if (activeSession?.id === session.id) {
        setActiveSession((prev) => (prev ? { ...prev, isFavorite: data.session.isFavorite } : null));
      }
    } catch {
      setError('Could not update favorites status.');
    }
  };

  // Actions: Copy Message
  const handleCopyMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      // ignore clipboard failures
    }
  };

  // Actions: Regenerate Last Message
  const handleRegenerate = async () => {
    if (messages.length < 2 || loading) return;
    const userMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!userMsg || !activeSession) return;

    setLoading(true);
    setError('');

    // Remove last assistant message
    setMessages((prev) => prev.slice(0, prev.length - 1));

    try {
      const { data } = await chatApi.sendMessage(activeSession.id, userMsg.content);
      setLoading(false);
      streamText(data.message.content, data.message.id);
    } catch {
      setError('Regeneration failed.');
      setLoading(false);
    }
  };

  // Group sessions by dates (Today, Yesterday, Last 7 Days, Older)
  const groupedSessions = useMemo(() => {
    const today: BackendChatSession[] = [];
    const yesterday: BackendChatSession[] = [];
    const last7Days: BackendChatSession[] = [];
    const older: BackendChatSession[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

    const filtered = sessions.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Split pinned from standard order
    const pinned = filtered.filter((s) => s.isPinned);
    const unpinned = filtered.filter((s) => !s.isPinned);

    unpinned.forEach((s) => {
      const time = new Date(s.updatedAt || s.createdAt).getTime();
      if (time >= startOfToday) {
        today.push(s);
      } else if (time >= startOfYesterday) {
        yesterday.push(s);
      } else if (time >= startOf7DaysAgo) {
        last7Days.push(s);
      } else {
        older.push(s);
      }
    });

    return { pinned, today, yesterday, last7Days, older };
  }, [sessions, searchQuery]);

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-background">
      {/* 1. Side History Sidebar (ChatGPT style) */}
      <aside className="w-80 border-r border-border bg-card/45 backdrop-blur-md flex flex-col justify-between h-full select-none">
        <div className="flex flex-col flex-1 overflow-hidden p-4 space-y-4">
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm h-11"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </Button>

          {/* Search History */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversation titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background/50 text-xs"
            />
          </div>

          {/* History scroll list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Pinned Section */}
            {groupedSessions.pinned.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-2 flex items-center gap-1">
                  <Pin className="w-3 h-3 text-primary rotate-45" /> Pinned
                </span>
                {groupedSessions.pinned.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session)}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      activeSession?.id === session.id
                        ? 'bg-secondary/15 border border-border/80'
                        : 'hover:bg-secondary/10'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      {editingSessionId === session.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(session.id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          className="w-full bg-background border border-primary px-1.5 py-0.5 rounded text-xs focus:outline-none"
                        />
                      ) : (
                        <>
                          <p className="text-xs font-bold text-foreground truncate">{session.title}</p>
                          {session.summary && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
                              {session.summary}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(session);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(session);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Date-grouped lists */}
            {[
              { label: 'Today', items: groupedSessions.today },
              { label: 'Yesterday', items: groupedSessions.yesterday },
              { label: 'Last 7 days', items: groupedSessions.last7Days },
              { label: 'Older', items: groupedSessions.older },
            ].map(({ label, items }) => {
              if (items.length === 0) return null;
              return (
                <div key={label} className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-2">
                    {label}
                  </span>
                  {items.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => selectSession(session)}
                      className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        activeSession?.id === session.id
                          ? 'bg-secondary/15 border border-border/80'
                          : 'hover:bg-secondary/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        {editingSessionId === session.id ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleSaveRename(session.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(session.id);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            className="w-full bg-background border border-primary px-1.5 py-0.5 rounded text-xs focus:outline-none"
                          />
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-foreground truncate">{session.title}</p>
                            {session.summary && (
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">
                                {session.summary}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Quick controls */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(session);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(session);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 2. Main Chat Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Chat Active Header */}
        <header className="border-b border-border/80 px-6 py-4 flex items-center justify-between bg-card/25 backdrop-blur-md relative z-10 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">
                {activeSession ? activeSession.title : 'New Wellness Conversation'}
              </h2>
              {activeSession?.summary && (
                <p className="text-[11px] text-muted-foreground truncate font-medium">
                  📝 {activeSession.summary}
                </p>
              )}
            </div>
          </div>

          {activeSession && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTogglePin(activeSession)}
                className={`h-8 w-8 ${activeSession.isPinned ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Pin className={`w-4 h-4 ${activeSession.isPinned ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleFavorite(activeSession)}
                className={`h-8 w-8 ${activeSession.isFavorite ? 'text-amber-500' : 'text-muted-foreground'}`}
              >
                <Star className={`w-4 h-4 ${activeSession.isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
          )}
        </header>

        {/* Wellness Dashboard Dropdown (Pin Chat Memory values) */}
        {activeSession && (activeSession.summary || (activeSession.tags && activeSession.tags.length > 0) || (activeSession.moodTimeline && activeSession.moodTimeline.length > 0)) && (
          <div className="bg-card/30 border-b border-border/40 px-6 py-3 flex flex-wrap gap-4 text-xs select-none">
            {activeSession.summary && (
              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 flex-1">
                <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate font-semibold"><strong className="text-foreground">Summary:</strong> {activeSession.summary}</span>
              </div>
            )}
            
            {activeSession.tags && activeSession.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-secondary" />
                <div className="flex gap-1.5">
                  {activeSession.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded-sm font-bold">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeSession.moodTimeline && activeSession.moodTimeline.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span className="font-bold text-[10px] text-muted-foreground mr-1 uppercase">Mood Flow:</span>
                <div className="flex gap-1">
                  {activeSession.moodTimeline.slice(-6).map((mood, idx) => {
                    const moodColors: Record<string, string> = {
                      excellent: 'bg-emerald-500',
                      great: 'bg-green-500',
                      good: 'bg-sky-500',
                      okay: 'bg-amber-500',
                      sad: 'bg-slate-500',
                      anxious: 'bg-rose-500',
                    };
                    return (
                      <div
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full ${moodColors[mood] || 'bg-muted'}`}
                        title={mood}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Panel Box */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 relative">
          {loadingHistory ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
              <span className="text-sm font-semibold text-primary animate-pulse flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" /> Retrieving conversation...
              </span>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              
              // Calculate word count
              const wordCount = msg.content.split(/\s+/).filter(Boolean).length;

              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-150`}>
                  <div
                    className={`max-w-2xl px-5 py-4 rounded-2xl flex flex-col gap-2 relative group transition-all ${
                      isUser
                        ? 'bg-primary text-primary-foreground shadow-md rounded-tr-sm'
                        : 'bg-card border border-border/80 text-foreground rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {/* Role name */}
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase opacity-60">
                      <span>{isUser ? 'You' : 'AI Companion'}</span>
                      {!isUser && wordCount > 0 && <span>📝 {wordCount} words</span>}
                    </div>

                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.content}
                    </p>

                    {/* Copy/Regenerate toolbar */}
                    <div className="flex gap-2 items-center self-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyMessage(msg)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      {!isUser && index === messages.length - 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleRegenerate}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex justify-start w-full">
              <div className="bg-card border border-border/80 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary animate-spin" />
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary/45 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/45 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-primary/45 animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && <p className="text-sm text-destructive text-center mb-2 font-semibold">{error}</p>}

        {/* Input Form Bottom Bar */}
        <footer className="p-6 border-t border-border/85 bg-card/10 select-none">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex flex-col gap-2">
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Share whatever is on your mind..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full pr-12 h-12 bg-background border-border/80 focus:ring-primary shadow-inner rounded-xl font-medium"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/80 px-1 font-semibold">
              <span>Press Enter to send message</span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-current" /> Mindful support, not therapy.
              </span>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}
