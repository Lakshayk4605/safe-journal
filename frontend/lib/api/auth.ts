import { api } from '../api-client';
import type { BackendUser } from '../api-types';

export const authApi = {
  signup: (input: { name: string; email: string; password: string }) =>
    api.post<{ user: BackendUser }>('/auth/signup', input),

  login: (input: { email?: string; identifier?: string; password: string }) =>
    api.post<{ user: BackendUser }>('/auth/login', input),

  sendPhoneOtp: (phoneNumber: string) =>
    api.post<{ message: string; phoneNumber: string; otp: string }>('/auth/send-otp', { phoneNumber }),

  verifyPhoneOtp: (input: { phoneNumber: string; otp: string }) =>
    api.post<{ user: BackendUser }>('/auth/verify-otp', input),

  logout: () => api.post<null>('/auth/logout'),

  me: () => api.get<{ user: Pick<BackendUser, 'id' | 'email' | 'role'> }>('/auth/me'),

  forgotPassword: (email: string) => api.post<null>('/auth/forgot-password', { email }),

  resetPassword: (input: { token: string; password: string }) =>
    api.post<null>('/auth/reset-password', input),

  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    api.post<null>('/auth/change-password', input),
};
