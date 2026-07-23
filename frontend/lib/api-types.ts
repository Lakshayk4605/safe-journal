export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
  isEmailVerified: boolean;
  streakDays: number;
  totalEntries: number;
  createdAt: string;
}

export interface BackendPreferences {
  id: string;
  userId: string;
  theme: string;
  notifications: boolean;
  privateMode: boolean;
  timezone: string;
}

export interface BackendProfile extends BackendUser {
  preferences: BackendPreferences | null;
}

export interface BackendTag {
  tag: { id: string; name: string };
}
export interface BackendEmotion {
  emotion: { id: string; name: string };
}
export interface BackendAiReflection {
  id: string;
  content: string;
  model: string;
}

export interface BackendJournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  entryType: 'TEXT' | 'VOICE';
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  isFavorite: boolean;
  isShared: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  tags: BackendTag[];
  emotions: BackendEmotion[];
  aiReflection: BackendAiReflection | null;
}

export interface BackendMoodEntry {
  id: string;
  userId: string;
  mood: string;
  score: number;
  notes: string | null;
  date: string;
}

export interface BackendWellnessSummary {
  averageMood: number;
  bestMood: number;
  totalEntries: number;
  weekOverWeekChange: number;
  moodDistribution: { mood: string; count: number }[];
  trend: { date: string; mood: string; score: number }[];
}

export interface BackendChatSession {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  moodTimeline: string[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendChatMessage {
  id: string;
  chatSessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface BackendChatSessionWithMessages extends BackendChatSession {
  messages: BackendChatMessage[];
}

export interface BackendGratitudeEntry {
  id: string;
  userId: string;
  item1: string;
  item2: string;
  item3: string;
  notes?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendManifestationEntry {
  id: string;
  userId: string;
  intention: string;
  affirmation: string;
  visualized: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}
