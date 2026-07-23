'use client';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

function ThemeSync() {
  const { user } = useAuth();

  useEffect(() => {
    // Determine fallback default theme based on system preference
    let defaultTheme = 'light-indigo';
    if (typeof window !== 'undefined') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      defaultTheme = isSystemDark ? 'dark-indigo' : 'light-indigo';
    }

    const localTheme = typeof window !== 'undefined' ? localStorage.getItem('journal-theme') : null;
    const themeStr = user?.preferences?.theme || localTheme || defaultTheme;

    const applyThemeClasses = (str: string) => {
      let isDark = false;
      let colorTheme = 'indigo';

      if (str.startsWith('dark')) {
        isDark = true;
      } else if (str.startsWith('system')) {
        if (typeof window !== 'undefined') {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      }

      if (str.includes('-')) {
        colorTheme = str.split('-')[1];
      } else if (str === 'light' || str === 'dark') {
        // Handle legacy theme values cleanly
        colorTheme = 'indigo';
      }

      const htmlEl = document.documentElement;

      // Clean up current theme styles
      htmlEl.classList.remove('dark', 'light');
      const classesToRemove: string[] = [];
      htmlEl.classList.forEach((cls) => {
        if (cls.startsWith('theme-')) {
          classesToRemove.push(cls);
        }
      });
      classesToRemove.forEach((cls) => htmlEl.classList.remove(cls));

      // Apply the active mode and color theme classes
      if (isDark) {
        htmlEl.classList.add('dark');
      } else {
        htmlEl.classList.add('light');
      }
      htmlEl.classList.add(`theme-${colorTheme}`);
    };

    applyThemeClasses(themeStr);

    // Persist to local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('journal-theme', themeStr);
    }

    // Set up media query listener if using system theme
    if (themeStr.startsWith('system') && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyThemeClasses(themeStr);
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', listener);
        } else {
          mediaQuery.removeListener(listener);
        }
      };
    }
  }, [user]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeSync />
      {children}
    </AuthProvider>
  );
}
