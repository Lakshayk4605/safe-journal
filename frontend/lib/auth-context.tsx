'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from './api/auth';
import { usersApi } from './api/users';
import type { BackendProfile } from './api-types';
import { ApiError } from './api-client';

interface AuthContextValue {
  user: BackendProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await usersApi.getProfile();
      setUser(data.profile);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setUser(null);
      } else {
        // Network/backend-down errors shouldn't wipe an already-loaded session;
        // only clear on an explicit "you're not authenticated" response.
        setUser((prev) => prev);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login({ email, password });
    await refresh();
  }, [refresh]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await authApi.signup({ name, email, password });
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
