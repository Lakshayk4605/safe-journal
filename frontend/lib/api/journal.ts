import { api, ApiResult } from '../api-client';
import type { BackendJournalEntry } from '../api-types';

export interface JournalListParams {
  page?: number;
  limit?: number;
  search?: string;
  mood?: string; // backend enum casing, e.g. 'EXCELLENT'
  tag?: string;
  favoriteOnly?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEntryInput {
  title: string;
  content: string;
  mood: string; // backend enum casing
  tags?: string[];
  emotions?: string[];
  entryType?: 'TEXT' | 'VOICE';
  audioUrl?: string;
  audioDurationSeconds?: number;
  requestAiReflection?: boolean;
  createdAt?: string;
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  emotions?: string[];
  isFavorite?: boolean;
}

export const journalApi = {
  list: (params: JournalListParams): Promise<ApiResult<BackendJournalEntry[]>> =>
    api.get<BackendJournalEntry[]>('/journal', params as Record<string, string | number | boolean | undefined>),

  get: (id: string) => api.get<{ entry: BackendJournalEntry }>(`/journal/${id}`),

  create: (input: CreateEntryInput) => api.post<{ entry: BackendJournalEntry }>('/journal', input),

  update: (id: string, input: UpdateEntryInput) =>
    api.patch<{ entry: BackendJournalEntry }>(`/journal/${id}`, input),

  remove: (id: string) => api.delete<null>(`/journal/${id}`),

  generateReflection: (id: string) => api.post<{ entry: BackendJournalEntry }>(`/journal/${id}/reflection`),

  uploadVoice: async (audioBlob: Blob): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const result = await api.post<{ url: string; publicId: string }>('/journal/voice/upload', formData);
    return result.data;
  },
};
