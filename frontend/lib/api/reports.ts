import { api } from '../api-client';
import type { BackendWellnessSummary } from '../api-types';

export const reportsApi = {
  summary: () => api.get<BackendWellnessSummary>('/reports/summary'),
};
