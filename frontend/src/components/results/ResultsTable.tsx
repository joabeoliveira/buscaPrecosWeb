'use client';

import React, { useState } from 'react';
import { ExternalLink, ShoppingCart, Info, Store, CheckCircle, XCircle, RefreshCw, ZoomIn, Search, Play, LayoutList } from 'lucide-react';
import PriceBadge from '@/components/ui/PriceBadge';
import CatmatSuggestion from '@/components/catmat/CatmatSuggestion';
import { ListResult, shoppingApi, ProductResult, SearchJobResponse, CatmatMatchResult } from '@/services/api';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface ResultsTableProps {
  results: ListResult[];
  catmatSuggestions?: Record<string, CatmatMatchResult>;
  onAction?: () => void;
  onIndividualSearch?: (jobId: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, catmatSuggestions, onAction, onIndividualSearch }) => {
  const [analyzingItem, setAnalyzingItem] = useState<ListResult | null>(null);
  const [localSearching, setLocalSearching] = useState<string | null>(null);

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
      const { jobId } = await shoppingApi.startSearch(listId, itemId);
      if (onIndividualSearch) onIndividualSearch(jobId);
    } catch (error) {
       console.error('Erro ao iniciar busca individual:', error);
       alert('Erro ao iniciar busca para este item.');
    } finally {
       setLocalSearching(null);
    }
  };

  const getResultsArray = (originalQuery: string, rawResponse: any): ProductResult[] => {
    try {
      if (!rawResponse) return [];
      const items: ProductResult[] = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
      
      const queryTerms = originalQuery.toLowerCase()
        .replace(/[-]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);

      return [...items].map(p => {
        const titleLower = p.title.toLowerCase();
        let score = 0;
        queryTerms.forEach(term => {
          if (titleLower.includes(term)) score += 10;
          if (term.length > 3 && titleLower.startsWith(term)) score += 5; // Bonus for starting with term
        });
        return { ...p, _score: score };
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
                const isSearching = localSearching === result.id;
                
                return (
                  <tr 
                    key={result.id} 
                    className={cn(
                      "group transition-all duration-200",
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
                             {isPending ? 'Não pesquisado' : isFound ? `${options.length} resultados encontrados` : 'Buscando...'}
                          </span>
                          {catmatSuggestions?.[result.id] && (
                            <div className="mt-1.5">
                              <CatmatSuggestion result={catmatSuggestions[result.id]} />
                            </div>
                          )}
                        </div>
                      </div>
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
                        <div className="max-w-xs">
                          <p className="line-clamp-1 text-slate-700 dark:text-slate-300 font-medium">
                            {result.best_product_title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                             <PriceBadge price={result.best_price} />
                             <span className="text-xs font-bold text-petroleum-600 dark:text-petroleum-400 uppercase">{result.best_store}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      {isPending ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSingleSearch(result.id, result.shopping_list_id)}
                          isLoading={isSearching}
                          className="gap-2 border-petroleum-200 text-petroleum-700 hover:bg-petroleum-50 dark:border-petroleum-800 dark:text-petroleum-400"
                        >
                          <Play size={14} />
                          <span>Cotar agora</span>
                        </Button>
                      ) : isFound ? (
                        <Button
                          variant={result.is_approved ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => setAnalyzingItem(result)}
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
                <p className="text-slate-500">Verificando resultados para: <span className="font-bold text-petroleum-600 dark:text-petroleum-400">"{analyzingItem.original_query}"</span></p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAnalyzingItem(null)}>
                Fechar
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Selecione o produto correto para aprovar:</p>
              
              {getResultsArray(analyzingItem.original_query, analyzingItem.raw_response).map((product, idx) => (
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
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-petroleum-600 dark:text-petroleum-400 font-bold uppercase">
                        <Store size={14} />
                        <span>{product.source}</span>
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
  if (status === 'error') return <XCircle size={20} className="text-rose-500" />;
  return <RefreshCw size={20} className="animate-spin text-petroleum-400" />;
}

export default ResultsTable;
