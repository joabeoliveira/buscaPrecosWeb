'use client';

import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListItemInput } from '@/services/api';

interface FileUploaderProps {
  onAdd: (items: ListItemInput[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onAdd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');

    if (!isTxt && !isCsv) {
      setError('Apenas arquivos .txt ou .csv são permitidos.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      let finalItems: ListItemInput[] = [];

      if (isCsv) {
        // Simple CSV parsing (header "produto", "unidade", "quantidade")
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          const headers = lines[0].toLowerCase().split(/[;,]/);
          const productIndex = headers.findIndex(h => h.includes('prod') || h.includes('item') || h.includes('desc'));
          const unitIndex = headers.findIndex(h => h.includes('un') || h.includes('medida'));
          const qtyIndex = headers.findIndex(h => h.includes('qtd') || h.includes('quant'));
          
          const dataLines = lines.slice(1);
          finalItems = dataLines.map(line => {
            const cols = line.split(/[;,]/);
            const query = cols[productIndex !== -1 ? productIndex : 0]?.trim();
            if (!query) return null;

            return {
              query,
              unit: (unitIndex !== -1 ? cols[unitIndex]?.trim().toLowerCase() : 'un') || 'un',
              quantity: (qtyIndex !== -1 ? parseFloat(cols[qtyIndex]?.replace(',', '.')) : 1) || 1,
            };
          }).filter(i => i !== null) as ListItemInput[];
        }
      } else {
        // TXT: one per line
        finalItems = content.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(query => ({ query, unit: 'un', quantity: 1 }));
      }

      if (finalItems.length > 100) {
        setError('Limite de 100 itens por arquivo excedido.');
        return;
      }

      if (finalItems.length === 0) {
        setError('Nenhum produto encontrado no arquivo.');
        return;
      }

      onAdd(finalItems);
    };

    reader.onerror = () => setError('Erro ao ler o arquivo.');
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all cursor-pointer",
          isDragging 
            ? "border-petroleum-500 bg-petroleum-50/50 dark:bg-petroleum-900/40" 
            : "border-slate-200 bg-white hover:border-petroleum-400 hover:bg-slate-50 dark:border-petroleum-800 dark:bg-petroleum-900/20 dark:hover:bg-petroleum-900/30"
        )}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept=".txt,.csv"
          className="hidden"
        />
        
        <div className="rounded-full bg-petroleum-100 p-4 text-petroleum-700 dark:bg-petroleum-900 dark:text-petroleum-400">
          <Upload size={32} />
        </div>
        
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
          Arraste seu arquivo aqui
        </h3>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Suporta .txt ou .csv (colunas: produto, unidade, quantidade)<br />
          Máximo de 100 itens por processo.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:text-rose-800">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
