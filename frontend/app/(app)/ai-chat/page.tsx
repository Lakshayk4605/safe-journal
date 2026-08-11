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
  X,
  Menu,
  Compass,
  ChevronRight,
  Brain
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    "Hi there ❤️\n\nI'm your Wellness Coach. I'm here to listen, support, and help you reflect on whatever is on your mind today. How are you holding up so far?",
};

const promptSuggestions = [
  {
    icon: Compass,
    label: 'De-stress Companion',
    description: "I'm feeling a bit overwhelmed and need help relaxing.",
    text: "I'm feeling a bit overwhelmed right now. Can you guide me through a quick de-stressing or mindfulness reflection?"
  },
  {
    icon: Heart,
    label: 'Express Gratitude',
    description: "Help me draft a quick gratitude entry for today.",
    text: "I want to write a gratitude reflection. Help me brainstorm 3 specific things I can be thankful for today."
  },
  {
    icon: Sparkles,
    label: 'Manifest Goals',
    description: "Refine my manifestation goals for the week.",
    text: "I'm planning my manifestations for the week. Let's work together to phrase them in a positive, powerful way."
  },
  {
    icon: Activity,
    label: 'Analyze Mood Flow',
    description: "Discuss recent feelings and progress patterns.",
    text: "Let's review how my mood has been recently. Based on my logs, what patterns or progress do you observe?"
  }
];

const moodCheckIns = [
  { emoji: '😢', text: "I'm feeling sad today. Can we talk about it?", label: 'Sad' },
  { emoji: '😰', text: "I'm feeling a bit anxious. Can you support me?", label: 'Anxious' },
  { emoji: '😐', text: "I'm feeling alright, just checking in.", label: 'Okay' },
  { emoji: '🙂', text: "I'm feeling good and wanted to share my positive energy!", label: 'Good' },
  { emoji: '🌟', text: "I'm feeling excellent today, life is great!", label: 'Excellent' }
];

export default function AIChatPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<BackendChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<BackendChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');

  // Sidebar controls
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSanctuaryCollapsed, setIsSanctuaryCollapsed] = useState(false);

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
    setIsSpeaking(true);
    
    // Initial blank bubble
    setMessages((prev) => [
      ...prev,
      { id: messageId, role: 'assistant', content: '' }
    ]);

    const interval = setInterval(() => {
      if (index >= words.length) {
        clearInterval(interval);
        setIsSpeaking(false);
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
    setIsSpeaking(false);

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
    setIsSpeaking(false);
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

  const sendPromptMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setError('');
    setIsSpeaking(false);
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
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data } = await chatApi.sendMessage(sessionId, text);
      setLoading(false);
      // Stream response word-by-word
      streamText(data.message.content, data.message.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The AI companion is unavailable right now.');
      setLoading(false);
    }
  };



  const handleExportToJournal = () => {
    if (!activeSession) return;

    const chatTranscript = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => `${m.role === 'user' ? 'Me' : 'AI'}: ${m.content}`)
      .join('\n\n');

    const dateStr = new Date(activeSession.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const defaultTitle = `Chat Reflection - ${dateStr}`;
    let defaultContent = `### AI Chat Companion Reflection\n\n`;
    if (activeSession.summary) {
      defaultContent += `**Summary of Session:** ${activeSession.summary}\n\n`;
    }
    defaultContent += `**Chat Transcript:**\n${chatTranscript}`;

    router.push(`/journal/new?prompt=${encodeURIComponent(defaultTitle)}&content=${encodeURIComponent(defaultContent)}`);
  };

  const renderSidebarContents = () => (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Sidebar Header with Close Button for Desktop */}
      <div className="flex items-center justify-between pb-2 mb-2 flex-shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2 pl-1">
          <BookOpen className="w-4.5 h-4.5 text-primary" />
          <span className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Chat History</span>
        </div>
        <button
          onClick={() => setIsSidebarCollapsed(true)}
          className="hidden md:flex p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Minimize Sidebar"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex flex-col space-y-4 flex-shrink-0">
        <Button
          onClick={() => {
            handleNewChat();
            setIsMobileSidebarOpen(false);
          }}
          className="w-full gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm h-11"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversation titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/50 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-4">
        {groupedSessions.pinned.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-2 flex items-center gap-1">
              <Pin className="w-3 h-3 text-primary rotate-45" /> Pinned
            </span>
            {groupedSessions.pinned.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  selectSession(session);
                  setIsMobileSidebarOpen(false);
                }}
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
                  onClick={() => {
                    selectSession(session);
                    setIsMobileSidebarOpen(false);
                  }}
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
  );

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-background">
      {/* Ambient Background Glow Orbs */}
      <div className="absolute top-10 right-1/3 w-96 h-96 rounded-full bg-gradient-to-tr from-teal-500/15 via-emerald-500/10 to-indigo-500/10 blur-3xl pointer-events-none animate-aurora-float" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/10 via-teal-400/15 to-emerald-500/10 blur-3xl pointer-events-none animate-aurora-float-delayed" />

      {/* 1. Side History Sidebar (Desktop view) */}
      <aside 
        className={`hidden md:flex border-r border-border/80 bg-card/45 backdrop-blur-xl flex-col justify-between h-full select-none transition-all duration-300 ease-in-out z-20 ${
          isSidebarCollapsed ? 'w-0 p-0 border-r-0 overflow-hidden' : 'w-80 p-4'
        }`}
      >
        {renderSidebarContents()}
      </aside>

      {/* Mobile Sidebar History Drawer */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/70 backdrop-blur-xl flex animate-in fade-in duration-300">
          <div className="absolute inset-0 z-0" onClick={() => setIsMobileSidebarOpen(false)} />
          
          <aside className="relative z-10 w-80 h-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col justify-between p-5 animate-in slide-in-from-left duration-300 select-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sidebar-border pb-3 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sidebar-primary" />
                <span className="font-bold text-sidebar-foreground text-base">Chat History</span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar content */}
            {renderSidebarContents()}
          </aside>
        </div>
      )}

      {/* 2. Main Chat Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative z-10">
        {/* Chat Active Header */}
        <header className="border-b border-border/80 px-4 md:px-6 py-4 flex items-center justify-between bg-card/40 backdrop-blur-xl relative z-20 select-none shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile History Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden h-9 w-9 text-muted-foreground cursor-pointer hover:bg-muted rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Desktop History Sidebar Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex h-9 w-9 text-muted-foreground cursor-pointer hover:bg-muted rounded-xl mr-1"
              title={isSidebarCollapsed ? "Expand History" : "Minimize History"}
            >
              <Menu className="w-4.5 h-4.5" />
            </Button>

            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-foreground truncate font-serif">
                  {activeSession ? activeSession.title : 'Wellness Companion Sanctuary'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                  <span>AI Live</span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                Mindful emotional validation & gentle daily self-reflection companion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSession && (
              <>
                {/* Export to Journal Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToJournal}
                  className="h-9 gap-1.5 text-xs font-extrabold rounded-xl border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-all active:scale-95 cursor-pointer shadow-sm hidden sm:flex"
                >
                  <BookOpen className="w-4 h-4 text-teal-500" />
                  <span>Save to Journal</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportToJournal}
                  className="h-9 w-9 sm:hidden flex rounded-xl cursor-pointer border-teal-500/30"
                  title="Save to Journal"
                >
                  <BookOpen className="w-4 h-4 text-teal-500" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTogglePin(activeSession)}
                  className={`h-9 w-9 rounded-xl ${activeSession.isPinned ? 'text-teal-500 bg-teal-500/10' : 'text-muted-foreground'}`}
                  title="Pin Conversation"
                >
                  <Pin className={`w-4 h-4 ${activeSession.isPinned ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleFavorite(activeSession)}
                  className={`h-9 w-9 rounded-xl ${activeSession.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground'}`}
                  title="Favorite Conversation"
                >
                  <Star className={`w-4 h-4 ${activeSession.isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Message Panel Box */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 relative z-10">
          {loadingHistory ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-md z-20">
              <div className="px-6 py-4 rounded-2xl glass-card-sanctuary border border-teal-500/30 flex items-center gap-3 shadow-xl">
                <Sparkles className="w-5 h-5 text-teal-500 animate-spin" />
                <span className="text-sm font-extrabold text-foreground">Opening conversation sanctuary...</span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const wordCount = msg.content.split(/\s+/).filter(Boolean).length;

              return (
                <div key={msg.id} className="space-y-6">
                  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                    <div
                      className={`max-w-2xl px-6 py-5 rounded-3xl flex flex-col gap-2 relative group transition-all duration-300 ${
                        isUser
                          ? 'bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/15 rounded-tr-xs border border-teal-400/30'
                          : 'glass-card-sanctuary border border-teal-500/25 text-foreground rounded-tl-xs shadow-md glow-card-amber backdrop-blur-xl'
                      }`}
                    >
                      {/* Role name */}
                      <div className="flex items-center justify-between text-[10px] font-extrabold tracking-wider uppercase opacity-75">
                        <span className="flex items-center gap-1.5">
                          {isUser ? 'You' : '🌿 Wellness Coach'}
                        </span>
                        {!isUser && wordCount > 0 && <span>📝 {wordCount} words</span>}
                      </div>

                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.content}
                      </p>

                      {/* Copy/Regenerate toolbar */}
                      <div className="flex gap-2 items-center self-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyMessage(msg)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted/50"
                          title="Copy Message"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        {!isUser && index === messages.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRegenerate}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted/50"
                            title="Regenerate Response"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* If it's the welcome message and we have no user messages yet, show Interactive Mood Check-in and Quick Prompts */}
                  {msg.id === 'welcome' && messages.length === 1 && !loading && (
                    <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Mood check-in */}
                      <div className="glass-card-sanctuary border border-teal-500/30 rounded-3xl p-6 shadow-xl space-y-4 glow-card-amber">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-teal-500 fill-teal-500/20" />
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">Quick Emotional Check-in</p>
                        </div>
                        <p className="text-base text-foreground font-extrabold font-serif">How are you feeling in this moment?</p>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {moodCheckIns.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => sendPromptMessage(item.text)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-background/80 hover:bg-gradient-to-r hover:from-teal-500 hover:to-emerald-500 hover:text-white border border-border/80 hover:border-teal-400 rounded-2xl text-xs font-extrabold cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                              title={item.label}
                            >
                              <span className="text-lg">{item.emoji}</span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prompt suggestion cards */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Select a Guided Reflection Theme
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {promptSuggestions.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.label}
                                onClick={() => sendPromptMessage(item.text)}
                                className="flex flex-col items-start text-left p-6 rounded-3xl glass-card-sanctuary border border-border/80 hover:border-teal-500/40 hover:bg-gradient-to-br hover:from-teal-500/10 hover:to-emerald-500/5 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-99 shadow-md hover:shadow-xl group"
                              >
                                <div className="p-3 bg-teal-500/15 border border-teal-500/30 rounded-2xl text-teal-500 mb-3 group-hover:bg-gradient-to-tr group-hover:from-teal-500 group-hover:to-emerald-500 group-hover:text-white transition-all shadow-sm">
                                  <Icon className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-extrabold text-foreground mb-1 flex items-center gap-1.5 font-serif">
                                  {item.label}
                                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-teal-500" />
                                </h4>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                  {item.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          }
        </>
      )}
          {loading && (
            <div className="flex justify-start w-full">
              <div className="glass-card-sanctuary border border-teal-500/30 px-6 py-5 rounded-3xl rounded-tl-xs shadow-lg flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-teal-500 animate-spin" />
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500/50 animate-bounce duration-1000" />
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500/80 animate-bounce duration-1000 delay-150" />
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-bounce duration-1000 delay-300" />
                </div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 pl-1">Coach is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 md:mx-8 mb-2 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center flex items-center justify-center gap-2">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form Bottom Bar */}
        <footer className="p-4 md:p-6 border-t border-border/80 bg-card/30 backdrop-blur-xl select-none relative z-20">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex flex-col gap-2.5">
            <div className="relative flex items-center rounded-2xl border border-border/80 bg-background/80 focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20 shadow-lg transition-all duration-300 overflow-hidden">
              <Input
                type="text"
                placeholder="Share whatever is on your mind today..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full pr-14 h-14 bg-transparent border-0 focus-visible:ring-0 text-foreground font-medium text-sm md:text-base placeholder:text-muted-foreground/70"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2.5 h-9 w-9 p-0 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-teal-400 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md shadow-teal-500/20 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground font-semibold px-2">
              <span>Press Enter to send</span>
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30 animate-pulse" /> Mindful support sanctuary
              </span>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}
