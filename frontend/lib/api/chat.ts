import { api } from '../api-client';
import type { BackendChatMessage, BackendChatSession, BackendChatSessionWithMessages } from '../api-types';

export const chatApi = {
  createSession: (title?: string) =>
    api.post<{ session: BackendChatSession }>('/ai-chat/sessions', { title }),

  listSessions: (page = 1, limit = 20) =>
    api.get<BackendChatSession[]>('/ai-chat/sessions', { page, limit }),

  getSession: (sessionId: string) =>
    api.get<{ session: BackendChatSessionWithMessages }>(`/ai-chat/sessions/${sessionId}`),

  sendMessage: (sessionId: string, message: string) =>
    api.post<{ message: BackendChatMessage }>(`/ai-chat/sessions/${sessionId}/messages`, { message }),

  updateSession: (sessionId: string, data: { title?: string; isPinned?: boolean; isFavorite?: boolean; tags?: string[]; moodTimeline?: string[]; summary?: string }) =>
    api.patch<{ session: BackendChatSession }>(`/ai-chat/sessions/${sessionId}`, data),

  deleteSession: (sessionId: string) =>
    api.delete<null>(`/ai-chat/sessions/${sessionId}`),

  archiveSession: (sessionId: string) =>
    api.post<null>(`/ai-chat/sessions/${sessionId}/archive`),
};
