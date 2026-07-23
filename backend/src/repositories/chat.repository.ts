import { ChatRole, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const chatRepository = {
  createSession(userId: string, title?: string) {
    return prisma.chatSession.create({
      data: { userId, title: title ?? 'New conversation' },
    });
  },

  findSession(id: string, userId: string) {
    return prisma.chatSession.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  },

  listSessions(userId: string, page: number, limit: number) {
    return Promise.all([
      prisma.chatSession.findMany({
        where: { userId, archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatSession.count({ where: { userId, archivedAt: null } }),
    ]);
  },

  addMessage(sessionId: string, data: { role: ChatRole; content: string; model?: string; promptTokens?: number; completionTokens?: number }) {
    return prisma.chatMessage.create({
      data: { chatSessionId: sessionId, ...data },
    });
  },

  touchSession(sessionId: string, data: Prisma.ChatSessionUpdateInput = {}) {
    return prisma.chatSession.update({ where: { id: sessionId }, data: { ...data, updatedAt: new Date() } });
  },

  archiveSession(id: string, userId: string) {
    return prisma.chatSession.updateMany({
      where: { id, userId },
      data: { archivedAt: new Date() },
    });
  },
  deleteSession(id: string, userId: string) {
    return prisma.chatSession.deleteMany({
      where: { id, userId },
    });
  },
};
