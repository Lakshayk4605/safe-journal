import { api, ApiResult } from '../api-client';
import type { BackendJournalEntry, BackendUser } from '../api-types';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalEntries: number;
  totalMoodEntries: number;
  totalChatSessions: number;
  unresolvedFeedback: number;
  newUsersLast7Days: number;
  newEntriesLast7Days: number;
}

export interface AdminUserEntry extends BackendJournalEntry {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface AdminEntriesParams {
  page?: number;
  limit?: number;
  search?: string;
  mood?: string;
}

export const adminApi = {
  getDashboardStats: () => api.get<AdminStats>('/admin/dashboard'),

  listAllEntries: (params?: AdminEntriesParams): Promise<ApiResult<AdminUserEntry[]>> =>
    api.get<AdminUserEntry[]>('/admin/entries', params as Record<string, string | number | boolean | undefined>),

  listUsers: (params?: { page?: number; limit?: number; search?: string }): Promise<ApiResult<BackendUser[]>> =>
    api.get<BackendUser[]>('/admin/users', params as Record<string, string | number | boolean | undefined>),

  setUserStatus: (userId: string, isActive: boolean) =>
    api.patch<{ user: BackendUser }>(`/admin/users/${userId}/status`, { isActive }),
};
