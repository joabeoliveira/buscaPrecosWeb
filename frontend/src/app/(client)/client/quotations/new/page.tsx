'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, FileUp, Sparkles, Type } from 'lucide-react';
import Button from '@/components/ui/Button';
import ClientManualInput from '@/components/list/ClientManualInput';
import FileUploader from '@/components/list/FileUploader';
import ListPreview from '@/components/list/ListPreview';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ItemCategory, ListItemInput, shoppingApi } from '@/services/api';

export default function ClientNewQuotationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<ListItemInput[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [name, setName] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.client_id) return;
    shoppingApi.listClientCategories(user.client_id)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [user?.client_id]);

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Informe um nome para a solicitacao.');
      return;
    }
    if (items.length === 0) {
      setError('Adicione pelo menos um item.');
      return;
    }

    setIsCreating(true);
    try {
      const quotation = await shoppingApi.createList(
        name.trim(),
        items,
        user?.client_id || null,
        null,
        internalCode.trim() || null
      );
      router.push(`/client/quotations/${quotation.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Nao foi possivel criar a solicitacao.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Link href="/client/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-petroleum-600 dark:text-slate-400 dark:hover:text-petroleum-400">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Nova solicitação de cotação</h2>
        <p className="mt-2 text-slate-500 dark:text-petroleum-400">Informe os itens que deseja cotar. A equipe da Infore acompanhara a pesquisa de mercado.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-petroleum-800 dark:bg-petroleum-900/30">
            <div className="mb-5 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <FileText size={20} className="text-petroleum-600 dark:text-petroleum-400" />
              Dados da solicitação
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Nome da cotação *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Materiais de escritorio - Maio"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Codigo interno ou observacao</label>
                <input
                  type="text"
                  value={internalCode}
                  onChange={(event) => setInternalCode(event.target.value)}
                  placeholder="Ex: Pedido 1024"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-petroleum-800 dark:bg-petroleum-900/30">
            <div className="mb-5 flex gap-2 rounded-lg bg-slate-50 p-1 dark:bg-petroleum-900/50">
              <button
                onClick={() => setActiveTab('manual')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-all',
                  activeTab === 'manual'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-petroleum-800 dark:text-white'
                    : 'text-slate-500 hover:bg-white/50 dark:text-petroleum-400'
                )}
              >
                <Type size={18} />
                Manual e Excel
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-all',
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-petroleum-800 dark:text-white'
                    : 'text-slate-500 hover:bg-white/50 dark:text-petroleum-400'
                )}
              >
                <FileUp size={18} />
                Arquivo CSV/TXT
              </button>
            </div>

            {activeTab === 'manual' ? (
              <ClientManualInput categories={categories} onAdd={(newItems) => setItems(prev => [...prev, ...newItems])} />
            ) : (
              <FileUploader categories={categories} onAdd={(newItems) => setItems(prev => [...prev, ...newItems])} />
            )}
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-8">
            <ListPreview
              items={items}
              onRemove={(index) => setItems(prev => prev.filter((_, itemIndex) => itemIndex !== index))}
              onClear={() => setItems([])}
              onStartSearch={handleCreate}
              isSearching={isCreating}
              buttonText="Enviar solicitação"
            />
            {items.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center dark:border-petroleum-800">
                <Sparkles className="mx-auto text-slate-300 dark:text-petroleum-700" size={40} />
                <p className="mt-4 text-sm text-slate-500 dark:text-petroleum-400">Adicione itens manualmente ou cole linhas de uma planilha para montar sua solicitacao.</p>
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
