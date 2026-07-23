import { prisma } from '../config/prisma';

export interface GratitudeUpsertFields {
  item1: string;
  item2: string;
  item3: string;
  notes?: string;
}

export const gratitudeEntryRepository = {
  upsertForDate(userId: string, date: Date, fields: GratitudeUpsertFields) {
    // Keep date component only (UTC midnight) to constrain to one entry per day
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    return prisma.gratitudeEntry.upsert({
      where: {
        user_gratitude_date_unique: { userId, date: dayStart },
      },
      update: {
        item1: fields.item1,
        item2: fields.item2,
        item3: fields.item3,
        notes: fields.notes,
      },
      create: {
        userId,
        date: dayStart,
        item1: fields.item1,
        item2: fields.item2,
        item3: fields.item3,
        notes: fields.notes,
      },
    });
  },

  findForDate(userId: string, date: Date) {
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    return prisma.gratitudeEntry.findUnique({
      where: {
        user_gratitude_date_unique: { userId, date: dayStart },
      },
    });
  },

  findHistory(userId: string) {
    return prisma.gratitudeEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  },

  async findRandomItem(userId: string): Promise<{ item: string; date: Date } | null> {
    const count = await prisma.gratitudeEntry.count({
      where: { userId },
    });

    if (count === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * count);
    const entry = await prisma.gratitudeEntry.findFirst({
      where: { userId },
      skip: randomIndex,
      take: 1,
    });

    if (!entry) {
      return null;
    }

    // Pick one of the three items randomly
    const items = [entry.item1, entry.item2, entry.item3].filter(Boolean);
    if (items.length === 0) return null;

    const randomItem = items[Math.floor(Math.random() * items.length)];
    return {
      item: randomItem,
      date: entry.date,
    };
  },
};
