import { Mood } from '@prisma/client';
import { moodEntryRepository } from '../repositories/moodEntry.repository';
import { MOOD_SCORES } from '../constants';

function rangeToDates(range: 'week' | 'month' | 'quarter' | 'year' | 'all'): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2000);
      break;
  }
  return { startDate, endDate };
}

export const moodService = {
  async logMood(userId: string, input: { mood: Mood; notes?: string; date?: Date }) {
    return moodEntryRepository.upsertForDate(userId, input.date ?? new Date(), {
      mood: input.mood,
      score: MOOD_SCORES[input.mood],
      notes: input.notes,
    });
  },

  async getHistory(userId: string, params: { range: 'week' | 'month' | 'quarter' | 'year' | 'all'; startDate?: Date; endDate?: Date }) {
    const { startDate, endDate } =
      params.startDate && params.endDate ? { startDate: params.startDate, endDate: params.endDate } : rangeToDates(params.range);

    return moodEntryRepository.findHistory(userId, startDate, endDate);
  },
};
