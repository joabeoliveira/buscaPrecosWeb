import React from 'react';
import { Tag, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatmatMatchResult } from '@/services/api';

interface CatmatSuggestionProps {
  result: CatmatMatchResult;
  className?: string;
}

const confidenceConfig = {
  high: {
    icon: CheckCircle2,
    label: 'Alta confiança',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  medium: {
    icon: AlertCircle,
    label: 'Média confiança',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  low: {
    icon: HelpCircle,
    label: 'Baixa confiança',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  },
};

const CatmatSuggestion: React.FC<CatmatSuggestionProps> = ({ result, className }) => {
  if (!result.bestMatch) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs text-slate-400 italic', className)}>
        <HelpCircle size={12} />
        CATMAT não identificado
      </span>
    );
  }

  const config = confidenceConfig[result.confidence];

  return (
    <div className={cn('inline-flex flex-col gap-0.5', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
          config.badgeClass,
        )}
        title={result.justification}
      >
        <Tag size={11} />
        <span className="font-bold tracking-wide">{result.bestMatch.codigo}</span>
        <span className="mx-0.5 text-current/50">·</span>
        <span className="max-w-[180px] truncate">{result.bestMatch.descricao}</span>
        {result.bestMatch.unidade && (
          <span className="ml-0.5 opacity-70">/ {result.bestMatch.unidade}</span>
        )}
        <span className={cn('ml-1 h-1.5 w-1.5 rounded-full', config.dotClass)} aria-label={config.label} />
      </div>
    </div>
  );
};

export default CatmatSuggestion;
