'use client';

import React from 'react';
import { FileText, Download, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ReportsPage() {
  const reportCards = [
    { title: 'Relatório por Cliente', desc: 'Resumo de todas as cotações vinculadas a um interessado específico.', icon: <PieChart size={24} className="text-emerald-500" /> },
    { title: 'Economia Calculada', desc: 'Gráficos de economia baseados no preço de referência e melhor preço encontrado.', icon: <TrendingUp size={24} className="text-petroleum-500" /> },
    { title: 'Desempenho da Equipe', desc: 'Quantidade de análises realizadas por cada auxiliar de cotação.', icon: <BarChart3 size={24} className="text-indigo-500" /> }
  ];

  return (
    <div className="p-8">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Relatórios e Exportação</h1>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400">Exporte dados detalhados para PDF, Excel ou CSV.</p>
        </div>
        <Button variant="outline">
           <Download size={18} className="mr-2" /> Exportar Dados Gerais
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
         {reportCards.map((r, i) => (
           <div key={i} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-petroleum-800 dark:bg-petroleum-900/40">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-petroleum-900/60">
                {r.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{r.title}</h3>
              <p className="mt-2 flex-grow text-sm text-slate-500 dark:text-petroleum-400">
                {r.desc}
              </p>
              <div className="mt-8 border-t border-slate-50 pt-4 dark:border-petroleum-800">
                <Button variant="outline" size="sm" className="w-full">Gerar Relatório</Button>
              </div>
           </div>
         ))}
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-br from-petroleum-900 to-slate-900 p-8 text-white shadow-xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-2xl font-bold">Automação de Relatórios</h2>
            <p className="mt-3 text-petroleum-300">
              Nossa inteligência analisa o mercado para fornecer insights sobre as variações de preços dos últimos 12 meses, ajudando no planejamento orçamentário.
            </p>
          </div>
          <Button variant="primary" className="h-12 bg-white text-petroleum-900 hover:bg-slate-100 dark:bg-petroleum-500 dark:text-white">
            <TrendingUp size={18} className="mr-2" />
            Ver Insights de Mercado
          </Button>
        </div>
      </div>
    </div>
  );
}
