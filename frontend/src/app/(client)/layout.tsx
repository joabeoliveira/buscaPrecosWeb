'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, LogOut } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'client_admin' && user.role !== 'client_buyer') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-petroleum-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-petroleum-600" />
          <p className="mt-4 font-medium text-slate-500">Validando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-petroleum-950">
      <header className="border-b border-slate-200 bg-white dark:border-petroleum-800 dark:bg-petroleum-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-petroleum-600 dark:text-petroleum-400">Portal do Cliente</p>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">BuscaPreços</h1>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-petroleum-800 dark:text-petroleum-300 dark:hover:bg-petroleum-900"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
