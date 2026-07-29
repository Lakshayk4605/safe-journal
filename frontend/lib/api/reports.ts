import { api } from '../api-client';
import type { BackendWellnessSummary } from '../api-types';

export interface BackendReportBrief {
  brief: string;
  isEmpty: boolean;
}

export const reportsApi = {
  summary: () => api.get<BackendWellnessSummary>('/reports/summary'),
  brief: (range: 'week' | 'month' | 'all') => api.get<BackendReportBrief>(`/reports/brief?range=${range}`),
};
