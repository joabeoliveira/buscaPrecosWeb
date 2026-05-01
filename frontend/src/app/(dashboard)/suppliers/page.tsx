'use client';

import React, { useState, useEffect } from 'react';
import { shoppingApi, Supplier } from '@/services/api';
import { 
  Handshake, Plus, Pencil, Trash2, Package, ExternalLink,
  Truck, CheckCircle, XCircle, Globe, ChevronDown, Search, Filter
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

function ScoreDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i < score
              ? score >= 8 ? 'bg-emerald-400' : score >= 5 ? 'bg-amber-400' : 'bg-rose-400'
              : 'bg-slate-300 dark:bg-slate-600'
          }`}
        />
      ))}
      <span className="ml-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">{score}/10</span>
    </div>
  );
}

const INPUT_CLS = "h-10 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-petroleum-500 focus:ring-2 focus:ring-petroleum-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 dark:focus:border-petroleum-400";
const LABEL_CLS = "block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

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
    } catch {
      alert('Erro ao remover parceiro.');
    }
  };

  const filtered = suppliers.filter(s => {
    const matchCat = !filterCategory || s.category === filterCategory;
    const matchSearch = !filterSearch || s.name.toLowerCase().includes(filterSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-8 max-w-full">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-petroleum-600 text-white">
              <Handshake size={22} />
            </span>
            Parceiros de Fornecimento
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {suppliers.length} parceiros cadastrados — usados nas buscas via n8n
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 shrink-0">
          <Plus size={18} /> Novo Parceiro
        </Button>
      </div>

      {/* Filters */}
      {suppliers.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar parceiro..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-4 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:border-petroleum-500 focus:ring-2 focus:ring-petroleum-500/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="h-9 appearance-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-8 text-sm text-slate-800 dark:text-white focus:border-petroleum-500 focus:ring-2 focus:ring-petroleum-500/20"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>
          {(filterSearch || filterCategory) && (
            <button
              onClick={() => { setFilterSearch(''); setFilterCategory(''); }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Parceiro' : 'Novo Parceiro'}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 p-3 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Nome *</label>
                  <input type="text" placeholder="Ex: Kalunga" className={INPUT_CLS}
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                {/* URL */}
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>URL / Site *</label>
                  <input type="url" placeholder="https://www.kalunga.com.br" className={INPUT_CLS}
                    value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                </div>

                {/* Categoria */}
                <div>
                  <label className={LABEL_CLS}>Categoria *</label>
                  <div className="relative">
                    <select
                      className={INPUT_CLS + " appearance-none pr-10"}
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>

                {/* Prazo */}
                <div>
                  <label className={LABEL_CLS}>Prazo Médio (dias)</label>
                  <input type="number" min={0} placeholder="Ex: 3" className={INPUT_CLS}
                    value={form.avg_delivery_days ?? ''}
                    onChange={e => setForm(f => ({ ...f, avg_delivery_days: e.target.value ? parseInt(e.target.value) : null }))} />
                </div>

                {/* Score */}
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>
                    Score de Confiabilidade: <span className="text-petroleum-600 dark:text-petroleum-400 normal-case">{form.score}/10</span>
                  </label>
                  <input type="range" min={1} max={10} value={form.score}
                    onChange={e => setForm(f => ({ ...f, score: parseInt(e.target.value) }))}
                    className="w-full accent-petroleum-600" />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <span>1 — Baixo</span><span>5 — Médio</span><span>10 — Excelente</span>
                  </div>
                </div>

                {/* Frete */}
                <div>
                  <label className={LABEL_CLS}>Frete Grátis</label>
                  <div className="flex items-center gap-3 h-10">
                    <button type="button" onClick={() => setForm(f => ({ ...f, free_shipping: !f.free_shipping }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${form.free_shipping ? 'bg-petroleum-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.free_shipping ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{form.free_shipping ? 'Sim' : 'Não'}</span>
                  </div>
                </div>

                {/* Min frete */}
                {form.free_shipping && (
                  <div>
                    <label className={LABEL_CLS}>Mínimo p/ Frete Grátis (R$)</label>
                    <input type="number" min={0} step="0.01" placeholder="Ex: 150.00" className={INPUT_CLS}
                      value={form.min_free_shipping ?? ''}
                      onChange={e => setForm(f => ({ ...f, min_free_shipping: e.target.value ? parseFloat(e.target.value) : null }))} />
                  </div>
                )}

                {/* Ativo */}
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Status</label>
                  <div className="flex items-center gap-3 h-10">
                    <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{form.is_active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Observações</label>
                  <textarea rows={3} placeholder="Informações adicionais sobre este parceiro..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-petroleum-500 focus:ring-2 focus:ring-petroleum-500/20 resize-none"
                    value={form.notes ?? ''}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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
        <div className="flex h-48 items-center justify-center text-slate-500 dark:text-slate-400">
          Carregando parceiros...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
          <Handshake size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
            Nenhum parceiro cadastrado ainda. Clique em <strong>Novo Parceiro</strong> para começar.
          </p>
        </div>
      ) : (
        <>
          {filtered.length === 0 && (
            <div className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Nenhum parceiro encontrado com esses filtros.
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Parceiro</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Categoria</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Score</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Entrega</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 text-center">Frete</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 text-center">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-petroleum-600 dark:text-petroleum-400 hover:underline mt-0.5">
                        <Globe size={10} />{new URL(s.url).hostname}
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <Package size={10} />
                        {s.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ScoreDots score={s.score} />
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {s.avg_delivery_days ? (
                        <span className="flex items-center gap-1">
                          <Truck size={12} className="text-slate-500 dark:text-slate-400" />
                          {s.avg_delivery_days} dias
                        </span>
                      ) : <span className="text-slate-400 dark:text-slate-500">—</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {s.free_shipping ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle size={12} /> Grátis
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle size={10} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          <XCircle size={10} /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)}
                          className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-petroleum-700 dark:hover:text-petroleum-300 transition-colors"
                          title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(s.id, s.name)}
                          className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Remover">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-5 py-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                Mostrando {filtered.length} de {suppliers.length} parceiros
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
