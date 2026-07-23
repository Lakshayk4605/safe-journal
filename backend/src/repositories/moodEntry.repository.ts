import { Mood } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface MoodUpsertFields {
  mood: Mood;
  score: number;
  notes?: string;
  journalEntryId?: string;
}

export const moodEntryRepository = {
  upsertForDate(userId: string, date: Date, fields: MoodUpsertFields) {
    // one mood entry per user per calendar day
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    // Built as plain scalar fields (including raw foreign keys) rather than nested
    // relation `connect` objects. Prisma's generated `create`/`update` input types are
    // structurally different from one another (Create vs Update variants of nested
    // relation inputs are not mutually assignable), so a single object spread into both
    // `create` and `update` doesn't type-check reliably. Plain scalars satisfy both the
    // "Unchecked" create input and the update input the same way, which sidesteps that
    // mismatch entirely.
    return prisma.moodEntry.upsert({
      where: { user_date_unique: { userId, date: dayStart } },
      update: {
        mood: fields.mood,
        score: fields.score,
        notes: fields.notes,
        ...(fields.journalEntryId ? { journalEntryId: fields.journalEntryId } : {}),
      },
      create: {
        userId,
        date: dayStart,
        mood: fields.mood,
        score: fields.score,
        notes: fields.notes,
        journalEntryId: fields.journalEntryId,
      },
    });
  },

  findHistory(userId: string, startDate: Date, endDate: Date) {
    return prisma.moodEntry.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' },
    });
  },

  findAllForUser(userId: string) {
    return prisma.moodEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  },
};
