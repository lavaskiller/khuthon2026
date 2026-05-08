import { createContext, useContext, useState, type ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      // Mock accounts for testing without a backend
      const MOCK_USERS: Record<string, User> = {
        'consumer@test.com': { id: 'mock-consumer', email: 'consumer@test.com', nickname: '테스트소비자', role: 'consumer', onboardingCompleted: false },
        'creator@test.com':  { id: 'mock-creator',  email: 'creator@test.com',  nickname: '테스트창작자', role: 'creator' },
        'admin@test.com':    { id: 'mock-admin',    email: 'admin@test.com',    nickname: '관리자', role: 'admin' },
      };
      if (password === 'test1234' && email in MOCK_USERS) {
        setUser(MOCK_USERS[email]);
        setToken('mock-token');
        return;
      }

      const { api } = await import('@/services/api');
      // 백엔드 login은 { access_token, token_type }만 반환 — user 별도 조회
      const { access_token } = await api.auth.login(email, password);
      const user = await api.auth.getMe(access_token);
      setToken(access_token);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  }

  function loginDirect(u: User, t: string) {
    setUser(u);
    setToken(t);
  }

  function logout() {
    setUser(null);
    setToken(null);
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
