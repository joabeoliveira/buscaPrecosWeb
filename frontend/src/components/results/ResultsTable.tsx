'use client';

import React, { useState } from 'react';
import { ExternalLink, Info, Store, CheckCircle, XCircle, RefreshCw, ZoomIn, Search, LayoutList, Play } from 'lucide-react';
import PriceBadge from '@/components/ui/PriceBadge';
import { ListResult, shoppingApi, ProductResult } from '@/services/api';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface ResultsTableProps {
  results: ListResult[];
  onAction?: () => void;
  onIndividualSearch?: (jobId: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, onAction, onIndividualSearch }) => {
  const [analyzingItem, setAnalyzingItem] = useState<ListResult | null>(null);
  const [localSearching, setLocalSearching] = useState<string | null>(null);
  const [analysisSortMode, setAnalysisSortMode] = useState<'priceAsc' | 'priceDesc' | 'relevanceThenPrice'>('priceAsc');

  if (results.length === 0) return null;

  const handleSelectProduct = async (itemId: string, product: ProductResult) => {
    try {
      await shoppingApi.selectProduct(itemId, product);
      setAnalyzingItem(null);
      if (onAction) onAction();
    } catch (error) {
      console.error('Erro ao selecionar produto:', error);
    }
  };

  const handleSingleSearch = async (itemId: string, listId: string) => {
    setLocalSearching(itemId);
    try {
      const { jobId } = await shoppingApi.startBatchSearch(listId, itemId);
      if (onIndividualSearch) onIndividualSearch(jobId);
    } catch (error) {
       console.error('Erro ao iniciar busca individual:', error);
       alert('Erro ao iniciar busca para este item.');
    } finally {
       setLocalSearching(null);
    }
  };

  const getResultsArray = (
    originalQuery: string,
    rawResponse: any,
    sortMode: 'relevanceThenPrice' | 'priceAsc' | 'priceDesc' = 'relevanceThenPrice'
  ): ProductResult[] => {
    try {
      if (!rawResponse) return [];
      const items: ProductResult[] = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

      if (sortMode === 'priceAsc') {
        return [...items].sort((a, b) => {
          const priceA = Number.isFinite(a.price) ? a.price : Number.POSITIVE_INFINITY;
          const priceB = Number.isFinite(b.price) ? b.price : Number.POSITIVE_INFINITY;
          return priceA - priceB;
        });
      }

      if (sortMode === 'priceDesc') {
        return [...items].sort((a, b) => {
          const priceA = Number.isFinite(a.price) ? a.price : Number.NEGATIVE_INFINITY;
          const priceB = Number.isFinite(b.price) ? b.price : Number.NEGATIVE_INFINITY;
          return priceB - priceA;
        });
      }
      
      const queryTerms = originalQuery.toLowerCase()
        .replace(/[-]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);

      return [...items].map(p => {
        const titleLower = p.title.toLowerCase();
        let score = 0;
        queryTerms.forEach(term => {
          if (titleLower.includes(term)) score += 10;
          if (term.length > 3 && titleLower.startsWith(term)) score += 5; 
        });
        return { ...p, _score: score } as any;
      }).sort((a: any, b: any) => {
        if (b._score !== a._score) return b._score - a._score;
        return a.price - b.price;
      });
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-petroleum-800 dark:bg-petroleum-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-petroleum-900/60 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Un</th>
                <th className="px-6 py-4 text-right">Qtd</th>
                <th className="px-6 py-4">Status da Cotação</th>
                <th className="px-6 py-4">Resultado Escolhido</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-petroleum-800">
              {results.map((result) => {
                const options = getResultsArray(result.original_query, result.raw_response);
                const isFound = result.status === 'found';
                const isPending = result.status === 'pending';
                const isNotFound = result.status === 'not_found';
                const isError = result.status === 'error';
                const isSearching = localSearching === result.id;
                
                return (
                  <tr 
                    key={result.id} 
                    className={cn(
                      "group transition-all duration-200 relative hover:z-10",
                      result.is_approved 
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20" 
                        : "hover:bg-petroleum-50/80 dark:hover:bg-petroleum-800/40"
                    )}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-petroleum-800 text-slate-400">
                           <LayoutIcon status={result.status} />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {result.original_query}
                          </span>
                          <span className="text-xs text-slate-400">
                             {isPending
                               ? 'Não pesquisado'
                               : isFound
                               ? `${options.length} resultados encontrados`
                               : isNotFound
                               ? 'Nenhum resultado encontrado'
                               : isError
                               ? 'Falha na busca'
                               : 'Buscando...'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                       <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-petroleum-800 dark:text-petroleum-400">
                          {result.unit || 'un'}
                       </span>
                    </td>

                    <td className="px-6 py-5 text-right font-mono text-sm text-slate-600 dark:text-petroleum-300">
                       {Number(result.quantity || 0).toLocaleString('pt-BR')}
                    </td>
                    
                    <td className="px-6 py-5">
                       {result.is_approved ? (
                         <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle size={16} />
                            <span>Cotado e Aprovado</span>
                         </div>
                       ) : isFound ? (
                         <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <Search size={16} />
                            <span>Análise Pendente</span>
                         </div>
                       ) : isNotFound ? (
                         <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300 font-semibold">
                            <Info size={16} />
                            <span>Sem resultados</span>
                         </div>
                       ) : isError ? (
                         <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                            <XCircle size={16} />
                            <span>Falha na busca</span>
                         </div>
                       ) : isPending ? (
                         <span className="text-slate-400 italic">Aguardando decisão</span>
                       ) : (
                         <div className="flex items-center gap-2 text-petroleum-500">
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Buscando...</span>
                         </div>
                       )}
                    </td>

                    <td className="px-6 py-5">
                      {result.is_approved && result.best_product_title ? (
                        <div className="flex items-center gap-3">
                          {result.thumbnail_url && (
                            <div className="relative h-12 w-12 flex-shrink-0 bg-white dark:bg-petroleum-800 rounded-lg border border-slate-100 dark:border-petroleum-700 p-1 group/thumb">
                              <img 
                                src={result.thumbnail_url} 
                                alt="" 
                                className="h-full w-full object-contain transition-all duration-300 
                                           group-hover/thumb:scale-[4] group-hover/thumb:translate-x-[50%] group-hover/thumb:z-[100] 
                                           relative rounded-lg cursor-zoom-in shadow-sm dark:shadow-none"
                              />
                            </div>
                          )}
                          <div className="max-w-[12rem] overflow-hidden">
                            <p className="line-clamp-1 text-slate-700 dark:text-slate-300 font-medium text-xs">
                              {result.best_product_title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                               <PriceBadge price={result.best_price} />
                               <span className="text-[10px] font-bold text-petroleum-500 uppercase truncate max-w-[50px]">{result.best_store}</span>
                               {result.best_product_link && (
                                 <a 
                                   href={result.best_product_link} 
                                   target="_blank" 
                                   className="ml-auto text-slate-400 hover:text-petroleum-600 transition-colors"
                                   title="Abrir no site original"
                                 >
                                   <ExternalLink size={12} />
                                 </a>
                               )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      {isPending || isNotFound || isError ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSingleSearch(result.id, result.shopping_list_id)}
                          isLoading={isSearching}
                          className="gap-2 border-petroleum-200 text-petroleum-700 hover:bg-petroleum-50 dark:border-petroleum-800 dark:text-petroleum-400"
                        >
                          <Play size={14} />
                          <span>{isPending ? 'Cotar agora' : 'Tentar novamente'}</span>
                        </Button>
                      ) : isFound ? (
                        <Button
                          variant={result.is_approved ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => {
                            setAnalysisSortMode('priceAsc');
                            setAnalyzingItem(result);
                          }}
                          className="gap-2"
                        >
                          <ZoomIn size={16} />
                          <span>{result.is_approved ? 'Revisar' : 'Analisar Resultados'}</span>
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Overlay/Modal */}
      {analyzingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl bg-white p-8 shadow-2xl dark:bg-petroleum-950 overflow-y-auto">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Analisar Cotação</h2>
                <p className="text-slate-500">
                  Item: <span className="font-bold text-petroleum-600 dark:text-petroleum-400">"{analyzingItem.original_query}"</span>
                  <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-petroleum-800 dark:text-petroleum-400">
                    {analyzingItem.unit}
                  </span>
                  <span className="ml-2 font-mono text-xs">Qtd: {analyzingItem.quantity}</span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAnalyzingItem(null)}>
                Fechar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Selecione o produto correto para aprovar:</p>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ordenar por
                  <select
                    value={analysisSortMode}
                    onChange={(e) => setAnalysisSortMode(e.target.value as 'priceAsc' | 'priceDesc' | 'relevanceThenPrice')}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-petroleum-500 dark:border-petroleum-700 dark:bg-petroleum-900 dark:text-slate-200"
                  >
                    <option value="priceAsc">Menor preco</option>
                    <option value="priceDesc">Maior preco</option>
                    <option value="relevanceThenPrice">Relevancia</option>
                  </select>
                </label>
              </div>
              
              {getResultsArray(analyzingItem.original_query, analyzingItem.raw_response, analysisSortMode).map((product, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "group relative flex gap-4 rounded-xl border p-4 transition-all hover:shadow-md",
                    "border-slate-100 bg-white dark:border-petroleum-800 dark:bg-petroleum-900",
                    analyzingItem.best_product_link === product.link && "ring-2 ring-emerald-500 border-emerald-500"
                  )}
                >
                  <div className="relative h-24 w-24 flex-shrink-0 rounded-lg bg-slate-50 p-2 dark:bg-petroleum-950 shadow-inner">
                    <img 
                      src={product.thumbnail || ''} 
                      alt={product.title} 
                      className="h-full w-full object-contain transition-all duration-300 hover:scale-[3.5] hover:z-[60] relative cursor-zoom-in" 
                    />
                  </div>
                  
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="line-clamp-2 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                          {product.title}
                        </h3>
                        <PriceBadge price={product.price} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {product.snippet}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-petroleum-600 dark:text-petroleum-400 font-bold uppercase">
                        <Store size={14} />
                        <span>{product.store}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {product.link && (
                           <a 
                             href={product.link} 
                             target="_blank" 
                             className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-petroleum-800"
                           >
                             <ExternalLink size={16} />
                           </a>
                         )}
                         <Button 
                           size="sm" 
                           onClick={() => handleSelectProduct(analyzingItem.id, product)}
                           className={analyzingItem.best_product_link === product.link ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                         >
                           {analyzingItem.best_product_link === product.link ? 'Escolhido' : 'Escolher este'}
                         </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LayoutIcon = ({ status }: { status: string }) => {
  if (status === 'pending') return <LayoutList size={20} />;
  if (status === 'found') return <CheckCircle size={20} className="text-emerald-500" />;
  if (status === 'not_found') return <Info size={20} className="text-slate-500" />;
  if (status === 'error') return <XCircle size={20} className="text-rose-500" />;
  return <RefreshCw size={20} className="animate-spin text-petroleum-400" />;
}

export default ResultsTable;
