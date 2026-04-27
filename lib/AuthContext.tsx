import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(async (t) => {
      if (t) {
        setToken(t);
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
        } catch (err: any) {
          // Only clear token on 401 (invalid/expired token)
          // Keep token on network errors so user stays logged in offline
          if (err?.response?.status === 401) {
            await AsyncStorage.removeItem('token');
            setToken(null);
          }
        }
      }
      setLoading(false);
    });
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    api.post('/auth/track-time').catch(() => {});
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    await AsyncStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
