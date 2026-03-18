'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Mail, Lock, AlertCircle, Loader2, Footprints } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Falha ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-petroleum-950">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-petroleum-500 to-indigo-600 text-white shadow-xl">
            <Search size={32} strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Busca<span className="text-petroleum-500">Preços</span> <span className="text-sm font-medium text-slate-400">v1.2</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400">Sistema Inteligente de Cotações para Licitações</p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-petroleum-900/10 dark:border-petroleum-800 dark:bg-petroleum-900/40">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-950 dark:text-white transition-all shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Senha</label>
                <a href="#" className="text-xs font-semibold text-petroleum-600 hover:underline">Esqueceu?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-950 dark:text-white transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 transition-all animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <Button 
               type="submit" 
               className="w-full h-12 text-md font-bold rounded-2xl bg-petroleum-600 hover:bg-petroleum-700 shadow-lg shadow-petroleum-600/20"
               isLoading={isLoading}
            >
              Entrar no Sistema
            </Button>
          </form>

          <div className="mt-10 text-center">
             <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-petroleum-800">
               <div className="h-px w-8 bg-slate-200 dark:bg-petroleum-800"></div>
               <span className="text-[10px] uppercase font-bold tracking-widest">Controle de Segurança Ativo</span>
               <div className="h-px w-8 bg-slate-200 dark:bg-petroleum-800"></div>
             </div>
             <p className="mt-4 text-xs text-slate-400 dark:text-petroleum-600">
               Caso não tenha acesso, solicite ao seu administrador.
             </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Shield size={14} /> Auditado</span>
          <span className="flex items-center gap-1"><Footprints size={14} /> Antigravity Core 2.0</span>
        </div>
      </div>
    </div>
  );
}

function Shield({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
