'use client';

import React, { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import { AlertCircle, ClipboardList, Hash, Layers, Package, Plus, Tag } from 'lucide-react';
import { ItemCategory, ListItemInput } from '@/services/api';

interface ClientManualInputProps {
  categories: ItemCategory[];
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
  { value: 'gl', label: 'Galao (gl)' },
  { value: 'ro', label: 'Rolo (ro)' },
  { value: 'par', label: 'Par (par)' },
  { value: 'm2', label: 'Metro Quadrado (m2)' },
  { value: 'm3', label: 'Metro Cubico (m3)' },
];

const normalizeText = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const parseBrazilianNumber = (value: string, fallback = 1) => {
  const clean = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(clean);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBrazilianMoney = (value: string) => {
  const clean = value.replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(clean);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function ClientManualInput({ categories, onAdd }: ClientManualInputProps) {
  const [formData, setFormData] = useState({
    query: '',
    unit: 'un',
    quantity: 1,
    category_id: '',
    sku_grade: '',
    target_price: '',
  });
  const [pasteText, setPasteText] = useState('');
  const [pasteWarning, setPasteWarning] = useState<string | null>(null);

  const categoriesByName = useMemo(() => {
    const map = new Map<string, ItemCategory>();
    categories.forEach(category => map.set(normalizeText(category.name), category));
    return map;
  }, [categories]);

  const getSelectedCategoryName = (categoryId: string) =>
    categories.find(category => category.id === categoryId)?.name || null;

  const resetForm = () => {
    setFormData({
      query: '',
      unit: 'un',
      quantity: 1,
      category_id: '',
      sku_grade: '',
      target_price: '',
    });
  };

  const handleAdd = () => {
    if (!formData.query.trim()) return;

    const targetPrice = formData.target_price ? parseBrazilianMoney(formData.target_price) : null;
    onAdd([{
      query: formData.query.trim(),
      unit: formData.unit,
      quantity: formData.quantity,
      category_id: formData.category_id || null,
      category_name: getSelectedCategoryName(formData.category_id),
      sku_grade: formData.sku_grade.trim() || null,
      target_price: targetPrice,
    }]);
    resetForm();
  };

  const handlePasteImport = () => {
    setPasteWarning(null);
    const missingCategories = new Set<string>();

    const parsed = pasteText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [query = '', unit = 'un', quantity = '1', categoryName = '', skuGrade = '', targetPrice = ''] = line.split('\t');
        if (!query.trim()) return null;

        const category = categoryName.trim() ? categoriesByName.get(normalizeText(categoryName)) : null;
        if (categoryName.trim() && !category) missingCategories.add(categoryName.trim());

        return {
          query: query.trim(),
          unit: unit.trim().toLowerCase() || 'un',
          quantity: parseBrazilianNumber(quantity),
          category_id: category?.id || null,
          category_name: category?.name || null,
          sku_grade: skuGrade.trim() || null,
          target_price: targetPrice.trim() ? parseBrazilianMoney(targetPrice) : null,
        };
      })
      .filter(Boolean) as ListItemInput[];

    if (parsed.length === 0) return;
    if (missingCategories.size > 0) {
      setPasteWarning(`Categorias nao encontradas: ${Array.from(missingCategories).join(', ')}. Os itens foram adicionados sem categoria.`);
    }

    onAdd(parsed);
    setPasteText('');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Produto / descricao tecnica *</label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="query"
              type="text"
              placeholder="Ex: Papel A4 75g branco"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
              value={formData.query}
              onChange={(event) => setFormData(prev => ({ ...prev, query: event.target.value }))}
              onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Unidade</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                value={formData.unit}
                onChange={(event) => setFormData(prev => ({ ...prev, unit: event.target.value }))}
              >
                {UNITS.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Quantidade</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                value={formData.quantity}
                onChange={(event) => setFormData(prev => ({ ...prev, quantity: Number.parseFloat(event.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Categoria</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                value={formData.category_id}
                onChange={(event) => setFormData(prev => ({ ...prev, category_id: event.target.value }))}
              >
                <option value="">Sem categoria</option>
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Grade / especificacao</label>
            <input
              type="text"
              placeholder="Ex: caixa com 10 unidades"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
              value={formData.sku_grade}
              onChange={(event) => setFormData(prev => ({ ...prev, sku_grade: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Preco alvo / referencia</label>
            <input
              type="text"
              placeholder="Ex: R$ 1.234,56"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
              value={formData.target_price}
              onChange={(event) => setFormData(prev => ({ ...prev, target_price: event.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleAdd} disabled={!formData.query.trim()} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          Adicionar item
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-petroleum-800 dark:bg-petroleum-900/30">
        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <ClipboardList size={18} className="text-petroleum-600 dark:text-petroleum-400" />
          Colar dados do Excel
        </div>
        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          onPaste={() => setPasteWarning(null)}
          placeholder={'produto\tunidade\tquantidade\tcategoria\tgrade\tpreco_alvo'}
          className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/50 p-3 font-mono text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-950 dark:text-white"
        />
        {pasteWarning && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{pasteWarning}</span>
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={handlePasteImport} disabled={!pasteText.trim()}>
            Importar linhas coladas
          </Button>
        </div>
      </div>
    </div>
  );
}
