import { api } from '../api-client';
import type { BackendPreferences, BackendProfile } from '../api-types';

export const usersApi = {
  getProfile: () => api.get<{ profile: BackendProfile }>('/users/me'),

  updateProfile: (input: { name?: string; avatarUrl?: string }) =>
    api.patch<{ profile: BackendProfile }>('/users/me', input),

  updatePreferences: (input: { theme?: string; notifications?: boolean; privateMode?: boolean; timezone?: string }) =>
    api.patch<{ preferences: BackendPreferences }>('/users/me/preferences', input),

  deleteAccount: (password: string) => api.delete<null>('/users/me', { password }),

  submitFeedback: (input: { subject: string; message: string; rating?: number }) =>
    api.post<null>('/users/feedback', input),
};
