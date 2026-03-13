import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className, showLabel = false }) => {
  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-petroleum-800">
        <motion.div
          className="h-full bg-gradient-to-r from-petroleum-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Processando...</span>
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
