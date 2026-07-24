import { api } from '../api-client';

export interface AdminUserEntry {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  type: 'journal' | 'gratitude' | 'manifestation';
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
}

export const adminApi = {
  getEntries: () => api.get<AdminUserEntry[]>('/admin/entries'),
};
