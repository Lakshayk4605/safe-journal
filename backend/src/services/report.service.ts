import { moodEntryRepository } from '../repositories/moodEntry.repository';
import { journalEntryRepository } from '../repositories/journalEntry.repository';
import { aiService } from './ai.service';

function rangeToDates(range: 'week' | 'month' | 'all'): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'all':
      startDate.setFullYear(2000);
      break;
  }
  return { startDate, endDate };
}

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

  async getWellnessReportBrief(userId: string, range: 'week' | 'month' | 'all') {
    const { startDate, endDate } = rangeToDates(range);

    const moodEntries = await moodEntryRepository.findHistory(userId, startDate, endDate);
    
    // Fetch journal entries in the time range
    const journalResult = await journalEntryRepository.findMany(
      { userId, startDate, endDate },
      { page: 1, limit: 1000 },
      { sortBy: 'createdAt', sortOrder: 'desc' }
    );

    const totalEntries = journalResult.items.length;

    if (moodEntries.length === 0 && totalEntries === 0) {
      return {
        brief: '',
        isEmpty: true,
      };
    }

    const moodText = moodEntries
      .map((e) => `- ${new Date(e.date).toLocaleDateString()}: Mood ${e.mood} (Score: ${e.score})`)
      .join('\n');
    const journalText = journalResult.items
      .map((e) => `### ${new Date(e.createdAt).toLocaleDateString()} - ${e.title}\nContent: ${e.content}`)
      .join('\n\n');

    const prompt = `Here is the user's wellness data for the selected period.

Mood History:
${moodText || 'None logged'}

Journal Entries:
${journalText || 'None logged'}

Generate a structured, compassionate, and highly professional Wellness Analysis Report Brief summarizing their mood patterns, key emotional themes, resilience shown, and 2-3 actionable wellness recommendations. Avoid clinical jargon.

Your response MUST follow this exact structure:
1. **Executive Summary**: A warm, empathetic, and professional summary of the user's emotional state, overall wellness, and key patterns observed over the period.
2. **Key Insights**: 3 clean bullet points detailing:
   - *Mood Stability & Trends*: How their mood has fluctuated and any triggers/positives identified.
   - *Emotional Themes*: Common themes, worries, or successes mentioned in their writing.
   - *Resilience & Progress*: Areas where they showed strength or emotional growth.
3. **Actionable Recommendations**: 2-3 practical, gentle mindfulness exercises or steps they can take next.`;

    const aiResponse = await aiService.generateSimpleSummary(
      [{ role: 'user', content: prompt }],
      "You are a compassionate wellness analyst. Analyze the user's data and write a professional report summary."
    );

    // If AI is in mock mode and returned the default short mock response, let's expand it into a high-quality mock wellness report brief.
    let brief = aiResponse;
    if (aiResponse === "Discussed daily reflections and wellness thoughts.") {
      brief = `### Executive Summary
Over the selected period, your emotional trend shows a steady progression towards stability and positive alignment. Your journals reflect active self-awareness and minor stress points related to daily tasks, but overall resilient coping strategies.

### Key Insights
- **Mood Trends**: You have maintained a stable mood average, with peak days occurring when gratitude or reflective journals were logged.
- **Emotional Themes**: Key recurring themes include productivity, self-reflection, and healthy work-life balance.
- **Progress**: You showed high resilience on days with lower mood, actively utilizing AI reflection prompts to process your emotions.

### Actionable Recommendations
1. **Mindfulness Breathing**: Dedicate 5 minutes in the morning to deep breathing exercises on days with heavy workloads.
2. **Gratitude Tracking**: Continue logging at least one positive event daily in your gratitude journal to maintain emotional resilience.`;
    }

    return {
      brief,
      isEmpty: false,
    };
  },
};

