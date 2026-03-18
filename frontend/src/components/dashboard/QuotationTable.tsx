'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  User, 
  ChevronRight, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { shoppingApi } from '@/services/api';

interface Quotation {
  id: string;
  name: string;
  status: string;
  total_items: number;
  processed_items: number;
  client_name?: string;
  responsible_name?: string;
  created_at: string;
}

interface QuotationTableProps {
  quotations: Quotation[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const icons = {
    pending: <Clock size={14} />,
    processing: <Clock size={14} className="animate-spin" />,
    completed: <CheckCircle2 size={14} />,
    failed: <AlertCircle size={14} />,
  };

  const label = {
    pending: "Pendente",
    processing: "Em Processamento",
    completed: "Concluída",
    failed: "Falha",
  };

  const style = styles[status as keyof typeof styles] || styles.pending;
  const icon = icons[status as keyof typeof icons] || icons.pending;
  const txt = label[status as keyof typeof label] || status;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", style)}>
      {icon}
      {txt}
    </span>
  );
};

export default function QuotationTable({ quotations }: QuotationTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-petroleum-800 dark:bg-petroleum-900/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-petroleum-800 dark:bg-petroleum-900/40">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Cotação</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Interessado</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Responsável</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Data</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-petroleum-800">
            {quotations.map((q) => (
              <tr key={q.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-petroleum-900/30">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{q.name}</span>
                    <span className="text-xs text-slate-500 dark:text-petroleum-400">{q.total_items} itens</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={q.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-petroleum-300">
                    <Building size={16} className="text-slate-400" />
                    {q.client_name || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-petroleum-300">
                    <User size={16} className="text-slate-400" />
                    {q.responsible_name || 'Joabe Oliveira'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-petroleum-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {new Date(q.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                   <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => shoppingApi.exportQuotation(q.id)}
                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Exportar Excel"
                      >
                        <Download size={18} />
                      </button>
                      <Link href={`/quotations/${q.id}`}>
                        <button className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-petroleum-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-petroleum-50 hover:ring-petroleum-200 dark:bg-petroleum-900 dark:text-petroleum-400 dark:ring-petroleum-800 dark:hover:bg-petroleum-800">
                          Ver Detalhes
                          <ChevronRight size={14} />
                        </button>
                      </Link>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
