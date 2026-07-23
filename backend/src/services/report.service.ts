import { moodEntryRepository } from '../repositories/moodEntry.repository';
import { journalEntryRepository } from '../repositories/journalEntry.repository';

export const reportService = {
  async getWellnessSummary(userId: string) {
    const moodHistory = await moodEntryRepository.findAllForUser(userId);

    if (moodHistory.length === 0) {
      return {
        averageMood: 0,
        bestMood: 0,
        totalEntries: 0,
        weekOverWeekChange: 0,
        moodDistribution: [],
        trend: [],
      };
    }

    const averageMood = moodHistory.reduce((sum, e) => sum + e.score, 0) / moodHistory.length;
    const bestMood = Math.max(...moodHistory.map((e) => e.score));

    const lastWeek = moodHistory.slice(0, 7);
    const priorWeek = moodHistory.slice(7, 14);
    const lastWeekAvg = lastWeek.length ? lastWeek.reduce((s, e) => s + e.score, 0) / lastWeek.length : 0;
    const priorWeekAvg = priorWeek.length ? priorWeek.reduce((s, e) => s + e.score, 0) / priorWeek.length : 0;
    const weekOverWeekChange = lastWeekAvg - priorWeekAvg;

    const moodCounts = moodHistory.reduce<Record<string, number>>((acc, e) => {
      acc[e.mood] = (acc[e.mood] ?? 0) + 1;
      return acc;
    }, {});

    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));

    const trend = moodHistory
      .slice()
      .reverse()
      .map((e) => ({ date: e.date, mood: e.mood, score: e.score }));

    const totalEntries = await journalEntryRepository.countForUser(userId);

    return {
      averageMood: Number(averageMood.toFixed(2)),
      bestMood,
      totalEntries,
      weekOverWeekChange: Number(weekOverWeekChange.toFixed(2)),
      moodDistribution,
      trend,
    };
  },
};
