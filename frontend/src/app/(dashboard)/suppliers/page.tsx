'use client';

import React, { useState, useEffect } from 'react';
import { shoppingApi, Supplier } from '@/services/api';
import { 
  Handshake, Plus, Pencil, Trash2, Star, Package, ExternalLink,
  Truck, CheckCircle, XCircle, Globe, ChevronDown
} from 'lucide-react';
import Button from '@/components/ui/Button';

const CATEGORIES = [
  'Informática',
  'Papelaria e Escritório',
  'Toners, Cartuchos e Tintas',
  'Limpeza e Descartáveis',
  'EPI - Equipamentos de Proteção Individual',
  'Segurança Eletrônica',
  'Refrigeração e Climatização',
  'Eletrodomésticos',
  'Eletrônicos',
  'Mobiliário e Decoração',
  'Uniformes e Vestuário',
  'Material de Construção',
  'Alimentos e Bebidas',
  'Outros',
];

const EMPTY_FORM: Omit<Supplier, 'id'> = {
  name: '',
  url: '',
  category: CATEGORIES[0],
  is_active: true,
  free_shipping: false,
  min_free_shipping: null,
  score: 7,
  avg_delivery_days: null,
  notes: null,
};

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < score ? 'bg-amber-400' : 'bg-slate-200 dark:bg-petroleum-700'}`}
        />
      ))}
      <span className="ml-1 text-[10px] font-bold text-slate-500">{score}/10</span>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      const data = await shoppingApi.listSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Erro ao carregar parceiros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (s: Supplier) => {
    setForm({
      name: s.name,
      url: s.url,
      category: s.category,
      is_active: s.is_active,
      free_shipping: s.free_shipping,
      min_free_shipping: s.min_free_shipping,
      score: s.score,
      avg_delivery_days: s.avg_delivery_days,
      notes: s.notes,
    });
    setEditingId(s.id);
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.url || !form.category) {
      setError('Nome, URL e Categoria são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await shoppingApi.updateSupplier(editingId, form);
      } else {
        await shoppingApi.createSupplier(form);
      }
      setShowForm(false);
      fetchSuppliers();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao salvar parceiro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o parceiro "${name}"?`)) return;
    try {
      await shoppingApi.deleteSupplier(id);
      fetchSuppliers();
    } catch (err) {
      alert('Erro ao remover parceiro.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Handshake size={32} className="text-petroleum-500" />
            Parceiros de Fornecimento
          </h1>
          <p className="mt-1 text-slate-500 dark:text-petroleum-400">
            Cadastre os fornecedores parceiros para busca de preços via web scraping (n8n).
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 shrink-0">
          <Plus size={18} /> Novo Parceiro
        </Button>
      </div>

      {/* Modal / Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-petroleum-700 dark:bg-petroleum-950 overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-petroleum-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Parceiro' : 'Novo Parceiro'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Nome */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Nome *</label>
                  <input
                    type="text"
                    placeholder="Ex: Kalunga"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                {/* URL */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">URL / Site *</label>
                  <input
                    type="url"
                    placeholder="https://www.kalunga.com.br"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  />
                </div>

                {/* Categoria */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Categoria *</label>
                  <div className="relative">
                    <select
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>

                {/* Prazo de Entrega */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Prazo Médio (dias)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 3"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={form.avg_delivery_days ?? ''}
                    onChange={e => setForm(f => ({ ...f, avg_delivery_days: e.target.value ? parseInt(e.target.value) : null }))}
                  />
                </div>

                {/* Score */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">
                    Score de Confiabilidade: <span className="text-petroleum-600 dark:text-petroleum-400">{form.score}/10</span>
                  </label>
                  <input
                    type="range" min={1} max={10}
                    value={form.score}
                    onChange={e => setForm(f => ({ ...f, score: parseInt(e.target.value) }))}
                    className="w-full accent-petroleum-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 — Baixo</span><span>5 — Médio</span><span>10 — Excelente</span>
                  </div>
                </div>

                {/* Frete Grátis */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Frete Grátis</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, free_shipping: !f.free_shipping }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${form.free_shipping ? 'bg-petroleum-600' : 'bg-slate-300 dark:bg-petroleum-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.free_shipping ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{form.free_shipping ? 'Sim' : 'Não'}</span>
                  </div>
                </div>

                {/* Valor Mínimo Frete Grátis */}
                {form.free_shipping && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Mínimo p/ Frete Grátis (R$)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Ex: 150.00"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                      value={form.min_free_shipping ?? ''}
                      onChange={e => setForm(f => ({ ...f, min_free_shipping: e.target.value ? parseFloat(e.target.value) : null }))}
                    />
                  </div>
                )}

                {/* Ativo */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Status</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-petroleum-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{form.is_active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Observações</label>
                  <textarea
                    rows={3}
                    placeholder="Informações adicionais sobre este parceiro..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white resize-none"
                    value={form.notes ?? ''}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-slate-100 dark:border-petroleum-800">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-petroleum-800 transition-colors"
              >
                Cancelar
              </button>
              <Button onClick={handleSave} isLoading={saving}>
                {editingId ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-slate-400">Carregando parceiros...</div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-petroleum-800">
          <Handshake size={40} className="text-slate-200 dark:text-petroleum-700 mb-3" />
          <p className="text-slate-500 dark:text-petroleum-400 text-center max-w-sm">
            Nenhum parceiro cadastrado ainda. Clique em <strong>Novo Parceiro</strong> para começar.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-petroleum-800 bg-white dark:bg-petroleum-900/20 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-petroleum-900/50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Parceiro</th>
                <th className="px-5 py-3 font-semibold">Categoria</th>
                <th className="px-5 py-3 font-semibold">Score</th>
                <th className="px-5 py-3 font-semibold">Entrega</th>
                <th className="px-5 py-3 font-semibold text-center">Frete</th>
                <th className="px-5 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-petroleum-800">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-petroleum-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white">{s.name}</div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-petroleum-500 hover:underline mt-0.5">
                      <Globe size={10} />{new URL(s.url).hostname}
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-petroleum-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-petroleum-300">
                      <Package size={10} />
                      {s.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <ScoreStars score={s.score} />
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {s.avg_delivery_days ? (
                      <span className="flex items-center gap-1">
                        <Truck size={12} /> {s.avg_delivery_days} dias
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {s.free_shipping ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={12} /> Grátis
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {s.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle size={10} /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-petroleum-800 dark:text-petroleum-400">
                        <XCircle size={10} /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-petroleum-600 dark:hover:bg-petroleum-800 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
