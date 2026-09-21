import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';

type User = {
  id: string;
  email: string;
  role: 'ENTREPRISE' | 'INTERIMAIRE';
  entreprise?: any;
  interim?: any;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = localStorage.getItem('im_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>('/api/auth/me');
      setUser(me);
    } catch (e) {
      console.warn('auth/me fail', e);
      localStorage.removeItem('im_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    const res = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('im_token', res.token);
    await refresh();
  }

  async function loginWithToken(token: string) {
    localStorage.setItem('im_token', token);
    setLoading(true);
    await refresh();
  }

  async function register(payload: any) {
    const res = await api<{ token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('im_token', res.token);
    await refresh();
  }

  function logout() {
    localStorage.removeItem('im_token');
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, login, loginWithToken, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
