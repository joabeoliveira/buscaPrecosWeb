'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ProgressBar from '@/components/ui/ProgressBar';
import ResultsTable from '@/components/results/ResultsTable';
import Button from '@/components/ui/Button';
import { shoppingApi, ListResult } from '@/services/api';
import { ArrowLeft, RefreshCw, ShoppingBag, LayoutList, PlayCircle, Search, Building, Download, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ListResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = params.id as string;

  const [results, setResults] = useState<ListResult[]>([]);
  const [list, setList] = useState<any>(null);
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStartingSearch, setIsStartingSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'approved'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  const fetchResults = async () => {
    try {
      const resp = await shoppingApi.getQuotation(listId);
      setList(resp);
      const data = await shoppingApi.getResults(listId);
      if (mountedRef.current) {
        setResults(data);
        setLastUpdate(new Date());
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
      if (mountedRef.current) {
        setErrorMsg('Erro ao buscar resultados.');
      }
    }
  };

  const pollStatus = async (jobId: string) => {
    if (!mountedRef.current) return;

    try {
      const status = await shoppingApi.getSearchStatus(jobId);
      if (!mountedRef.current) return;

      setJob(status);

      if (status.processed_items > 0) {
        await fetchResults();
      }

      if (status.status === 'pending' || status.status === 'processing') {
        pollingRef.current = setTimeout(() => pollStatus(jobId), 2500);
      } else {
        await fetchResults();
      }
    } catch (err: any) {
      console.error('Error polling status:', err);
    }
  };

  const startBatchSearch = async () => {
    setIsStartingSearch(true);
    try {
      const { jobId } = await shoppingApi.startBatchSearch(listId);
      await pollStatus(jobId);
    } catch (error) {
      console.error('Failed to start search:', error);
      setErrorMsg('Não foi possível iniciar a cotação.');
    } finally {
      setIsStartingSearch(false);
    }
  };

  const handleIndividualSearchStarted = (jobId: string) => {
    pollStatus(jobId);
  }

  useEffect(() => {
    if (!listId) return;

    const init = async () => {
      setLoading(true);
      setErrorMsg(null);
      await fetchResults();
      
      if (mountedRef.current) {
        setLoading(false);
      }
    };

    init();
  }, [listId]);

  const approvedResults = results.filter(r => r.is_approved);
  const displayResults = activeTab === 'all' ? results : approvedResults;
  
  const hasStartedAnySearch = results.some(r => r.status !== 'pending') || !!job;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-petroleum-600 dark:text-slate-400 dark:hover:text-petroleum-400"
          >
            <ArrowLeft size={16} />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {list?.name || 'Painel de Cotação'}
            {list?.internal_code && <span className="ml-3 text-sm font-normal text-slate-400 dark:text-petroleum-600">({list.internal_code})</span>}
          </h1>
          {list?.client_name && (
            <p className="text-sm text-slate-500 dark:text-petroleum-400 flex items-center gap-2">
              <Building size={14} /> {list.client_name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-slate-500">Última atualização</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchResults}>
            <RefreshCw size={16} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => shoppingApi.exportQuotation(listId)}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800/40 dark:text-emerald-400"
          >
            <Download size={16} />
            Exportar Excel
          </Button>
          {!hasStartedAnySearch && results.length > 0 && (
            <Button size="sm" onClick={startBatchSearch} isLoading={isStartingSearch} className="bg-petroleum-600 hover:bg-petroleum-700 text-white">
               <PlayCircle size={18} className="mr-2" />
               Cotar Todos os Itens
            </Button>
          )}
        </div>
      </div>

      {!hasStartedAnySearch && !loading && (
        <div className="mb-8 rounded-2xl bg-petroleum-50 p-8 border border-petroleum-100 dark:bg-petroleum-900/20 dark:border-petroleum-800 text-center">
            <h2 className="text-xl font-bold text-petroleum-900 dark:text-petroleum-100 mb-2">Pronto para iniciar a cotação?</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
              Sua lista foi criada com sucesso. Clique no botão abaixo para buscar preços em tempo real para todos os itens ou use o botão de cotação individual na tabela.
            </p>
            <Button size="lg" onClick={startBatchSearch} isLoading={isStartingSearch} className="gap-2 px-8 py-6 text-lg shadow-xl shadow-petroleum-200 dark:shadow-none bg-petroleum-900 text-white dark:bg-petroleum-500">
                <Search size={24} />
                Iniciar Pesquisa de Preços (Todos)
            </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-petroleum-900/60 max-w-md">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
            activeTab === 'all' 
              ? "bg-white text-petroleum-900 shadow-sm dark:bg-petroleum-500 dark:text-white" 
              : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-petroleum-800"
          )}
        >
          <LayoutList size={18} />
          Lista de Produtos
          <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-petroleum-800">{results.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
            activeTab === 'approved' 
              ? "bg-white text-petroleum-900 shadow-sm dark:bg-petroleum-500 dark:text-white" 
              : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-petroleum-800"
          )}
        >
          <ShoppingBag size={18} />
          Itens Escolhidos
          <span className="ml-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs dark:bg-emerald-900/40 dark:text-emerald-400">{approvedResults.length}</span>
        </button>
      </div>

      {/* Progress Card */}
      {job && job.status !== 'completed' && job.status !== 'failed' && (
        <div className="mb-8 rounded-2xl bg-petroleum-900 p-6 text-white shadow-lg dark:bg-petroleum-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={20} className="animate-spin text-petroleum-400" />
              <span className="font-semibold">Buscando melhores preços...</span>
            </div>
            <span className="text-sm text-petroleum-300 uppercase tracking-widest font-bold">
              {job.processed_items} / {job.total_items} Itens
            </span>
          </div>
          <ProgressBar progress={job.progress} showLabel />
        </div>
      )}

      {/* Main Results */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-2xl border border-slate-200 bg-white dark:border-petroleum-800 dark:bg-petroleum-900/40">
           <RefreshCw size={48} className="animate-spin text-slate-200" />
           <p className="text-slate-500">Preparando painel...</p>
        </div>
      ) : displayResults.length > 0 ? (
        <ResultsTable results={displayResults} onAction={fetchResults} onIndividualSearch={handleIndividualSearchStarted} />
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-petroleum-800 dark:bg-petroleum-900/40">
           {activeTab === 'approved' ? (
             <>
               <ShoppingBag size={48} className="text-slate-200 dark:text-petroleum-800 mb-4" />
               <p className="text-slate-500">Nenhum item escolhido ainda. Analise os resultados para escolher o melhor produto.</p>
             </>
           ) : (
             <p className="text-slate-500">Sua lista está vazia.</p>
           )}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 text-center">
        <Clock size={16} />
        <span>Garantimos que você possa analisar cada resultado para escolher o produto correto com o melhor preço.</span>
      </div>
    </div>
  );
}
