'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi, AdminStats, AdminUserEntry } from '@/lib/api/admin';
import type { BackendUser } from '@/lib/api-types';
import {
  Users,
  BookOpen,
  Search,
  Shield,
  Sparkles,
  UserCheck,
  Calendar,
  Filter,
  Eye,
  X,
  MessageSquare,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Tag
} from 'lucide-react';

const MOOD_COLORS: Record<string, string> = {
  EXCELLENT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  GREAT: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  GOOD: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  OKAY: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  SAD: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  ANXIOUS: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'entries' | 'users' | 'stats'>('entries');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [entries, setEntries] = useState<AdminUserEntry[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AdminUserEntry | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, entriesRes, usersRes] = await Promise.allSettled([
        adminApi.getDashboardStats(),
        adminApi.listAllEntries({ limit: 100 }),
        adminApi.listUsers({ limit: 100 }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.data);
      }
      if (entriesRes.status === 'fulfilled' && entriesRes.value.success) {
        setEntries(entriesRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        setUsers(usersRes.value.data);
      }
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesMood = selectedMood === 'ALL' || entry.mood?.toUpperCase() === selectedMood.toUpperCase();
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesMood;

      const matchesTitle = entry.title?.toLowerCase().includes(query);
      const matchesContent = entry.content?.toLowerCase().includes(query);
      const matchesUser =
        entry.user?.name?.toLowerCase().includes(query) ||
        entry.user?.email?.toLowerCase().includes(query);

      return matchesMood && (matchesTitle || matchesContent || matchesUser);
    });
  }, [entries, searchQuery, selectedMood]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return users;
    return users.filter(
      (u) => u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminApi.setUserStatus(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 p-8 text-white shadow-xl border border-amber-700/30">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              System Admin Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-amber-100">
              All Users & Entries Management
            </h1>
            <p className="text-amber-200/80 text-sm max-w-xl">
              Inspect journal entries submitted by all users across the system, review active platform statistics, and monitor community engagement.
            </p>
          </div>

          <Button
            onClick={fetchAdminData}
            variant="outline"
            className="self-start md:self-auto gap-2 bg-amber-950/40 border-amber-400/30 text-amber-100 hover:bg-amber-800/50 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-amber-300 animate-pulse" />
            Refresh System Data
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total System Users</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats?.totalUsers ?? users.length}</p>
          <span className="text-xs text-emerald-600 font-medium">+{stats?.newUsersLast7Days ?? 0} new this week</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total User Entries</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats?.totalEntries ?? entries.length}</p>
          <span className="text-xs text-amber-600 font-medium">+{stats?.newEntriesLast7Days ?? 0} new this week</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Counseling Sessions</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats?.totalChatSessions ?? 0}</p>
          <span className="text-xs text-muted-foreground font-medium">AI reflections active</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active System Users</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats?.activeUsers ?? users.filter(u => u.isActive).length}</p>
          <span className="text-xs text-emerald-600 font-medium">Verified accounts</span>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-xl">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'entries'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            All User Entries ({filteredEntries.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            Users Directory ({filteredUsers.length})
          </button>
        </div>

        {/* Search & Mood Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={activeTab === 'entries' ? "Search title, content, user..." : "Search user name, email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64 bg-card border-border text-sm"
            />
          </div>

          {activeTab === 'entries' && (
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Moods</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GREAT">Great</option>
              <option value="GOOD">Good</option>
              <option value="OKAY">Okay</option>
              <option value="SAD">Sad</option>
              <option value="ANXIOUS">Anxious</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading system entries and user data...</p>
        </div>
      ) : activeTab === 'entries' ? (
        filteredEntries.length === 0 ? (
          <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="text-lg font-serif font-bold">No Entries Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No journal entries match your search criteria. Try adjusting your mood filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntries.map((entry) => {
              const moodKey = entry.mood?.toUpperCase() || 'GOOD';
              const moodStyle = MOOD_COLORS[moodKey] || 'bg-muted text-muted-foreground';

              return (
                <div
                  key={entry.id}
                  className="group bg-card border border-border hover:border-amber-600/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* User Info Header */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                          {entry.user?.name ? entry.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold truncate text-foreground">
                            {entry.user?.name || 'Anonymous User'}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{entry.user?.email || 'No email'}</p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${moodStyle}`}>
                        {entry.mood}
                      </span>
                    </div>

                    {/* Entry Title & Snippet */}
                    <div>
                      <h4 className="font-serif font-bold text-base text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {entry.title || 'Untitled Entry'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3 font-handwriting text-lg leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>

                    <Button
                      onClick={() => setSelectedEntry(entry)}
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-600/10 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read Entry
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Users Directory Tab */
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                          {userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{userItem.name}</p>
                          <p className="text-xs text-muted-foreground">{userItem.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        userItem.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-muted text-muted-foreground'
                      }`}>
                        {userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {userItem.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleToggleUserStatus(userItem.id, userItem.isActive)}
                        variant="outline"
                        size="sm"
                        className={`text-xs cursor-pointer ${
                          userItem.isActive
                            ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        {userItem.isActive ? 'Suspend User' : 'Activate User'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entry Reader Drawer Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-card border border-amber-900/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Author Header */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-sm">
                {selectedEntry.user?.name ? selectedEntry.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selectedEntry.user?.name || 'User Entry'}</h3>
                <p className="text-xs text-muted-foreground">{selectedEntry.user?.email}</p>
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(selectedEntry.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Entry Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-foreground">{selectedEntry.title}</h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 capitalize">
                  {selectedEntry.mood}
                </span>
              </div>

              {/* Ruled Paper Reader Container */}
              <div className="bg-ruled-paper p-6 sm:p-8 rounded-xl shadow-inner border border-amber-900/20 min-h-[200px] relative">
                <div className="absolute top-0 bottom-0 left-11 w-[2px] bg-red-400/60 pointer-events-none" />
                <p className="font-handwriting text-2xl md:text-3xl leading-[2.25rem] text-slate-900 dark:text-amber-100 pl-8 whitespace-pre-wrap">
                  {selectedEntry.content}
                </p>
              </div>

              {selectedEntry.aiReflection && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Sparkles className="w-4 h-4" />
                    AI Counseling Reflection Summary
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{selectedEntry.aiReflection}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={() => setSelectedEntry(null)} className="cursor-pointer">
                Close Reader
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
