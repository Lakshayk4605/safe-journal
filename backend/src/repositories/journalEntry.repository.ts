import { Prisma, Mood } from '@prisma/client';
import { prisma } from '../config/prisma';
import { encrypt, decrypt } from '../utils/crypto';

export interface JournalEntryFilters {
  userId: string;
  search?: string;
  mood?: Mood;
  tag?: string;
  favoriteOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
}

const entryInclude = {
  tags: { include: { tag: true } },
  emotions: { include: { emotion: true } },
  aiReflection: true,
  attachments: true,
} satisfies Prisma.JournalEntryInclude;

function decryptEntry(entry: any) {
  if (!entry) return entry;
  return {
    ...entry,
    title: decrypt(entry.title),
    content: decrypt(entry.content),
    aiReflection: entry.aiReflection ? {
      ...entry.aiReflection,
      content: decrypt(entry.aiReflection.content),
    } : null,
  };
}

export const journalEntryRepository = {
  async findMany(
    filters: JournalEntryFilters,
    pagination: { page: number; limit: number },
    sort: { sortBy: 'createdAt' | 'updatedAt' | 'title'; sortOrder: 'asc' | 'desc' },
  ) {
    const where: Prisma.JournalEntryWhereInput = {
      userId: filters.userId,
      deletedAt: null,
    };

    if (filters.mood) {
      where.mood = filters.mood;
    }

    const rawItems = await prisma.journalEntry.findMany({
      where,
      include: entryInclude,
    });

    // Decrypt all database rows
    let items = rawItems.map(decryptEntry);

    // Apply filters in-memory
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.content.toLowerCase().includes(searchLower)
      );
    }

    if (filters.tag) {
      const tagName = filters.tag.toLowerCase();
      items = items.filter((item) =>
        item.tags.some((t: any) => t.tag.name.toLowerCase() === tagName)
      );
    }

    if (filters.favoriteOnly) {
      items = items.filter((item) => item.isFavorite);
    }

    if (filters.startDate || filters.endDate) {
      items = items.filter((item) => {
        const itemTime = new Date(item.createdAt).getTime();
        if (filters.startDate && itemTime < new Date(filters.startDate).getTime()) return false;
        if (filters.endDate && itemTime > new Date(filters.endDate).getTime()) return false;
        return true;
      });
    }

    // Sort items in-memory
    items.sort((a, b) => {
      let valA = a[sort.sortBy];
      let valB = b[sort.sortBy];

      if (sort.sortBy === 'title') {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      } else {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sort.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sort.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalItems = items.length;

    // Apply pagination bounds
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedItems = items.slice(startIndex, startIndex + pagination.limit);

    return { items: paginatedItems, totalItems };
  },

  findById(id: string, userId: string) {
    return prisma.journalEntry.findFirst({
      where: { id, userId, deletedAt: null },
      include: entryInclude,
    }).then(decryptEntry);
  },

  findByIdAnyOwner(id: string) {
    return prisma.journalEntry.findFirst({ where: { id, deletedAt: null }, include: entryInclude }).then(decryptEntry);
  },

  create(data: Prisma.JournalEntryCreateInput) {
    const encryptedData = {
      ...data,
      title: typeof data.title === 'string' ? encrypt(data.title) : data.title,
      content: typeof data.content === 'string' ? encrypt(data.content) : data.content,
    };
    return prisma.journalEntry.create({ data: encryptedData, include: entryInclude }).then(decryptEntry);
  },

  update(id: string, data: Prisma.JournalEntryUpdateInput) {
    const encryptedData = {
      ...data,
      title: typeof data.title === 'string' ? encrypt(data.title) : data.title,
      content: typeof data.content === 'string' ? encrypt(data.content) : data.content,
    };
    return prisma.journalEntry.update({ where: { id }, data: encryptedData, include: entryInclude }).then(decryptEntry);
  },

  softDelete(id: string) {
    return prisma.journalEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  countForUser(userId: string) {
    return prisma.journalEntry.count({ where: { userId, deletedAt: null } });
  },

  async upsertTags(names: string[]) {
    const tags = await Promise.all(
      names.map((name) =>
        prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
      ),
    );
    return tags;
  },

  async upsertEmotions(names: string[]) {
    const emotions = await Promise.all(
      names.map((name) =>
        prisma.emotion.upsert({ where: { name }, update: {}, create: { name } }),
      ),
    );
    return emotions;
  },
};
