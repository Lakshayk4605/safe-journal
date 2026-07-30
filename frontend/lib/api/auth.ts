import { api } from '../api-client';
import type { BackendUser } from '../api-types';

export const authApi = {
  signup: (input: { name: string; email: string; password: string }) =>
    api.post<{ user: BackendUser }>('/auth/signup', input),

  login: (input: { email: string; password: string }) =>
    api.post<{ user: BackendUser }>('/auth/login', input),

  logout: () => api.post<null>('/auth/logout'),

  me: () => api.get<{ user: Pick<BackendUser, 'id' | 'email' | 'role'> }>('/auth/me'),

  forgotPassword: (email: string) => api.post<null>('/auth/forgot-password', { email }),

  resetPassword: (input: { token: string; password: string }) =>
    api.post<null>('/auth/reset-password', input),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    api.post<null>('/auth/change-password', input),
};
