'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ManualInput from '@/components/list/ManualInput';
import FileUploader from '@/components/list/FileUploader';
import ListPreview from '@/components/list/ListPreview';
import { shoppingApi } from '@/services/api';
import { LayoutGrid, Type, FileUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function App() {
  const router = useRouter();
  const [items, setItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [isCreating, setIsCreating] = useState(false);

  const addItems = (newItems: string[]) => {
    setItems((prev) => {
      const combined = [...prev, ...newItems];
      // Basic deduplication
      return Array.from(new Set(combined));
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartSearch = async () => {
    if (items.length === 0) return;

    setIsCreating(true);
    try {
      // Create list
      const listName = `Cotação ${new Date().toLocaleDateString()}`;
      const list = await shoppingApi.createList(listName, items);
      
      // Navigate to results page to manage individual/batch quotations
      router.push(`/app/lists/${list.id}`);
    } catch (error) {
      console.error('Falha ao iniciar busca:', error);
      alert('Erro ao iniciar busca. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-petroleum-100 px-3 py-1 text-sm font-semibold text-petroleum-700 dark:bg-petroleum-900/50 dark:text-petroleum-400">
          <Sparkles size={16} />
          <span>Compare preços em segundos</span>
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          Sua lista de compras, <br />
          <span className="text-petroleum-600 dark:text-petroleum-400">otimizada ao máximo.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
          Adicione até 100 produtos e deixe que nossa IA encontre o menor preço para você.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <div className="flex gap-2 rounded-2xl bg-white p-1 shadow-sm dark:bg-petroleum-900/40">
            <button
              onClick={() => setActiveTab('manual')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                activeTab === 'manual' 
                  ? "bg-petroleum-900 text-white shadow-md dark:bg-petroleum-500" 
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-petroleum-800"
              )}
            >
              <Type size={18} />
              Manual
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                activeTab === 'upload' 
                  ? "bg-petroleum-900 text-white shadow-md dark:bg-petroleum-500" 
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-petroleum-800"
              )}
            >
              <FileUp size={18} />
              Upload TXT/CSV
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-petroleum-900/40">
            {activeTab === 'manual' ? (
              <ManualInput onAdd={addItems} />
            ) : (
              <FileUploader onAdd={addItems} />
            )}
          </div>
        </div>

        {/* Right Column: Preview */}
        <div>
          <ListPreview 
            items={items} 
            onRemove={removeItem} 
            onClear={() => setItems([])}
            onStartSearch={handleStartSearch}
            isSearching={isCreating}
            buttonText="Gerar Painel de Cotação →"
          />
          
          {items.length === 0 && (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-petroleum-800">
              <LayoutGrid size={48} className="text-slate-200 dark:text-petroleum-800" />
              <p className="mt-4 text-slate-500 dark:text-slate-400">
                Sua lista está vazia. Adicione produtos ao lado para começar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
