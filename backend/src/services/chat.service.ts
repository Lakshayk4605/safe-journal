import { ChatRole } from '@prisma/client';
import { chatRepository } from '../repositories/chat.repository';
import { ApiError } from '../utils/apiError';
import { aiService } from './ai.service';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';

export const chatService = {
  createSession(userId: string, title?: string) {
    return chatRepository.createSession(userId, title);
  },

  async listSessions(userId: string, query: { page?: number; limit?: number }) {
    const pagination = parsePagination(query);
    const [items, totalItems] = await chatRepository.listSessions(userId, pagination.page, pagination.limit);
    return buildPaginatedResult(items, totalItems, pagination);
  },

  async getSession(userId: string, sessionId: string) {
    const session = await chatRepository.findSession(sessionId, userId);
    if (!session) throw ApiError.notFound('Chat session not found');
    return session;
  },

  async sendMessage(userId: string, sessionId: string, message: string) {
    const session = await chatRepository.findSession(sessionId, userId);
    if (!session) throw ApiError.notFound('Chat session not found');

    await chatRepository.addMessage(sessionId, { role: ChatRole.USER, content: message });

    const history = session.messages.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const aiReply = await aiService.generateChatReply({ history, message });

    const assistantMessage = await chatRepository.addMessage(sessionId, {
      role: ChatRole.ASSISTANT,
      content: aiReply.content,
      model: aiReply.model,
      promptTokens: aiReply.promptTokens,
      completionTokens: aiReply.completionTokens,
    });

    // Background title, summary, tags, and mood timeline generation
    (async () => {
      try {
        const fullHistory = [
          ...history,
          { role: 'user', content: message },
          { role: 'assistant', content: aiReply.content }
        ];

        const summaryPrompt = `Based on this conversation history, generate a very brief, single-sentence summary of the topics discussed. Example: "Discussed work stress and sleep issues." Keep it under 10 words.`;
        const summary = await aiService.generateSimpleSummary(fullHistory, summaryPrompt);

        const tagsPrompt = `Generate 2-3 topic tags (lowercase single words) that describe this conversation. Return them ONLY as a comma-separated list without explanation. Example: "stress, sleep, job"`;
        const tagsRaw = await aiService.generateSimpleSummary(fullHistory, tagsPrompt);
        const tags = tagsRaw
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

        const moodPrompt = `Given the user's messages in this conversation, classify their active mood as one of these: EXCELLENT, GREAT, GOOD, OKAY, SAD, ANXIOUS. Return ONLY the uppercase word.`;
        const moodRaw = await aiService.generateSimpleSummary(fullHistory, moodPrompt);
        const mood = moodRaw.trim().toUpperCase();

        const updatedTimeline = [...((session as any).moodTimeline || [])];
        if (['EXCELLENT', 'GREAT', 'GOOD', 'OKAY', 'SAD', 'ANXIOUS'].includes(mood)) {
          updatedTimeline.push(mood.toLowerCase());
        }

        const updateData: any = {
          summary,
          tags,
          moodTimeline: updatedTimeline,
        };

        if (session.title === 'New conversation' && session.messages.length === 0) {
          updateData.title = message.slice(0, 50);
        }

        await chatRepository.touchSession(sessionId, updateData);
      } catch (err) {
        // Silently swallow background summary generation errors
      }
    })();

    return assistantMessage;
  },

  async updateSession(
    userId: string,
    sessionId: string,
    data: { title?: string; isPinned?: boolean; isFavorite?: boolean; tags?: string[]; moodTimeline?: string[]; summary?: string }
  ) {
    const session = await chatRepository.findSession(sessionId, userId);
    if (!session) throw ApiError.notFound('Chat session not found');
    return chatRepository.touchSession(sessionId, data);
  },

  async deleteSession(userId: string, sessionId: string) {
    const result = await chatRepository.deleteSession(sessionId, userId);
    if (result.count === 0) throw ApiError.notFound('Chat session not found');
  },

  async archiveSession(userId: string, sessionId: string) {
    const result = await chatRepository.archiveSession(sessionId, userId);
    if (result.count === 0) throw ApiError.notFound('Chat session not found');
  },
};
