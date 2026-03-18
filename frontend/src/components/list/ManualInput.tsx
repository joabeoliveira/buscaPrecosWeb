'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Plus, Package, Hash, Layers } from 'lucide-react';
import { ListItemInput } from '@/services/api';

interface ManualInputProps {
  onAdd: (items: ListItemInput[]) => void;
}

const UNITS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'fr', label: 'Frasco (fr)' },
  { value: 'gl', label: 'Galão (gl)' },
  { value: 'ro', label: 'Rolo (ro)' },
  { value: 'ma', label: 'Maço (ma)' },
  { value: 'par', label: 'Par (par)' },
  { value: 'm2', label: 'Metro Quadrado (m2)' },
  { value: 'm3', label: 'Metro Cúbico (m3)' },
];

const ManualInput: React.FC<ManualInputProps> = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    query: '',
    unit: 'un',
    quantity: 1,
  });

  const handleAdd = () => {
    if (!formData.query.trim()) return;
    
    onAdd([{
      query: formData.query.trim(),
      unit: formData.unit,
      quantity: formData.quantity,
    }]);
    
    setFormData({
      query: '',
      unit: 'un',
      quantity: 1,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {/* Item Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Nome do Produto / Descrição Técnica *</label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              name="query"
              type="text" 
              placeholder="Ex: Resma de Papel A4 75g"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
              value={formData.query}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Unidade</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                name="unit"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white appearance-none"
                value={formData.unit}
                onChange={handleChange}
              >
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Quantidade</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                name="quantity"
                type="number" 
                min="0.01"
                step="0.01"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleAdd} disabled={!formData.query.trim()} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          Adicionar na Lista
        </Button>
      </div>
    </div>
  );
};

export default ManualInput;
