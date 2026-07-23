import { prisma } from '../config/prisma';

export interface ManifestationUpsertFields {
  intention: string;
  affirmation: string;
  visualized: boolean;
}

export const manifestationEntryRepository = {
  upsertForDate(userId: string, date: Date, fields: ManifestationUpsertFields) {
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    return prisma.manifestationEntry.upsert({
      where: {
        user_manifestation_date_unique: { userId, date: dayStart },
      },
      update: {
        intention: fields.intention,
        affirmation: fields.affirmation,
        visualized: fields.visualized,
      },
      create: {
        userId,
        date: dayStart,
        intention: fields.intention,
        affirmation: fields.affirmation,
        visualized: fields.visualized,
      },
    });
  },

  findForDate(userId: string, date: Date) {
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    return prisma.manifestationEntry.findUnique({
      where: {
        user_manifestation_date_unique: { userId, date: dayStart },
      },
    });
  },

  findHistory(userId: string) {
    return prisma.manifestationEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  },
};
