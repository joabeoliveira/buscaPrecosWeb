'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuotationTable from '@/components/dashboard/QuotationTable';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowRight,
  RefreshCcw,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

import { shoppingApi } from '@/services/api';

export default function DashboardPage() {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await shoppingApi.listQuotations();
      setQuotations(data);
    } catch (error) {
      console.error('Falha ao carregar cotações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const filteredQuotations = quotations.filter((q: any) => {
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (q.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Bem-vindo, Joabe</h1>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400">Gerencie todas as suas cotações em um único lugar.</p>
        </div>
        <Link href="/quotations/new">
          <Button className="h-12 px-6 shadow-md shadow-petroleum-500/20">
            <Plus size={20} className="mr-2" />
            Nova Cotação
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total de Cotações', value: quotations.length, icon: <LayoutGrid className="text-blue-500" /> },
          { label: 'Em Andamento', value: quotations.filter((q: any) => q.status === 'processing').length, icon: <RefreshCcw className="text-amber-500 animate-spin-slow" /> },
          { label: 'Concluídas', value: quotations.filter((q: any) => q.status === 'completed').length, icon: <CheckCircle2 className="text-emerald-500" /> },
          { label: 'Aguardando', value: quotations.filter((q: any) => q.status === 'pending').length, icon: <Clock className="text-slate-500" /> },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-petroleum-800 dark:bg-petroleum-900/30">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-petroleum-900/50">
                {stat.icon}
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-petroleum-500">{stat.label}</p>
            <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-petroleum-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome ou cliente..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm transition-all focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/40 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium dark:border-petroleum-800 dark:bg-petroleum-900/40 dark:text-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="processing">Em Processamento</option>
            <option value="completed">Concluída</option>
          </select>

          <Button variant="ghost" className="h-12 w-12 p-0" onClick={fetchQuotations}>
            <RefreshCcw size={20} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="grid h-[400px] place-items-center rounded-2xl border border-slate-200 bg-white dark:border-petroleum-800 dark:bg-petroleum-900/20">
          <div className="flex flex-col items-center gap-4">
            <RefreshCcw className="animate-spin text-petroleum-500" size={48} />
            <p className="text-slate-500 dark:text-petroleum-400">Carregando cotações...</p>
          </div>
        </div>
      ) : filteredQuotations.length > 0 ? (
        <QuotationTable quotations={filteredQuotations} />
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center dark:border-petroleum-800 dark:bg-petroleum-900/10">
          <div className="rounded-full bg-slate-50 p-6 dark:bg-petroleum-900/30">
            <LayoutGrid size={48} className="text-slate-300 dark:text-petroleum-800" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">Nenhuma cotação encontrada</h3>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400">Que tal criar sua primeira cotação profissional agora?</p>
          <Link href="/quotations/new" className="mt-8">
            <Button>
              <Plus size={20} className="mr-2" />
              Criar Nova Cotação
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

const CheckCircle2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

const Clock = ({ className, size }: { className?: string, size?: number }) => (
  <svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
