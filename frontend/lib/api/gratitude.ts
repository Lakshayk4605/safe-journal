import { api } from '../api-client';
import type { BackendGratitudeEntry } from '../api-types';

export const gratitudeApi = {
  log: (input: { item1: string; item2: string; item3: string; date?: string }) =>
    api.post<{ entry: BackendGratitudeEntry }>('/gratitude', input),

  getToday: () =>
    api.get<{ entry: BackendGratitudeEntry | null }>('/gratitude/today'),

  getHistory: () =>
    api.get<{ history: BackendGratitudeEntry[] }>('/gratitude/history'),

  getRandom: () =>
    api.get<{ item: string; date: string } | null>('/gratitude/random'),
};
