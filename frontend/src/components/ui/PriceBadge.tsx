import React from 'react';
import { cn } from '@/lib/utils';

interface PriceBadgeProps {
  price: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PriceBadge: React.FC<PriceBadgeProps> = ({ price, className, size = 'md' }) => {
  const sizes = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-lg px-3 py-1',
    lg: 'text-2xl px-4 py-2 font-bold',
  };

  if (price === null) {
    return (
      <span className={cn('inline-flex items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500', sizes[size], className)}>
        Indisponível
      </span>
    );
  }

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);

  return (
    <span className={cn('inline-flex items-center rounded-lg font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', sizes[size], className)}>
      {formattedPrice}
    </span>
  );
};

export default PriceBadge;
