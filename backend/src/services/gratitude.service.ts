import { gratitudeEntryRepository } from '../repositories/gratitudeEntry.repository';

export const gratitudeService = {
  async logGratitude(userId: string, input: { item1: string; item2?: string; item3?: string; notes?: string; date?: Date }) {
    return gratitudeEntryRepository.upsertForDate(userId, input.date ?? new Date(), {
      item1: input.item1,
      item2: input.item2 || '',
      item3: input.item3 || '',
      notes: input.notes,
    });
  },

  async getTodayEntry(userId: string) {
    return gratitudeEntryRepository.findForDate(userId, new Date());
  },

  async getHistory(userId: string) {
    return gratitudeEntryRepository.findHistory(userId);
  },

  async getRandomItem(userId: string) {
    return gratitudeEntryRepository.findRandomItem(userId);
  },
};
