'use client';

import React from 'react';
import { Trash2, ListChecks, Hash, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ListItemInput } from '@/services/api';

interface ListPreviewProps {
  items: ListItemInput[];
  onRemove: (index: number) => void;
  onClear: () => void;
  onStartSearch: () => void;
  isSearching?: boolean;
  buttonText?: string;
}

const ListPreview: React.FC<ListPreviewProps> = ({ 
  items, 
  onRemove, 
  onClear, 
  onStartSearch,
  isSearching,
  buttonText = "Fazer Cotação Agora →"
}) => {
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-petroleum-800 dark:bg-petroleum-900/40">
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-petroleum-800">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
          <ListChecks size={20} className="text-petroleum-600 dark:text-petroleum-400" />
          <span>Itens na Lista ({items.length})</span>
        </div>
        <button 
          onClick={onClear}
          className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
        >
          Limpar Tudo
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-petroleum-900/20">
            <tr>
              <th className="px-4 py-2 font-semibold">Produto</th>
              <th className="px-4 py-2 font-semibold text-center">Un</th>
              <th className="px-4 py-2 font-semibold text-right">Qtd</th>
              <th className="w-10 px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-petroleum-800">
            {items.map((item, index) => (
              <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-petroleum-800/50">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                  {item.query}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-petroleum-800 dark:text-petroleum-400">
                    {item.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 dark:text-petroleum-300">
                  {item.quantity.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => onRemove(index)}
                    className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 p-4 dark:border-petroleum-800 bg-slate-50/30 dark:bg-petroleum-950/20">
        <Button 
          className="w-full py-6 text-base shadow-lg shadow-petroleum-500/10" 
          onClick={onStartSearch} 
          isLoading={isSearching}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default ListPreview;
