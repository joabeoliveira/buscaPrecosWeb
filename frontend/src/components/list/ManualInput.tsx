'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

interface ManualInputProps {
  onAdd: (items: string[]) => void;
}

const ManualInput: React.FC<ManualInputProps> = ({ onAdd }) => {
  const [text, setText] = useState('');

  const handleAdd = () => {
    const items = text
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    
    if (items.length > 0) {
      onAdd(items);
      setText('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          className="min-h-[200px] w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-slate-900 transition-all focus:border-petroleum-500 focus:outline-none focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-slate-50 dark:focus:border-petroleum-400"
          placeholder="Digite um produto por linha...&#10;Exemplo:&#10;iPhone 15 Pro Max&#10;Notebook Dell XPS 13&#10;AirPods Pro 2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleAdd} disabled={!text.trim()}>
          Adicionar Produtos
        </Button>
      </div>
    </div>
  );
};

export default ManualInput;
