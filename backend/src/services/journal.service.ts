import { AuditAction, Mood, Prisma } from '@prisma/client';
import { journalEntryRepository, JournalEntryFilters } from '../repositories/journalEntry.repository';
import { encrypt } from '../utils/crypto';
import { userRepository } from '../repositories/user.repository';
import { moodEntryRepository } from '../repositories/moodEntry.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { ApiError } from '../utils/apiError';
import { aiService } from './ai.service';
import { prisma } from '../config/prisma';
import { MOOD_SCORES } from '../constants';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';

interface CreateEntryInput {
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  emotions: string[];
  entryType: 'TEXT' | 'VOICE';
  audioUrl?: string;
  audioDurationSeconds?: number;
  requestAiReflection: boolean;
  createdAt?: Date;
}

async function recalculateStreak(userId: string): Promise<number> {
  const user = await userRepository.findById(userId);
  if (!user) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.lastEntryDate) return 1;

  const last = new Date(user.lastEntryDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return user.streakDays; // already logged today
  if (diffDays === 1) return user.streakDays + 1; // consecutive day
  return 1; // streak broken, restart
}

export const journalService = {
  async createEntry(userId: string, input: CreateEntryInput) {
    const [tags, emotions] = await Promise.all([
      journalEntryRepository.upsertTags(input.tags),
      journalEntryRepository.upsertEmotions(input.emotions),
    ]);

    const entryDate = input.createdAt ? new Date(input.createdAt) : new Date();

    const entry = await journalEntryRepository.create({
      user: { connect: { id: userId } },
      title: input.title,
      content: input.content,
      mood: input.mood,
      entryType: input.entryType,
      audioUrl: input.audioUrl,
      audioDurationSeconds: input.audioDurationSeconds,
      tags: { create: tags.map((t) => ({ tag: { connect: { id: t.id } } })) },
      emotions: { create: emotions.map((e) => ({ emotion: { connect: { id: e.id } } })) },
      createdAt: entryDate,
    });

    const newStreak = await recalculateStreak(userId);
    await userRepository.incrementEntryStats(userId, entryDate);
    await userRepository.update(userId, { streakDays: newStreak });

    await moodEntryRepository.upsertForDate(userId, entryDate, {
      mood: input.mood,
      score: MOOD_SCORES[input.mood],
      journalEntryId: entry.id,
    });

    await auditLogRepository.log({ userId, action: AuditAction.JOURNAL_ENTRY_CREATED, metadata: { entryId: entry.id } });

    let finalEntry = entry;
    if (input.requestAiReflection) {
      const reflection = await aiService.generateReflection({
        entryContent: input.content,
        mood: input.mood,
        emotions: input.emotions,
      });

      await prisma.aiReflection.create({
        data: {
          journalEntryId: entry.id,
          content: encrypt(reflection.content),
          model: reflection.model,
          promptTokens: reflection.promptTokens,
          completionTokens: reflection.completionTokens,
        },
      });

      finalEntry = (await journalEntryRepository.findById(entry.id, userId))!;
    }

    return finalEntry;
  },

  async listEntries(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      mood?: Mood;
      tag?: string;
      sortBy?: 'createdAt' | 'updatedAt' | 'title';
      sortOrder?: 'asc' | 'desc';
      favoriteOnly?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const pagination = parsePagination(query);
    const filters: JournalEntryFilters = {
      userId,
      search: query.search,
      mood: query.mood,
      tag: query.tag,
      favoriteOnly: query.favoriteOnly,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    const { items, totalItems } = await journalEntryRepository.findMany(filters, pagination, {
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return buildPaginatedResult(items, totalItems, pagination);
  },

  async getEntry(userId: string, id: string) {
    const entry = await journalEntryRepository.findById(id, userId);
    if (!entry) throw ApiError.notFound('Journal entry not found');
    return entry;
  },

  async updateEntry(
    userId: string,
    id: string,
    input: Partial<{
      title: string;
      content: string;
      mood: Mood;
      tags: string[];
      emotions: string[];
      isFavorite: boolean;
    }>,
  ) {
    const existing = await journalEntryRepository.findById(id, userId);
    if (!existing) throw ApiError.notFound('Journal entry not found');

    const updateData: Prisma.JournalEntryUpdateInput = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.mood !== undefined) updateData.mood = input.mood;
    if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;

    if (input.tags) {
      const tags = await journalEntryRepository.upsertTags(input.tags);
      updateData.tags = {
        deleteMany: {},
        create: tags.map((t) => ({ tag: { connect: { id: t.id } } })),
      };
    }
    if (input.emotions) {
      const emotions = await journalEntryRepository.upsertEmotions(input.emotions);
      updateData.emotions = {
        deleteMany: {},
        create: emotions.map((e) => ({ emotion: { connect: { id: e.id } } })),
      };
    }

    const updated = await journalEntryRepository.update(id, updateData);

    if (input.mood && input.mood !== existing.mood) {
      await moodEntryRepository.upsertForDate(userId, existing.createdAt, {
        mood: input.mood,
        score: MOOD_SCORES[input.mood],
      });
    }

    await auditLogRepository.log({ userId, action: AuditAction.JOURNAL_ENTRY_UPDATED, metadata: { entryId: id } });
    return updated;
  },

  async deleteEntry(userId: string, id: string) {
    const existing = await journalEntryRepository.findById(id, userId);
    if (!existing) throw ApiError.notFound('Journal entry not found');

    await journalEntryRepository.softDelete(id);
    await auditLogRepository.log({ userId, action: AuditAction.JOURNAL_ENTRY_DELETED, metadata: { entryId: id } });
  },

  async generateReflectionForEntry(userId: string, id: string) {
    const entry = await journalEntryRepository.findById(id, userId);
    if (!entry) throw ApiError.notFound('Journal entry not found');
    if (entry.aiReflection) throw ApiError.conflict('This entry already has an AI reflection');

    const reflection = await aiService.generateReflection({
      entryContent: entry.content,
      mood: entry.mood,
      emotions: entry.emotions.map((e: any) => e.emotion.name),
    });

    await prisma.aiReflection.create({
      data: {
        journalEntryId: entry.id,
        content: encrypt(reflection.content),
        model: reflection.model,
        promptTokens: reflection.promptTokens,
        completionTokens: reflection.completionTokens,
      },
    });

    return journalEntryRepository.findById(id, userId);
  },
};
