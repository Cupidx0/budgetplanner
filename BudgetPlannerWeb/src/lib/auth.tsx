import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';
import { api } from './api';

const STORAGE_KEY = 'budget-planner:user';

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function storeUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode etc.) — session just won't persist.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const signIn = useCallback((u: AuthUser) => {
    const next: AuthUser = { user_id: u.user_id, username: u.username };
    storeUser(next);
    setUser(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (username, password) => signIn(await api.login(username, password)),
      register: async (username, password) => signIn(await api.register(username, password)),
      logout: () => {
        storeUser(null);
        setUser(null);
      },
    }),
    [user, signIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** For pages behind the login gate, where a user is guaranteed. */
export function useUser(): AuthUser {
  const { user } = useAuth();
  if (!user) throw new Error('useUser called without a signed-in user');
  return user;
}
