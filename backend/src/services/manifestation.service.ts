import { manifestationEntryRepository } from '../repositories/manifestationEntry.repository';

export const manifestationService = {
  async logManifestation(userId: string, input: { intention: string; affirmation: string; visualized: boolean; date?: Date }) {
    return manifestationEntryRepository.upsertForDate(userId, input.date ?? new Date(), {
      intention: input.intention,
      affirmation: input.affirmation,
      visualized: input.visualized,
    });
  },

  async getTodayEntry(userId: string) {
    return manifestationEntryRepository.findForDate(userId, new Date());
  },

  async getHistory(userId: string) {
    return manifestationEntryRepository.findHistory(userId);
  },
};
