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
import { TrendingUp, Calendar, Award, FileText, Zap, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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

function renderBriefContent(text: string, isPrint = false) {
  let cleanText = text.replace(/^#+\s*Wellness Analysis Report Brief\s*\n?/i, '');

  return cleanText.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className={isPrint ? "h-1" : "h-1.5"} />;
    }
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={idx} className={isPrint ? "text-xs font-extrabold text-gray-950 mt-2 mb-1 uppercase tracking-wide border-b border-gray-200 pb-0.5" : "text-base font-bold text-foreground mt-4 mb-1.5 flex items-center gap-1.5"}>
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className={isPrint ? "text-xs font-black text-gray-950 mt-2.5 mb-1 uppercase tracking-wide border-b border-gray-200 pb-0.5" : "text-lg font-bold text-foreground mt-4 mb-2"}>
          {trimmed.slice(3)}
        </h3>
      );
    }

    // Match bullets like: "* **Title**", "- **Title**", "*   **Title**"
    const bulletMatch = trimmed.match(/^[\*\-]\s+(\*\*.+?\*\*[\s\S]*)$/);
    if (bulletMatch) {
      const rest = bulletMatch[1];
      const parts = rest.split('**');
      if (parts.length >= 3) {
        const title = parts[1];
        const content = parts.slice(2).join('**');
        return (
          <div key={idx} className={isPrint ? "flex items-start gap-1.5 text-[11px] leading-tight text-gray-900 pl-2 mt-1" : "flex items-start gap-2 text-sm leading-relaxed text-foreground/90 pl-4 mt-1"}>
            <span className={isPrint ? "text-gray-900 font-bold text-[8px] mt-0.5" : "text-accent mt-1.5 font-bold text-[10px]"}>&bull;</span>
            <span>
              <strong className={isPrint ? "text-gray-950 font-extrabold" : "text-foreground font-semibold"}>{title}</strong>{content}
            </span>
          </div>
        );
      }
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.replace(/^[\*\-]\s+/, '');
      return (
        <div key={idx} className={isPrint ? "flex items-start gap-1.5 text-[11px] leading-tight text-gray-900 pl-2 mt-1" : "flex items-start gap-2 text-sm leading-relaxed text-foreground/90 pl-4 mt-1"}>
          <span className={isPrint ? "text-gray-900 font-bold text-[8px] mt-0.5" : "text-accent mt-1.5 font-bold text-[10px]"}>&bull;</span>
          <span>{content}</span>
        </div>
      );
    }

    // Match bold lines like: "**1. Executive Summary**"
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      return (
        <p key={idx} className={isPrint ? "text-xs font-extrabold text-gray-950 mt-2 mb-0.5 uppercase tracking-wide border-b border-gray-200 pb-0.5" : "text-sm font-bold text-foreground mt-3 mb-1"}>
          {trimmed.slice(2, -2)}
        </p>
      );
    }

    return (
      <p key={idx} className={isPrint ? "text-[11px] text-gray-900 leading-snug whitespace-pre-wrap" : "text-sm text-foreground/95 leading-relaxed whitespace-pre-wrap"}>
        {line}
      </p>
    );
  });
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [summary, setSummary] = useState<BackendWellnessSummary | null>(null);
  const [history, setHistory] = useState<BackendMoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<string>('');
  const [loadingBrief, setLoadingBrief] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadingBrief(true);
    
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

    reportsApi.brief(timeRange)
      .then((res) => {
        setBrief(res.data.brief);
      })
      .catch(() => {
        setBrief('');
      })
      .finally(() => setLoadingBrief(false));
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

  // Handle Empty State: if no entries exist
  if (!summary || summary.totalEntries === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto text-center py-20">
        {/* Screen View */}
        <div className="space-y-4 no-print">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto animate-pulse" />
          <h1 className="text-3xl font-bold">No Wellness Data Available</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't logged any journal entries or mood inputs yet. Create some entries to generate your personalized wellness report.
          </p>
          <div className="flex justify-center gap-4 pt-6">
            <Link href="/journal/new">
              <Button className="bg-primary hover:bg-primary/90 cursor-pointer">
                Create First Entry
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.print()} className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95">
              <FileText className="w-4 h-4" />
              Export Empty Report PDF
            </Button>
          </div>
        </div>

        {/* Print View of Empty State */}
        <div className="hidden print:block pt-12 text-left border-t border-gray-300 text-black">
          <div className="border-b-2 border-gray-300 pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Safe Journal</h1>
              <p className="text-sm text-gray-500 font-medium">Personal Wellness Analysis Report</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p className="capitalize">Range: {timeRange}</p>
            </div>
          </div>
          <p className="mt-8 text-lg font-medium text-gray-800">
            No entries or moods were recorded during the selected period. Hence, no analytical metrics or AI wellness summaries could be generated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* On Screen Interfacing View */}
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 no-print">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">Your Wellness Reports</h1>
            <p className="text-muted-foreground">Track your mood patterns and emotional trends</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* AI Wellness Report Brief */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              AI Wellness Analysis Brief
            </h2>
            {loadingBrief && (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            {loadingBrief ? (
              <div className="space-y-3 py-4">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            ) : brief ? (
              renderBriefContent(brief)
            ) : (
              <p className="text-muted-foreground">
                📊 Keep journaling regularly to unlock more personalized wellness insights here.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Print-only View Layout */}
      <div className="hidden print:block p-6 space-y-6 max-w-4xl mx-auto text-black reports-print-container">
        {/* Print Header */}
        <div className="border-b-2 border-gray-300 pb-3 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-950">Safe Journal</h1>
            <p className="text-xs text-gray-600 font-medium">Personal Wellness Analysis Report</p>
          </div>
          <div className="text-right text-[11px] text-gray-600 font-mono">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p className="capitalize">Period: {timeRange}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-3 border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="text-center">
            <p className="text-[9px] text-gray-500 uppercase font-extrabold tracking-wider">Average Mood</p>
            <p className="text-xl font-bold text-gray-950 mt-0.5">{(summary?.averageMood ?? 0).toFixed(1)}/5</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-[9px] text-gray-500 uppercase font-extrabold tracking-wider">Best Mood</p>
            <p className="text-xl font-bold text-gray-950 mt-0.5">{summary?.bestMood ?? 0}/5</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-[9px] text-gray-500 uppercase font-extrabold tracking-wider">Total Entries</p>
            <p className="text-xl font-bold text-gray-950 mt-0.5">{summary?.totalEntries ?? 0}</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-[9px] text-gray-500 uppercase font-extrabold tracking-wider">Week Trend</p>
            <p className="text-xl font-bold text-gray-950 mt-0.5">
              {(summary?.weekOverWeekChange ?? 0) > 0 ? '+' : ''}
              {(summary?.weekOverWeekChange ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* AI Wellness Report Brief Content */}
        <div className="space-y-2">
          <h2 className="text-xs font-black text-gray-950 border-b border-gray-300 pb-1 uppercase tracking-wider">
            AI Wellness Analysis Brief
          </h2>
          <div className="space-y-1 text-[11px] leading-snug text-gray-950">
            {brief ? renderBriefContent(brief, true) : <p className="text-gray-400">No wellness analysis available for this range.</p>}
          </div>
        </div>

        {/* Page Break for Printable Charts (Page 2) */}
        <div className="pt-6 space-y-6 break-before-page border-t border-gray-300">
          <h2 className="text-sm font-black text-gray-950 border-b border-gray-300 pb-1 uppercase tracking-wider">Visual Mood Analytics</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="border border-gray-300 rounded-lg p-4 bg-white flex flex-col items-center">
              <h3 className="text-xs font-bold text-gray-800 mb-3 text-center uppercase tracking-wider">Mood Trend over Selected Period</h3>
              {chartData.length > 0 ? (
                <div className="w-full flex justify-center items-center py-2">
                  <LineChart width={680} height={200} data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#374151" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#374151" domain={[0, 5]} fontSize={10} fontWeight="bold" />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4f46e5"
                      dot={{ fill: '#4f46e5', r: 4 }}
                      strokeWidth={2.5}
                    />
                  </LineChart>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-12">Not enough mood data to render trend chart.</p>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg p-4 bg-white flex flex-col items-center">
              <h3 className="text-xs font-bold text-gray-800 mb-3 text-center uppercase tracking-wider">Distribution of Mood Types</h3>
              {moodDistribution.length > 0 ? (
                <div className="w-full flex justify-center items-center py-2">
                  <PieChart width={680} height={180}>
                    <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-12">No mood distribution data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
