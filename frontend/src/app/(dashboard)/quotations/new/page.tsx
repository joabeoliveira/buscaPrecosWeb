'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManualInput from '@/components/list/ManualInput';
import FileUploader from '@/components/list/FileUploader';
import ListPreview from '@/components/list/ListPreview';
import { shoppingApi, ListItemInput } from '@/services/api';
import { 
  PlusCircle, 
  Type, 
  FileUp, 
  Sparkles, 
  Building, 
  User, 
  Hash,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function NewQuotationPage() {
  const router = useRouter();
  const [items, setItems] = useState<ListItemInput[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [isCreating, setIsCreating] = useState(false);
  const [team, setTeam] = useState<any[]>([]);
  
  const [quotationData, setQuotationData] = useState({
    name: '',
    internalCode: '',
    clientName: '',
    responsibleId: '', 
  });

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await shoppingApi.listUsers();
        setTeam(data);
        if (data.length > 0) {
          setQuotationData(prev => ({ ...prev, responsibleId: data[0].id }));
        }
      } catch (err) {
        console.error('Erro ao buscar equipe:', err);
      }
    };
    fetchTeam();
  }, []);

  const addItems = (newItems: ListItemInput[]) => {
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartSearch = async () => {
    if (items.length === 0) {
      alert('Adicione pelo menos um item para cotar.');
      return;
    }
    
    if (!quotationData.name) {
      alert('Por favor, dê um nome para esta cotação.');
      return;
    }

    setIsCreating(true);
    try {
      const list = await shoppingApi.createList(
        quotationData.name, 
        items,
        null, // clientId (could be improved later)
        quotationData.responsibleId || null,
        quotationData.internalCode
      );
      
      router.push(`/quotations/${list.id}`);
    } catch (error) {
      console.error('Falha ao criar cotação:', error);
      alert('Erro ao criar cotação. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuotationData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-8 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Nova Cotação Profissional</h1>
        <p className="mt-2 text-slate-500 dark:text-petroleum-400">Configure os dados do processo e adicione os itens para pesquisa.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-petroleum-800 dark:bg-petroleum-900/30">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <PlusCircle size={20} className="text-petroleum-500" />
              Dados do Processo
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Nome da Cotação *</label>
                <div className="relative">
                  <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="name"
                    type="text" 
                    placeholder="Ex: Cotação de Materiais - Março"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={quotationData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Código/Processo</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="internalCode"
                    type="text" 
                    placeholder="Ex: ARP 12/2024"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={quotationData.internalCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Interessado (Cliente)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="clientName"
                    type="text" 
                    placeholder="Nome da Secretaria ou Empresa"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={quotationData.clientName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Responsável *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    name="responsibleId"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white appearance-none"
                    value={quotationData.responsibleId}
                    onChange={handleInputChange}
                  >
                    <option value="">Selecione um responsável</option>
                    {team.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-petroleum-800 dark:bg-petroleum-900/30">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <PlusCircle size={20} className="text-indigo-500" />
              Itens da Cotação
            </h2>

            <div className="flex gap-2 rounded-2xl bg-slate-50 p-1 mb-6 dark:bg-petroleum-900/50">
              <button
                onClick={() => setActiveTab('manual')}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  activeTab === 'manual' 
                    ? "bg-white text-slate-900 shadow-sm dark:bg-petroleum-800 dark:text-white" 
                    : "text-slate-500 hover:bg-white/50 dark:text-petroleum-400"
                )}
              >
                <Type size={18} />
                Manual
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  activeTab === 'upload' 
                    ? "bg-white text-slate-900 shadow-sm dark:bg-petroleum-800 dark:text-white" 
                    : "text-slate-500 hover:bg-white/50 dark:text-petroleum-400"
                )}
              >
                <FileUp size={18} />
                Excel/CSV
              </button>
            </div>

            {activeTab === 'manual' ? (
              <ManualInput onAdd={addItems} />
            ) : (
              <FileUploader onAdd={addItems} />
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-8">
            <ListPreview 
              items={items} 
              onRemove={removeItem} 
              onClear={() => setItems([])}
              onStartSearch={handleStartSearch}
              isSearching={isCreating}
              buttonText="Criar e Iniciar Cotação"
            />
            {items.length === 0 && (
              <div className="mt-4 flex h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-petroleum-800 dark:bg-petroleum-900/10">
                <Sparkles size={40} className="text-slate-200 dark:text-petroleum-800" />
                <p className="mt-4 text-sm text-slate-500 dark:text-petroleum-400 leading-relaxed">
                  Adicione os itens técnicos acima ou faça upload de uma planilha para começar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
