'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User,
  Lock,
  Bell,
  Shield,
  Sun,
  Moon,
  Laptop,
  Trash2,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api-client';

const THEME_CATEGORIES = [
  { id: 'nature', name: 'Nature 🌲' },
  { id: 'mood', name: 'Moods 🧠' },
  { id: 'minimal', name: 'Minimal 🎨' },
  { id: 'aesthetic', name: 'Aesthetics 🌌' },
  { id: 'cozy', name: 'Cozy 📚' },
  { id: 'classic', name: 'Classic ✨' },
];

const THEMES_LIST = [
  // Nature Themes
  { id: 'forestgreen', name: 'Forest Green', category: 'nature', emoji: '🌲', bgPreview: '#14301a', primaryPreview: '#5ccb76', accentPreview: '#8cc084' },
  { id: 'oceanblue', name: 'Ocean Blue', category: 'nature', emoji: '🌊', bgPreview: '#12253c', primaryPreview: '#4ca3e0', accentPreview: '#5ca2bf' },
  { id: 'lavender', name: 'Lavender Bloom', category: 'nature', emoji: '💜', bgPreview: '#1b1430', primaryPreview: '#b593f0', accentPreview: '#b378ab' },
  { id: 'sunset', name: 'Sunset Orange', category: 'nature', emoji: '🌅', bgPreview: '#1f1323', primaryPreview: '#f26835', accentPreview: '#e0ab4c' },
  { id: 'sakura', name: 'Sakura Pink', category: 'nature', emoji: '🌸', bgPreview: '#1f131f', primaryPreview: '#f28da2', accentPreview: '#cf7cb3' },
  { id: 'autumn', name: 'Autumn Leaves', category: 'nature', emoji: '🍂', bgPreview: '#201212', primaryPreview: '#db6c37', accentPreview: '#a59242' },
  { id: 'mint', name: 'Mint Fresh', category: 'nature', emoji: '🌿', bgPreview: '#12201a', primaryPreview: '#4fcf9d', accentPreview: '#5cbfa6' },
  { id: 'midnightsky', name: 'Midnight Sky', category: 'nature', emoji: '🌌', bgPreview: '#09091f', primaryPreview: '#5c76cb', accentPreview: '#9d5ccb', modeRestriction: 'dark' },

  // Mood Themes
  { id: 'calm', name: 'Calm', category: 'mood', emoji: '🧘', bgPreview: '#121820', primaryPreview: '#5c96cb', accentPreview: '#5ca2a6' },
  { id: 'peace', name: 'Peace', category: 'mood', emoji: '☮️', bgPreview: '#122015', primaryPreview: '#5ccb84', accentPreview: '#5cbf8c' },
  { id: 'focus', name: 'Focus', category: 'mood', emoji: '🎯', bgPreview: '#0f141f', primaryPreview: '#3873b5', accentPreview: '#5c78a5' },
  { id: 'hope', name: 'Hope', category: 'mood', emoji: '✨', bgPreview: '#1f1a12', primaryPreview: '#cb9e5c', accentPreview: '#a2925c' },
  { id: 'joy', name: 'Joy', category: 'mood', emoji: '☀️', bgPreview: '#201a12', primaryPreview: '#cba85c', accentPreview: '#b57a38' },
  { id: 'energy', name: 'Energy', category: 'mood', emoji: '⚡', bgPreview: '#201212', primaryPreview: '#cb4e25', accentPreview: '#c27b38' },
  { id: 'serenity', name: 'Serenity', category: 'mood', emoji: '🕊️', bgPreview: '#131b2c', primaryPreview: '#7da2f0', accentPreview: '#6aa6bf' },
  { id: 'cozy', name: 'Cozy', category: 'mood', emoji: '🧸', bgPreview: '#1f1312', primaryPreview: '#a56c42', accentPreview: '#b5925c' },
  { id: 'healing', name: 'Healing', category: 'mood', emoji: '🌱', bgPreview: '#122018', primaryPreview: '#5ccb9d', accentPreview: '#5cbf7a' },
  { id: 'gratitude', name: 'Gratitude', category: 'mood', emoji: '🙏', bgPreview: '#1f121a', primaryPreview: '#b57085', accentPreview: '#9d7c5c' },

  // Minimal Themes
  { id: 'purewhite', name: 'Pure White', category: 'minimal', emoji: '⬜', bgPreview: '#ffffff', primaryPreview: '#151515', accentPreview: '#757575', modeRestriction: 'light' },
  { id: 'charcoal', name: 'Charcoal Black', category: 'minimal', emoji: '⬛', bgPreview: '#222222', primaryPreview: '#f5f5f5', accentPreview: '#5c6da5', modeRestriction: 'dark' },
  { id: 'softgray', name: 'Soft Gray', category: 'minimal', emoji: '🔘', bgPreview: '#969696', primaryPreview: '#404040', accentPreview: '#606060' },
  { id: 'cream', name: 'Cream', category: 'minimal', emoji: '🍦', bgPreview: '#fcfcf0', primaryPreview: '#453c2b', accentPreview: '#af9d75' },
  { id: 'beige', name: 'Beige', category: 'minimal', emoji: '🌾', bgPreview: '#f9f6e6', primaryPreview: '#4f3c25', accentPreview: '#a59275' },
  { id: 'slate', name: 'Slate Blue', category: 'minimal', emoji: '🏙️', bgPreview: '#f0f5fa', primaryPreview: '#45557a', accentPreview: '#657aa2' },

  // Aesthetic Themes
  { id: 'aurora', name: 'Aurora', category: 'aesthetic', emoji: '🌌', bgPreview: '#0b1612', primaryPreview: '#4fdca6', accentPreview: '#c85cdb', modeRestriction: 'dark' },
  { id: 'galaxy', name: 'Galaxy', category: 'aesthetic', emoji: '🪐', bgPreview: '#07071c', primaryPreview: '#b35cdb', accentPreview: '#db5cba', modeRestriction: 'dark' },
  { id: 'northernlights', name: 'Northern Lights', category: 'aesthetic', emoji: '🇳🇴', bgPreview: '#09121a', primaryPreview: '#4fdec8', accentPreview: '#9cde4f', modeRestriction: 'dark' },
  { id: 'cyberneon', name: 'Cyber Neon', category: 'aesthetic', emoji: '📟', bgPreview: '#060606', primaryPreview: '#db3399', accentPreview: '#33dbdb', modeRestriction: 'dark' },
  { id: 'glassmorphism', name: 'Glassmorphism', category: 'aesthetic', emoji: '🧪', bgPreview: '#12121f', primaryPreview: '#cb5cd5', accentPreview: '#cb925c' },
  { id: 'frostedice', name: 'Frosted Ice', category: 'aesthetic', emoji: '❄️', bgPreview: '#f3f9ff', primaryPreview: '#5ca2bf', accentPreview: '#5cbfa2' },
  { id: 'amoled', name: 'AMOLED Black', category: 'aesthetic', emoji: '🕶️', bgPreview: '#000000', primaryPreview: '#ffffff', accentPreview: '#6535cd', modeRestriction: 'dark' },
  { id: 'dreamscape', name: 'Dreamscape', category: 'aesthetic', emoji: '💭', bgPreview: '#fbf0fb', primaryPreview: '#d25cd2', accentPreview: '#d29a5c' },

  // Cozy Themes
  { id: 'coffeehouse', name: 'Coffee House', category: 'cozy', emoji: '☕', bgPreview: '#f8f4ec', primaryPreview: '#42362b', accentPreview: '#a58265' },
  { id: 'rainyday', name: 'Rainy Day', category: 'cozy', emoji: '🌧️', bgPreview: '#f0f4f8', primaryPreview: '#45587a', accentPreview: '#5c80a2' },
  { id: 'library', name: 'Library', category: 'cozy', emoji: '📚', bgPreview: '#faf7f0', primaryPreview: '#3c3228', accentPreview: '#9a805c' },
  { id: 'campfire', name: 'Campfire', category: 'cozy', emoji: '🔥', bgPreview: '#120f0f', primaryPreview: '#cb5e25', accentPreview: '#a52b20', modeRestriction: 'dark' },
  { id: 'candlelight', name: 'Candle Light', category: 'cozy', emoji: '🕯️', bgPreview: '#100e0e', primaryPreview: '#dbc24f', accentPreview: '#a57a3c', modeRestriction: 'dark' },
  { id: 'woodencabin', name: 'Wooden Cabin', category: 'cozy', emoji: '🪵', bgPreview: '#fcf8f0', primaryPreview: '#453c2b', accentPreview: '#487d5c' },

  // Classic Themes
  { id: 'indigo', name: 'Indigo Sunset', category: 'classic', emoji: '✨', bgPreview: '#f7f6fd', primaryPreview: '#5226c5', accentPreview: '#a56828' },
  { id: 'teal', name: 'Ocean Teal', category: 'classic', emoji: '✨', bgPreview: '#f5fbfa', primaryPreview: '#269fa5', accentPreview: '#c5b052' },
  { id: 'emerald', name: 'Forest Emerald', category: 'classic', emoji: '✨', bgPreview: '#f5fbf6', primaryPreview: '#26a54b', accentPreview: '#9fa526' },
  { id: 'rose', name: 'Royal Rose', category: 'classic', emoji: '✨', bgPreview: '#fdf6f8', primaryPreview: '#c5267a', accentPreview: '#8226c5' },
  { id: 'amber', name: 'Warm Amber', category: 'classic', emoji: '✨', bgPreview: '#fdf9f5', primaryPreview: '#a57c26', accentPreview: '#a52828' },
  { id: 'violet', name: 'Midnight Violet', category: 'classic', emoji: '✨', bgPreview: '#faf6fd', primaryPreview: '#8226c5', accentPreview: '#26a57c' },
  { id: 'sky', name: 'Nordic Sky', category: 'classic', emoji: '✨', bgPreview: '#f5fafd', primaryPreview: '#2ea2cc', accentPreview: '#cca62e' },
  { id: 'orange', name: 'Autumn Orange', category: 'classic', emoji: '✨', bgPreview: '#fdf7f5', primaryPreview: '#cc522e', accentPreview: '#cc2e2e' },
  { id: 'slate', name: 'Nordic Slate', category: 'classic', emoji: '✨', bgPreview: '#f8fafc', primaryPreview: '#45557a', accentPreview: '#657aa2' },
  { id: 'fuchsia', name: 'Royal Fuchsia', category: 'classic', emoji: '✨', bgPreview: '#fdf5fd', primaryPreview: '#b52ec5', accentPreview: '#8226c5' },
  { id: 'lime', name: 'Fresh Lime', category: 'classic', emoji: '✨', bgPreview: '#fafdf5', primaryPreview: '#b2c526', accentPreview: '#c57c26' },
  { id: 'cyan', name: 'Neon Cyan', category: 'classic', emoji: '✨', bgPreview: '#f5fcfd', primaryPreview: '#2ec5c5', accentPreview: '#5cc52e' },
  { id: 'crimson', name: 'Crimson Red', category: 'classic', emoji: '✨', bgPreview: '#fdf5f5', primaryPreview: '#c52626', accentPreview: '#c526b5' },
  { id: 'copper', name: 'Copper Rose', category: 'classic', emoji: '✨', bgPreview: '#fdf7f6', primaryPreview: '#a54b26', accentPreview: '#a58226' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, refresh, logout } = useAuth();


  const [name, setName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const themeStr = user?.preferences?.theme || 'light-indigo';
  const initialMode = themeStr.startsWith('dark')
    ? 'dark'
    : themeStr.startsWith('system')
    ? 'system'
    : 'light';
  const initialColor = themeStr.includes('-') ? themeStr.split('-')[1] : 'indigo';

  const [mode, setMode] = useState<'light' | 'dark' | 'system'>(initialMode);
  const [color, setColor] = useState<string>(initialColor);
  const [activeCategory, setActiveCategory] = useState<string>('nature');
  const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
  const [privateMode] = useState(user?.preferences?.privateMode ?? true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [passcodeEnabled, setPasscodeEnabled] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeMessage, setPasscodeMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_lock_passcode');
      setPasscodeEnabled(!!saved);
    }
  }, []);

  const handleTogglePasscodeEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setPasscodeEnabled(checked);
    if (!checked) {
      localStorage.removeItem('app_lock_passcode');
      sessionStorage.removeItem('app_unlocked');
      setNewPasscode('');
      setPasscodeMessage('Passcode lock disabled.');
    } else {
      setPasscodeMessage('Please enter a 4-digit passcode below.');
    }
  };

  const handleSavePasscode = () => {
    if (newPasscode.length !== 4) {
      alert('Passcode must be exactly 4 digits.');
      return;
    }
    localStorage.setItem('app_lock_passcode', newPasscode);
    sessionStorage.setItem('app_unlocked', 'true'); // bypass lock screen for current session
    setPasscodeMessage('Passcode lock configured successfully!');
  };

  if (!user) return null;

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    setProfileMessage('');
    try {
      await usersApi.updateProfile({ name });
      await refresh();
      setProfileMessage('Profile updated!');
    } catch (err) {
      setProfileMessage(err instanceof ApiError ? err.message : 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleThemeChange = async (nextMode: 'light' | 'dark' | 'system', nextColor: string) => {
    setMode(nextMode);
    setColor(nextColor);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('journal-theme', `${nextMode}-${nextColor}`);
      }
      await usersApi.updatePreferences({ theme: `${nextMode}-${nextColor}` });
      await refresh();
    } catch {
      // non-critical
    }
  };

  // Preview local theme changes instantly
  useEffect(() => {
    const htmlEl = document.documentElement;
    
    const applyTheme = (m: 'light' | 'dark' | 'system', c: string) => {
      htmlEl.classList.remove('dark', 'light');
      const classesToRemove: string[] = [];
      htmlEl.classList.forEach((cls) => {
        if (cls.startsWith('theme-')) {
          classesToRemove.push(cls);
        }
      });
      classesToRemove.forEach((cls) => htmlEl.classList.remove(cls));

      let isDark = false;
      if (m === 'dark') {
        isDark = true;
      } else if (m === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        htmlEl.classList.add('dark');
      } else {
        htmlEl.classList.add('light');
      }
      htmlEl.classList.add(`theme-${c}`);
    };

    applyTheme(mode, color);

    // Set up media query listener for previewing system mode
    let mediaQuery: MediaQueryList | null = null;
    let listener: (() => void) | null = null;
    if (mode === 'system' && typeof window !== 'undefined') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      listener = () => applyTheme(mode, color);
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
      }
    }

    // Cleanup: remove media query listeners
    return () => {
      if (mediaQuery && listener) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', listener);
        } else {
          mediaQuery.removeListener(listener);
        }
      }
    };
  }, [mode, color, user]);

  // Synchronize component state with external user settings changes
  useEffect(() => {
    const themeStr = user?.preferences?.theme || 'light-indigo';
    const savedMode = themeStr.startsWith('dark')
      ? 'dark'
      : themeStr.startsWith('system')
      ? 'system'
      : 'light';
    const savedColor = themeStr.includes('-') ? themeStr.split('-')[1] : 'indigo';
    setMode(savedMode);
    setColor(savedColor);
  }, [user]);

  const handleNotificationsChange = async (checked: boolean) => {
    setNotifications(checked);
    setSavingPrefs(true);
    try {
      await usersApi.updatePreferences({ notifications: checked });
    } catch {
      setNotifications(!checked); // revert on failure
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setPasswordMessage('');
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordMessage('Password changed. Please log in again.');
      setTimeout(async () => {
        await logout();
        router.push('/auth/login');
      }, 1500);
    } catch (err) {
      setPasswordMessage(err instanceof ApiError ? err.message : 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteMessage('');
    try {
      await usersApi.deleteAccount(deletePassword);
      router.push('/');
    } catch (err) {
      setDeleteMessage(err instanceof ApiError ? err.message : 'Could not delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Account Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Account
        </h2>
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="text" value={user.email} disabled className="opacity-50 cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Join Date</label>
            <Input
              type="text"
              value={new Date(user.createdAt).toLocaleDateString()}
              disabled
              className="opacity-50 cursor-not-allowed"
            />
          </div>
          {profileMessage && <p className="text-sm text-muted-foreground">{profileMessage}</p>}
          <Button
            className="w-full gap-2 bg-primary hover:bg-primary/90"
            onClick={handleUpdateProfile}
            disabled={savingProfile || !name.trim()}
          >
            {savingProfile ? 'Saving...' : 'Update Profile'}
          </Button>
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Security
        </h2>
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
          >
            <span className="font-medium">Change Password</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
          </button>

          {showPasswordForm && (
            <div className="space-y-3 p-3 border-t border-border pt-3">
              <Input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {passwordMessage && <p className="text-sm text-muted-foreground">{passwordMessage}</p>}
              <Button
                size="sm"
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || newPassword.length < 8}
              >
                {savingPassword ? 'Saving...' : 'Save New Password'}
              </Button>
            </div>
          )}

          <button
            disabled
            className="w-full flex items-center justify-between p-3 rounded-lg transition-colors border-t border-border pt-3 opacity-50 cursor-not-allowed"
          >
            <span className="font-medium">Two-Factor Authentication (coming soon)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            disabled
            className="w-full flex items-center justify-between p-3 rounded-lg transition-colors border-t border-border pt-3 opacity-50 cursor-not-allowed"
          >
            <span className="font-medium">Active Sessions (coming soon)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Preferences
        </h2>
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          {/* Theme */}
          <div className="space-y-6">
            {/* Theme Mode */}
            {(() => {
              const currentThemeConfig = THEMES_LIST.find((t) => t.id === color);
              const modeRestriction = currentThemeConfig?.modeRestriction;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-sm text-muted-foreground">Theme Mode</label>
                    {modeRestriction && (
                      <span className="text-xs font-semibold text-primary">
                        Locked to {modeRestriction === 'dark' ? 'Dark' : 'Light'} for {currentThemeConfig.name}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleThemeChange('light', color)}
                      disabled={savingPrefs || modeRestriction === 'dark'}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        mode === 'light'
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark', color)}
                      disabled={savingPrefs || modeRestriction === 'light'}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        mode === 'dark'
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </button>
                    <button
                      onClick={() => handleThemeChange('system', color)}
                      disabled={savingPrefs || !!modeRestriction}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        mode === 'system'
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground'
                      }`}
                    >
                      <Laptop className="w-4 h-4" />
                      System
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Custom Theme Picker Categories */}
            <div className="space-y-4 border-t border-border pt-4">
              <label className="font-medium text-sm text-muted-foreground">Color Theme & Palette</label>
              
              {/* Category Selector Tabs */}
              <div className="flex gap-1.5 border-b border-border pb-2 overflow-x-auto scrollbar-none">
                {THEME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Themes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {THEMES_LIST.filter((t) => t.category === activeCategory).map((theme) => {
                  const isSelected = color === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        let nextMode = mode;
                        if (theme.modeRestriction) {
                          nextMode = theme.modeRestriction as 'light' | 'dark';
                        }
                        handleThemeChange(nextMode, theme.id);
                      }}
                      disabled={savingPrefs}
                      className={`relative flex flex-col items-start p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/40 bg-card hover:shadow-sm'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-lg">{theme.emoji}</span>
                        <span className="font-semibold text-xs leading-none">{theme.name}</span>
                      </div>

                      {/* Palette preview dots */}
                      <div className="flex gap-1 mt-auto w-full items-center justify-between">
                        <div className="flex gap-1">
                          {/* Background preview dot */}
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-border"
                            style={{ background: theme.bgPreview }}
                            title="Background Preview"
                          />
                          {/* Primary preview dot */}
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: theme.primaryPreview }}
                            title="Primary Preview"
                          />
                          {/* Accent preview dot */}
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: theme.accentPreview }}
                            title="Accent Preview"
                          />
                        </div>
                        
                        {/* Mode restriction badge */}
                        {theme.modeRestriction && (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-muted text-muted-foreground scale-90 origin-right">
                            {theme.modeRestriction} only
                          </span>
                        )}
                      </div>

                      {/* Selected dot indicator */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notifications
                </label>
                <p className="text-sm text-muted-foreground">Get reminders to journal and mood check-ins</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => handleNotificationsChange(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Private Mode */}
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Private Mode
                </label>
                <p className="text-sm text-muted-foreground">Keep your entries completely private and encrypted</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={privateMode} className="w-4 h-4" disabled />
              </label>
            </div>
          </div>

          {/* Database Encryption Status */}
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  AES-256 Database Encryption
                </label>
                <p className="text-sm text-muted-foreground">All journal entries, titles, and AI reflections are encrypted on the server using AES-256-CBC</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* App Passcode Lock */}
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    App Passcode Lock
                  </label>
                  <p className="text-sm text-muted-foreground">Require a passcode whenever the application is opened</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passcodeEnabled}
                    onChange={handleTogglePasscodeEnabled}
                    className="w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {passcodeEnabled && (
                <div className="space-y-2 max-w-xs animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-semibold text-muted-foreground">Set 4-Digit Passcode</label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      value={newPasscode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, ''); // numbers only
                        setNewPasscode(val);
                      }}
                      className="text-center font-bold tracking-widest text-lg"
                    />
                    <Button onClick={handleSavePasscode} size="sm" className="bg-primary hover:bg-primary/90 cursor-pointer">
                      Save Passcode
                    </Button>
                  </div>
                  {passcodeMessage && (
                    <p className={`text-xs font-semibold ${passcodeMessage.includes('successfully') || passcodeMessage.includes('disabled') ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {passcodeMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 hover:bg-destructive/20 rounded-lg transition-colors text-destructive font-medium"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteForm(!showDeleteForm)}
            className="w-full flex items-center justify-between p-3 hover:bg-destructive/20 rounded-lg transition-colors text-destructive font-medium border-t border-destructive/20 pt-3"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </span>
            <ChevronRight className={`w-4 h-4 transition-transform ${showDeleteForm ? 'rotate-90' : ''}`} />
          </button>

          {showDeleteForm && (
            <div className="space-y-3 pt-3">
              <p className="text-sm text-destructive">
                This permanently deactivates your account. Enter your password to confirm.
              </p>
              <Input
                type="password"
                placeholder="Your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              {deleteMessage && <p className="text-sm text-destructive">{deleteMessage}</p>}
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting || !deletePassword}>
                {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
