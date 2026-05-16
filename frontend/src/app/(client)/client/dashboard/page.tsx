'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, FileText, RefreshCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { shoppingApi } from '@/services/api';

type ClientQuotation = {
  id: string;
  name: string;
  status: string;
  total_items: number;
  created_at: string;
};

const statusText: Record<string, string> = {
  pending: 'Enviado para a Infore',
  processing: 'Análise de mercado iniciada',
  completed: 'Cotação concluída',
  failed: 'Necessita revisão',
};

export default function ClientDashboardPage() {
  const [quotations, setQuotations] = useState<ClientQuotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await shoppingApi.listQuotations();
      setQuotations(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const stats = useMemo(() => ({
    pending: quotations.filter(q => q.status === 'pending').length,
    processing: quotations.filter(q => q.status === 'processing').length,
    completed: quotations.filter(q => q.status === 'completed').length,
    failed: quotations.filter(q => q.status === 'failed').length,
  }), [quotations]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Minhas cotações</h2>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400">Acompanhe o andamento das solicitações enviadas para a Infore.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-11 gap-2" onClick={fetchQuotations}>
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
          <Link href="/client/quotations/new">
            <Button className="h-11">Nova solicitação</Button>
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Pendentes" value={stats.pending} icon={<Clock className="text-amber-500" />} />
        <StatusCard label="Em cotação" value={stats.processing} icon={<RefreshCcw className="text-blue-500" />} />
        <StatusCard label="Concluídas" value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatusCard label="Revisão" value={stats.failed} icon={<AlertCircle className="text-red-500" />} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-petroleum-800 dark:bg-petroleum-900/30">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-petroleum-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Solicitações recentes</h3>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-slate-500">
            <RefreshCcw className="mr-2 animate-spin" size={20} />
            Carregando cotações...
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-slate-500">
            <FileText className="mb-3 text-slate-300" size={40} />
            Nenhuma cotação enviada ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-petroleum-800">
            {quotations.map(quotation => (
              <Link
                key={quotation.id}
                href={`/client/quotations/${quotation.id}`}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-petroleum-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{quotation.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{quotation.total_items} itens</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-petroleum-700 dark:text-petroleum-300">
                    {statusText[quotation.status] || quotation.status}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(quotation.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-petroleum-800 dark:bg-petroleum-900/30">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-petroleum-400">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
