'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Calendar, Award, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { reportsApi } from '@/lib/api/reports';
import { moodApi } from '@/lib/api/mood';
import { fromBackendMood } from '@/lib/mood-map';
import type { BackendMoodEntry, BackendWellnessSummary } from '@/lib/api-types';

const chartColors: Record<string, string> = {
  excellent: 'var(--color-excellent)',
  great: 'var(--color-great)',
  good: 'var(--color-good)',
  okay: 'var(--color-okay)',
  sad: 'var(--color-sad)',
  anxious: 'var(--color-anxious)',
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [summary, setSummary] = useState<BackendWellnessSummary | null>(null);
  const [history, setHistory] = useState<BackendMoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([reportsApi.summary(), moodApi.history(timeRange)])
      .then(([summaryResult, historyResult]) => {
        setSummary(summaryResult.data);
        setHistory(historyResult.data.history);
      })
      .catch(() => {
        setSummary(null);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [timeRange]);

  const chartData = [...history]
    .reverse()
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: entry.score,
      mood: fromBackendMood(entry.mood),
    }));

  const moodDistribution = (summary?.moodDistribution ?? []).map(({ mood, count }) => ({
    name: fromBackendMood(mood),
    value: count,
    color: chartColors[fromBackendMood(mood)] ?? '#94a3b8',
  }));

  if (loading) {
    return <div className="p-4 md:p-8 text-muted-foreground">Loading your reports...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold">Your Wellness Reports</h1>
          <p className="text-muted-foreground">Track your mood patterns and emotional trends</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 no-print"
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 no-print">
        {(['week', 'month', 'all'] as const).map((range) => (
          <Button
            key={range}
            onClick={() => setTimeRange(range)}
            variant={timeRange === range ? 'default' : 'outline'}
            className={timeRange === range ? 'bg-primary hover:bg-primary/90' : ''}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Average Mood</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold">{(summary?.averageMood ?? 0).toFixed(1)}/5</p>
          <p className="text-xs text-muted-foreground">Based on your entries</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Best Mood</span>
            <Award className="w-4 h-4 text-accent" />
          </div>
          <p className="text-3xl font-bold">{summary?.bestMood ?? 0}/5</p>
          <p className="text-xs text-muted-foreground">Your peak so far</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Entries</span>
            <Calendar className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-3xl font-bold">{summary?.totalEntries ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total journal entries</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Week Trend</span>
            <TrendingUp
              className={`w-4 h-4 ${(summary?.weekOverWeekChange ?? 0) > 0 ? 'text-success' : 'text-destructive'}`}
            />
          </div>
          <p
            className={`text-3xl font-bold ${
              (summary?.weekOverWeekChange ?? 0) > 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {(summary?.weekOverWeekChange ?? 0) > 0 ? '+' : ''}
            {(summary?.weekOverWeekChange ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">vs previous week</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Mood Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Mood Trend</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" domain={[0, 5]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-primary)"
                  dot={{ fill: 'var(--color-primary)', r: 4 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">
              Not enough mood data yet — log a few journal entries to see your trend.
            </p>
          )}
        </div>

        {/* Mood Distribution */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Mood Distribution</h2>
          {moodDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {moodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No mood data yet.</p>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Insights & Patterns</h2>
        <div className="space-y-3 text-sm">
          {summary && summary.weekOverWeekChange !== 0 ? (
            <p className="text-foreground">
              {summary.weekOverWeekChange > 0 ? '📈' : '📉'} Your mood has{' '}
              <strong>{summary.weekOverWeekChange > 0 ? 'improved' : 'dipped'}</strong> compared to last week.
            </p>
          ) : (
            <p className="text-foreground">
              📊 Keep journaling regularly to unlock more personalized insights here.
            </p>
          )}
          <p className="text-foreground">
            ✨ You&apos;ve logged <strong>{summary?.totalEntries ?? 0}</strong> entries so far — every one helps
            build a clearer picture of your patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
