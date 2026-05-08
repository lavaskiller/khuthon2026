import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDirect: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_TOKEN = 'veil_token';
const STORAGE_USER  = 'veil_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_USER) ?? 'null'); } catch { return null; }
  });
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN));
  const [isLoading, setIsLoading] = useState(false);

  // 토큰 유효성 검사 — 새로고침 시 만료된 토큰 제거
  useEffect(() => {
    if (!token) return;
    import('@/services/api').then(({ api }) =>
      api.auth.getMe(token).then(u => setUserState(u)).catch(() => logout())
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(u: User, t: string) {
    localStorage.setItem(STORAGE_TOKEN, t);
    localStorage.setItem(STORAGE_USER, JSON.stringify(u));
  }

  function clear() {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const { api } = await import('@/services/api');
      const { access_token } = await api.auth.login(email, password);
      const u = await api.auth.getMe(access_token);
      persist(u, access_token);
      setTokenState(access_token);
      setUserState(u);
    } finally {
      setIsLoading(false);
    }
  }

  function loginDirect(u: User, t: string) {
    persist(u, t);
    setUserState(u);
    setTokenState(t);
  }

  function logout() {
    clear();
    setUserState(null);
    setTokenState(null);
  }

  function setUser(u: User) {
    localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    setUserState(u);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginDirect, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
