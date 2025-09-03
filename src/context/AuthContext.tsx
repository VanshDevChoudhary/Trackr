import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearTokens, loadTokens, getDeviceId, onLogout } from '../lib/api';

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    onLogout(logout);

    (async () => {
      const { accessToken } = await loadTokens();
      if (accessToken) {
        try {
          const profile = await api<User>('/user/profile');
          setUser(profile);
        } catch {
          await clearTokens();
        }
      }
      setIsLoading(false);
    })();
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const deviceId = await getDeviceId();
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password, deviceId }) },
    );
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const deviceId = await getDeviceId();
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name, deviceId }) },
    );
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
