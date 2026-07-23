import { api } from '../api-client';
import type { BackendMoodEntry } from '../api-types';

export const moodApi = {
  log: (input: { mood: string; notes?: string; date?: string }) =>
    api.post<{ entry: BackendMoodEntry }>('/mood', input),

  history: (range: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month') =>
    api.get<{ history: BackendMoodEntry[] }>('/mood/history', { range }),
};
