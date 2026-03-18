'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function AuditPage() {
  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Auditoria do Sistema</h1>
        <p className="mt-2 text-slate-500 dark:text-petroleum-400">Rastreabilidade completa de ações e alterações de preços.</p>
      </div>
      
      <div className="flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed border-slate-200 dark:border-petroleum-800 bg-white dark:bg-petroleum-900/10 text-center">
        <div className="rounded-full bg-slate-50 p-6 dark:bg-petroleum-900/30 mb-6">
          <ShieldAlert size={64} className="text-slate-300 dark:text-petroleum-800" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Módulo em Desenvolvimento</h2>
        <p className="max-w-md text-slate-500 dark:text-petroleum-500 mt-2">
          Este módulo está sendo preparado para registrar e exibir logs em tempo real de todas as cotações, 
          acessos e análises manuais realizadas pela equipe.
        </p>
      </div>
    </div>
  );
}
