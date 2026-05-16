'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shoppingApi } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'helper' | 'auditor' | 'user' | 'client_admin' | 'client_buyer';
  client_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('bp_user');
    const token = localStorage.getItem('bp_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    const data = await shoppingApi.login(email, password);
    localStorage.setItem('bp_token', data.token);
    localStorage.setItem('bp_user', JSON.stringify(data.user));
    setUser(data.user);
    const isClientUser = data.user.role === 'client_admin' || data.user.role === 'client_buyer';
    router.push(isClientUser ? '/client/dashboard' : '/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('bp_token');
    localStorage.removeItem('bp_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
