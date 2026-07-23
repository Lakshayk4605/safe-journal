export type Mood = 'excellent' | 'great' | 'good' | 'okay' | 'sad' | 'anxious';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  timestamp: Date;
  isVoice: boolean;
  aiReflection?: string;
  emotions: string[];
}

export interface MoodEntry {
  date: Date;
  mood: Mood;
  score: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: Date;
  streakDays: number;
  totalEntries: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    privateMode: boolean;
  };
}

const moodScores: Record<Mood, number> = {
  excellent: 5,
  great: 4.5,
  good: 4,
  okay: 3,
  sad: 2,
  anxious: 2.5,
};

const moodColors: Record<Mood, string> = {
  excellent: 'bg-excellent',
  great: 'bg-great',
  good: 'bg-good',
  okay: 'bg-okay',
  sad: 'bg-sad',
  anxious: 'bg-anxious',
};

export { moodScores, moodColors };

export const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  avatar: 'AC',
  joinDate: new Date('2024-01-15'),
  streakDays: 12,
  totalEntries: 47,
  preferences: {
    theme: 'light',
    notifications: true,
    privateMode: true,
  },
};

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'entry-1',
    title: 'Productive morning at the cafe',
    content:
      'Had an amazing coffee at my favorite cafe today. Managed to finish the design proposal that was due Friday. The team gave me positive feedback! Feeling accomplished and energized.',
    mood: 'excellent',
    tags: ['work', 'productivity', 'cafe'],
    timestamp: new Date('2024-07-08'),
    isVoice: false,
    emotions: ['accomplished', 'energized', 'proud'],
    aiReflection:
      'Your positive mood reflects your sense of achievement. This accomplishment in your work is a great stepping stone. Remember to celebrate these wins and maintain this momentum.',
  },
  {
    id: 'entry-2',
    title: 'Reflection on personal growth',
    content:
      'Today I realized how much I\'ve grown over the past few months. The challenges I faced have made me more resilient. I\'m learning to let go of things I can\'t control.',
    mood: 'great',
    tags: ['personal', 'growth', 'reflection'],
    timestamp: new Date('2024-07-07'),
    isVoice: true,
    emotions: ['hopeful', 'grateful', 'confident'],
    aiReflection:
      'Your journey of self-discovery is wonderful. Embrace the lessons from your challenges. Growth is a continuous process, and you\'re on the right path.',
  },
  {
    id: 'entry-3',
    title: 'Managing stress before the presentation',
    content:
      'Tomorrow is the big presentation. I\'m feeling nervous but prepared. I\'ve rehearsed multiple times and gotten feedback from colleagues. Trying to remind myself that I\'ve done this before.',
    mood: 'okay',
    tags: ['work', 'stress', 'challenge'],
    timestamp: new Date('2024-07-06'),
    isVoice: false,
    emotions: ['nervous', 'prepared', 'hopeful'],
    aiReflection:
      'Pre-presentation nervousness is completely normal. Your preparation shows dedication. Try breathing exercises to calm your mind, and remember your past successes.',
  },
  {
    id: 'entry-4',
    title: 'Morning jog cleared my head',
    content:
      'Went for an early morning jog today. The fresh air and exercise really helped clear my mind. I feel more focused and ready to tackle the day.',
    mood: 'good',
    tags: ['health', 'exercise', 'wellness'],
    timestamp: new Date('2024-07-05'),
    isVoice: false,
    emotions: ['refreshed', 'focused', 'energized'],
    aiReflection:
      'Physical activity is a powerful tool for mental clarity. Keep up this healthy habit!',
  },
  {
    id: 'entry-5',
    title: 'Difficult conversation with a friend',
    content:
      'Had a tough conversation today that I\'ve been avoiding. It was uncomfortable but necessary. I think we both understand each other better now.',
    mood: 'okay',
    tags: ['relationships', 'communication'],
    timestamp: new Date('2024-07-04'),
    isVoice: false,
    emotions: ['vulnerable', 'relieved', 'hopeful'],
    aiReflection:
      'Honest communication, though difficult, builds stronger relationships. You showed courage by having this conversation.',
  },
];

export const mockMoodHistory: MoodEntry[] = [
  { date: new Date('2024-07-08'), mood: 'excellent', score: 5 },
  { date: new Date('2024-07-07'), mood: 'great', score: 4.5 },
  { date: new Date('2024-07-06'), mood: 'okay', score: 3 },
  { date: new Date('2024-07-05'), mood: 'good', score: 4 },
  { date: new Date('2024-07-04'), mood: 'okay', score: 3 },
  { date: new Date('2024-07-03'), mood: 'good', score: 4 },
  { date: new Date('2024-07-02'), mood: 'great', score: 4.5 },
  { date: new Date('2024-07-01'), mood: 'good', score: 4 },
  { date: new Date('2024-06-30'), mood: 'excellent', score: 5 },
  { date: new Date('2024-06-29'), mood: 'good', score: 4 },
  { date: new Date('2024-06-28'), mood: 'okay', score: 3 },
  { date: new Date('2024-06-27'), mood: 'great', score: 4.5 },
];

export const inspirationalQuotes = [
  "The only way out is through. - Robert Frost",
  "You are braver than you believe, stronger than you seem, and smarter than you think. - A.A. Milne",
  "Every moment is a fresh beginning. - T.S. Eliot",
  "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
  "In the middle of difficulty lies opportunity. - Albert Einstein",
  "You've survived 100% of your worst days. You're doing great.",
];

export const emotionTags = [
  'happy',
  'sad',
  'anxious',
  'calm',
  'energized',
  'exhausted',
  'motivated',
  'grateful',
  'hopeful',
  'overwhelmed',
  'peaceful',
  'confused',
  'proud',
  'frustrated',
  'loved',
  'lonely',
];
