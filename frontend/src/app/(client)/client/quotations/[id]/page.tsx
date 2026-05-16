'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Download, FileText, RefreshCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ListResult, shoppingApi } from '@/services/api';

type ClientQuotation = {
  id: string;
  name: string;
  status: string;
  total_items: number;
  internal_code?: string | null;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  pending: 'Enviado para a Infore',
  processing: 'Analise de mercado iniciada',
  completed: 'Cotacao concluida',
  failed: 'Necessita revisao',
};

export default function ClientQuotationDetailsPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const [quotation, setQuotation] = useState<ClientQuotation | null>(null);
  const [results, setResults] = useState<ListResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [quotationData, resultData] = await Promise.all([
        shoppingApi.getQuotation(quotationId),
        shoppingApi.getResults(quotationId),
      ]);
      setQuotation(quotationData);
      setResults(resultData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar a cotacao.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quotationId) fetchQuotation();
  }, [quotationId]);

  const totals = useMemo(() => {
    const approved = results.filter(item => item.is_approved && item.best_price);
    return {
      approvedCount: approved.length,
      totalValue: approved.reduce((sum, item) => sum + Number(item.best_price || 0) * Number(item.quantity || 1), 0),
    };
  }, [results]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await shoppingApi.exportQuotation(quotationId);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link href="/client/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-petroleum-600 dark:text-slate-400 dark:hover:text-petroleum-400">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{quotation?.name || 'Cotacao'}</h2>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400">
            {quotation?.internal_code ? `Referencia: ${quotation.internal_code}` : 'Acompanhe o andamento da sua solicitacao.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-11 gap-2" onClick={fetchQuotation}>
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
          <Button variant="secondary" className="h-11 gap-2" onClick={handleExport} isLoading={isExporting}>
            <Download size={18} />
            Exportar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <InfoCard label="Status" value={statusLabel[quotation?.status || 'pending'] || quotation?.status || '-'} />
        <InfoCard label="Itens enviados" value={String(quotation?.total_items || results.length || 0)} />
        <InfoCard label="Total aprovado" value={totals.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-petroleum-800 dark:bg-petroleum-900/30">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-petroleum-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Itens da cotacao</h3>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-slate-500">
            <RefreshCcw className="mr-2 animate-spin" size={20} />
            Carregando itens...
          </div>
        ) : results.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-slate-500">
            <FileText className="mb-3 text-slate-300" size={40} />
            Nenhum item encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-petroleum-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3 text-right">Qtd</th>
                  <th className="px-5 py-3 text-right">Preco escolhido</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-petroleum-800">
                {results.map(item => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.original_query}</p>
                      {item.sku_grade && <p className="mt-1 text-xs text-slate-500">{item.sku_grade}</p>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-petroleum-300">{item.category_name || '-'}</td>
                    <td className="px-5 py-4 text-right font-mono text-slate-600 dark:text-petroleum-300">
                      {Number(item.quantity || 1).toLocaleString('pt-BR')} {item.unit || 'un'}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white">
                      {item.best_price ? Number(item.best_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                    </td>
                    <td className="px-5 py-4">
                      {item.is_approved ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 size={14} />
                          Aprovado
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-petroleum-800 dark:text-petroleum-300">
                          {statusLabel[item.status] || item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-petroleum-800 dark:bg-petroleum-900/30">
      <p className="text-sm font-semibold text-slate-500 dark:text-petroleum-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
