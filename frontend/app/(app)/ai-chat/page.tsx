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

  // Render method for the Animated Wellness Coach Sanctuary
  const renderCoachSanctuary = () => {
    const coachState = loading ? 'thinking' : (isSpeaking ? 'speaking' : 'idle');

    // We can extract the last assistant message content
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const speechBubbleText = 
      coachState === 'speaking' 
        ? (lastAssistantMsg ? lastAssistantMsg.content : 'Reflecting on your thoughts...')
        : coachState === 'thinking'
          ? 'Hmm... let me reflect on that...'
          : 'I\'m here, listening. What is on your mind?';

    return (
      <div className="w-full h-full flex flex-col items-center justify-between py-2 space-y-6 relative">
        {/* Minimize Button in Sanctuary */}
        <button
          onClick={() => setIsSanctuaryCollapsed(true)}
          className="absolute right-0 top-0 p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer hidden lg:flex"
          title="Minimize Sanctuary"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <h3 className="font-extrabold text-lg bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Wellness Sanctuary
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Your personal Wellness Coach</p>
        </div>

        {/* Zen Room / Sanctuary Scene */}
        <div className="relative w-full h-[280px] rounded-3xl bg-gradient-to-b from-[#1b1e2e] via-[#24293f] to-[#121420] border border-border/55 shadow-inner overflow-hidden flex flex-col items-center justify-center">
          {/* Ambient warm lamp light glow */}
          <div className={`absolute -right-8 top-12 w-48 h-48 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${
            coachState === 'speaking' ? 'bg-amber-400 scale-125' : coachState === 'thinking' ? 'bg-amber-500 scale-110' : 'bg-amber-300 scale-100'
          }`} />

          {/* Warm background wall texture styling */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Bookshelf on the left */}
          <div className="absolute top-8 left-4 w-12 h-36 bg-amber-950/15 border-r border-amber-900/25 flex flex-col justify-between py-2 pointer-events-none opacity-60">
            {/* Shelf 1 */}
            <div className="border-b border-amber-800/20 w-full flex gap-0.5 items-end justify-center px-1">
              <div className="w-1.5 h-6 bg-red-800/80 rounded-sm" />
              <div className="w-1.5 h-7 bg-blue-800/80 rounded-sm transform rotate-6 origin-bottom" />
              <div className="w-2 h-5 bg-emerald-800/80 rounded-sm" />
            </div>
            {/* Shelf 2 */}
            <div className="border-b border-amber-800/20 w-full flex gap-0.5 items-end justify-center px-1">
              <div className="w-2 h-7 bg-amber-800/70 rounded-sm" />
              <div className="w-1.5 h-6 bg-indigo-800/80 rounded-sm" />
              <div className="w-1.5 h-6 bg-teal-800/80 rounded-sm transform -rotate-12 origin-bottom" />
            </div>
            {/* Shelf 3 */}
            <div className="w-full flex gap-0.5 items-end justify-center px-1">
              <div className="w-1.5 h-5 bg-purple-800/80 rounded-sm" />
              <div className="w-2 h-6 bg-rose-800/80 rounded-sm" />
            </div>
          </div>

          {/* Floor Lamp on the right */}
          <div className="absolute right-6 bottom-4 w-8 h-48 flex flex-col items-center pointer-events-none opacity-60">
            <div className="w-8 h-6 bg-amber-100/90 rounded-t-lg shadow-md border-b border-amber-200" />
            <div className="w-0.5 h-36 bg-amber-900/50" />
            <div className="w-6 h-1.5 bg-amber-900/60 rounded-sm" />
            <div className="absolute -top-6 w-24 h-24 rounded-full bg-amber-400/10 blur-xl animate-pulse" />
          </div>

          {/* Styled Potted Plant on left base */}
          <div className="absolute left-16 bottom-4 w-10 h-16 pointer-events-none opacity-50">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-300 rounded-sm border border-stone-400" />
            <div className="absolute -top-2 left-2 w-4 h-8 text-emerald-600 animate-plant-sway">
              <svg viewBox="0 0 100 150" fill="currentColor">
                <path d="M10,150 Q30,80 80,40 Q60,90 20,150 Z" />
              </svg>
            </div>
            <div className="absolute -top-4 left-4 w-4 h-10 text-emerald-700 animate-plant-sway delay-500">
              <svg viewBox="0 0 100 150" fill="currentColor" className="scale-x-[-1]">
                <path d="M10,150 Q30,80 80,40 Q60,90 20,150 Z" />
              </svg>
            </div>
          </div>

          {/* Professional Coach Figure Sitting in Armchair */}
          <div className={`relative w-36 h-36 flex flex-col items-center justify-end pb-4 transition-all duration-500 ${
            coachState === 'speaking' ? 'animate-coach-speak-bob' : 'animate-coach-breathe'
          }`}>
            
            {/* Coach SVG Avatar */}
            <svg width="115" height="115" viewBox="0 0 100 100" className="drop-shadow-lg overflow-visible">
              {/* Sigmund Freud style Red Wing Armchair back */}
              <path d="M 15 90 L 15 35 C 15 22, 23 15, 32 24 C 32 24, 50 18, 68 24 C 77 15, 85 22, 85 35 L 85 90 Z" fill="#7a0928" /> {/* Red back structure */}
              <path d="M 22 90 L 22 40 C 22 32, 30 28, 50 28 C 70 28, 78 32, 78 40 L 78 90 Z" fill="#9e1039" /> {/* Inner cushion */}
              <path d="M 12 90 C 12 72, 20 72, 20 90 Z" fill="#5c0d24" /> {/* Left armrest */}
              <path d="M 88 90 C 88 72, 80 72, 80 90 Z" fill="#5c0d24" /> {/* Right armrest */}

              {/* Body (Professional Brown Blazer Outfit with White Pocket Square) */}
              <path d="M 28 90 C 28 66, 38 62, 50 62 C 62 62, 72 66, 72 90 Z" fill="#543d2b" /> {/* Brown suit jacket */}
              <polygon points="44,62 56,62 50,78" fill="#ffffff" /> {/* Clean white button shirt */}
              <polygon points="49,70 51,70 52,86 48,86" fill="#e63946" /> {/* Solid bright red tie */}

              {/* Blazer Black Lapels */}
              <path d="M 30 76 L 43 63 L 48 90 Z" fill="#1c1917" />
              <path d="M 70 76 L 57 63 L 52 90 Z" fill="#1c1917" />

              {/* White Pocket Square */}
              <polygon points="33,78 37,74 38,79" fill="#ffffff" />

              {/* Neck */}
              <rect x="46" y="52" width="8" height="12" rx="1" fill="#fae1dd" />
              <polygon points="44,62 48,62 46,67" fill="#ffffff" /> {/* Collar left */}
              <polygon points="56,62 52,62 54,67" fill="#ffffff" /> {/* Collar right */}

              {/* Face/Head */}
              <circle cx="50" cy="42" r="11" fill="#fae1dd" />

              {/* Slick back white hair */}
              <path d="M 39 36 C 39 27, 42 26, 50 26 C 58 26, 61 27, 61 36 C 61 36, 50 33, 39 36 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
              <path d="M 39 36 L 39 42 L 41 40 Z" fill="#f1f5f9" /> {/* Sideburn left */}
              <path d="M 61 36 L 61 42 L 59 40 Z" fill="#f1f5f9" /> {/* Sideburn right */}

              {/* White beard & mustache covering neck and chin */}
              <path d="M 40 45 C 40 57, 50 63, 60 45 C 55 42, 45 42, 40 45 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" /> {/* Main Beard */}
              <path d="M 43 46 Q 50 49 57 46 Q 50 51 43 46 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" /> {/* Mustache */}

              {/* Round Wire-rimmed Glasses */}
              <circle cx="45.5" cy="40" r="3.2" stroke="#292524" strokeWidth="0.8" fill="none" />
              <circle cx="54.5" cy="40" r="3.2" stroke="#292524" strokeWidth="0.8" fill="none" />
              <line x1="48.7" y1="40" x2="51.3" y2="40" stroke="#292524" strokeWidth="1" />
              <line x1="39" y1="39" x2="42.3" y2="39" stroke="#292524" strokeWidth="0.8" />
              <line x1="57.7" y1="39" x2="61" y2="39" stroke="#292524" strokeWidth="0.8" />

              {/* Eyes (Blinking or Thinking/Closed) */}
              {coachState === 'thinking' ? (
                <>
                  {/* Closed reflecting eyes */}
                  <path d="M 42.5 40.5 Q 45.5 42.5 48.5 40.5" stroke="#292524" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M 51.5 40.5 Q 54.5 42.5 57.5 40.5" stroke="#292524" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  {/* Open blinking eyes */}
                  <g className="animate-coach-blink origin-[50px_40px]">
                    <circle cx="45.5" cy="40" r="1.1" fill="#292524" />
                    <circle cx="54.5" cy="40" r="1.1" fill="#292524" />
                  </g>
                </>
              )}

              {/* Expressive eyebrows */}
              <path d="M 41 35 Q 45 32 48 35" stroke="#292524" strokeWidth="1" fill="none" />
              <path d="M 52 36 Q 55 35 59 35" stroke="#292524" strokeWidth="1" fill="none" />

              {/* Mouth (Wiggling when speaking, gentle smile otherwise) */}
              {coachState === 'speaking' ? (
                <ellipse cx="50" cy="48" rx="2" ry="2.5" fill="#a4133c" className="animate-coach-speak-mouth origin-[50px_48px]" />
              ) : (
                <path d="M 47 47 Q 50 49 53 47" stroke="#292524" strokeWidth="1" fill="none" strokeLinecap="round" />
              )}

              {/* Left hand raised holding smoking pipe */}
              <circle cx="25" cy="68" r="3.2" fill="#fae1dd" />
              {/* Pipe Stem */}
              <path d="M 24 67 C 22 58, 28 54, 46 51" stroke="#3e2723" strokeWidth="1" fill="none" strokeLinecap="round" />
              {/* Pipe Bowl */}
              <path d="M 22 70 C 19 70, 19 64, 22 64 Z" fill="#4e342e" />
              <circle cx="21" cy="65" r="0.8" fill="#ff4d00" className="animate-pulse" /> {/* Glow embers */}

              {/* Floating, rising smoke vector line with CSS drift */}
              <path d="M 21 65 C 18 53, 25 41, 19 29 C 16 17, 24 11, 20 1" stroke="#f1f5f9" strokeWidth="1.2" fill="none" opacity="0.65" strokeLinecap="round" className="animate-smoke" />
            </svg>
          </div>
        </div>

        {/* Speech Bubble / Subtitles Container */}
        <div className="w-full bg-card/65 border border-border/85 rounded-2xl p-4 shadow-sm relative min-h-[90px] flex items-center justify-center text-center">
          {/* Speech bubble arrow pointer pointing up to the sanctuary */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-t border-l border-border/85 rotate-45" />
          <p className="text-xs font-serif italic text-foreground leading-relaxed line-clamp-3 relative z-10">
            &ldquo;{speechBubbleText}&rdquo;
          </p>
        </div>
      </div>
    );
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
      {/* 1. Side History Sidebar (Desktop view) */}
      <aside 
        className={`hidden md:flex border-r border-border bg-card/45 backdrop-blur-md flex-col justify-between h-full select-none transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-0 p-0 border-r-0 overflow-hidden' : 'w-80 p-4'
        }`}
      >
        {renderSidebarContents()}
      </aside>

      {/* Mobile Sidebar History Drawer */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/60 backdrop-blur-md flex animate-in fade-in duration-300">
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
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Chat Active Header */}
        <header className="border-b border-border/80 px-4 md:px-6 py-4 flex items-center justify-between bg-card/25 backdrop-blur-md relative z-10 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile History Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden h-8 w-8 text-muted-foreground cursor-pointer hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Desktop History Sidebar Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex h-8 w-8 text-muted-foreground cursor-pointer hover:bg-muted mr-1"
              title={isSidebarCollapsed ? "Expand History" : "Minimize History"}
            >
              <Menu className="w-4.5 h-4.5" />
            </Button>

            <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">
                {activeSession ? activeSession.title : 'New Wellness Conversation'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeSession && (
              <>
                {/* Export to Journal Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToJournal}
                  className="h-8 gap-1.5 text-xs font-semibold hover:border-primary/30 transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-primary/5 hidden sm:flex"
                >
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Save to Journal
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportToJournal}
                  className="h-8 w-8 sm:hidden flex cursor-pointer"
                  title="Save to Journal"
                >
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                </Button>

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
              </>
            )}

            {/* Toggle Wellness Sanctuary Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSanctuaryCollapsed(!isSanctuaryCollapsed)}
              className="hidden lg:flex h-8 w-8 text-muted-foreground cursor-pointer hover:bg-muted"
              title={isSanctuaryCollapsed ? "Show Wellness Sanctuary" : "Minimize Wellness Sanctuary"}
            >
              <Brain className={`w-4.5 h-4.5 ${!isSanctuaryCollapsed ? 'text-primary' : ''}`} />
            </Button>
          </div>
        </header>

        {/* Message Panel Box */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 space-y-6 relative">
          {loadingHistory ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
              <span className="text-sm font-semibold text-primary animate-pulse flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" /> Retrieving conversation...
              </span>
            </div>
          ) : (
            <>
              {/* Mobile/Tablet Wellness Coach Sanctuary (Only shown at start of chat, above welcome message) */}
              {messages.length === 1 && (
                <div className="lg:hidden block bg-card/45 border border-border/80 rounded-2xl p-5 shadow-sm max-w-2xl mx-auto mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  {renderCoachSanctuary()}
                </div>
              )}

              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const wordCount = msg.content.split(/\s+/).filter(Boolean).length;

              return (
                <div key={msg.id} className="space-y-6">
                  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-150`}>
                    <div
                      className={`max-w-2xl px-5 py-4 rounded-2xl flex flex-col gap-2 relative group transition-all ${
                        isUser
                          ? 'bg-primary text-primary-foreground shadow-md rounded-tr-sm'
                          : 'bg-card border border-border/80 text-foreground rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {/* Role name */}
                      <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase opacity-60">
                        <span>{isUser ? 'You' : 'Wellness Coach'}</span>
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
                          className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
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
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* If it's the welcome message and we have no user messages yet, show Interactive Mood Check-in and Quick Prompts */}
                  {msg.id === 'welcome' && messages.length === 1 && !loading && (
                    <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Mood check-in */}
                      <div className="bg-card border border-border/85 rounded-2xl p-5 shadow-sm space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Mood Check-in</p>
                        <p className="text-sm text-foreground font-bold">How are you feeling right now?</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {moodCheckIns.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => sendPromptMessage(item.text)}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/60 hover:border-primary rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
                              title={item.label}
                            >
                              <span className="text-base">{item.emoji}</span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prompt suggestion cards */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select a reflection theme</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {promptSuggestions.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.label}
                                onClick={() => sendPromptMessage(item.text)}
                                className="flex flex-col items-start text-left p-5 rounded-2xl bg-card border border-border/85 hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5 cursor-pointer transition-all hover:scale-[1.01] active:scale-99 shadow-sm hover:shadow-md group"
                              >
                                <div className="p-2 bg-primary/10 rounded-xl text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                  <Icon className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-1">
                                  {item.label}
                                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
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
              <div className="bg-card border border-border/80 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary animate-spin" />
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40 animate-pulse duration-1000" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-pulse duration-1000 delay-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse duration-1000 delay-600" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && <p className="text-sm text-destructive text-center mb-2 font-semibold">{error}</p>}

        {/* Input Form Bottom Bar */}
        <footer className="p-4 md:p-6 border-t border-border/85 bg-card/10 select-none">
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

      {/* 3. Wellness Coach Animated Avatar Sanctuary Panel (Desktop view) */}
      <aside 
        className={`hidden lg:flex border-l border-border bg-card/15 backdrop-blur-md flex-col items-center justify-between select-none h-full overflow-y-auto transition-all duration-300 ease-in-out ${
          isSanctuaryCollapsed ? 'w-0 p-0 border-l-0 overflow-hidden' : 'w-96 p-6'
        }`}
      >
        {renderCoachSanctuary()}
      </aside>
    </div>
  );
}
