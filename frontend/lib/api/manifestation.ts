import { api } from '../api-client';
import type { BackendManifestationEntry } from '../api-types';

export const manifestationApi = {
  log: (input: { intention: string; affirmation: string; visualized: boolean; date?: string }) =>
    api.post<{ entry: BackendManifestationEntry }>('/manifestation', input),

  getToday: () =>
    api.get<{ entry: BackendManifestationEntry | null }>('/manifestation/today'),

  getHistory: () =>
    api.get<{ history: BackendManifestationEntry[] }>('/manifestation/history'),
};
