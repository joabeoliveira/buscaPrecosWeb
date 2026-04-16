'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  Plus, 
  Search,
  MoreVertical,
  Mail,
  Phone,
  ArrowUpRight,
  X,
  FileText
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { shoppingApi } from '@/services/api';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: ''
  });

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await shoppingApi.listClients();
      setClients(data);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSaving(true);
    try {
      await shoppingApi.createClient(formData);
      setIsModalOpen(false);
      setFormData({ name: '', document: '', email: '', phone: '' });
      fetchClients();
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      alert('Erro ao salvar cliente. Verifique os dados e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.document && c.document.includes(searchTerm))
  );

  return (
    <div className="p-8">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl text-slate-900 dark:text-white sm:text-4xl">Clientes Interessados</h1>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400">Gerencie as entidades que solicitam cotações.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          className="h-12 w-full max-w-md rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/40 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-petroleum-500 border-t-transparent"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-petroleum-800">
          <Users size={40} className="text-slate-300 mb-4" />
          <p className="text-slate-500">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div key={client.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-petroleum-800 dark:bg-petroleum-900/40">
              <div className="p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-petroleum-100 text-petroleum-600 dark:bg-petroleum-900/60">
                    <Building size={24} />
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-petroleum-800">
                    <MoreVertical size={20} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{client.name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-petroleum-400">{client.document || 'Sem documento'}</p>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-petroleum-300">
                    <Mail size={16} className="text-slate-400" />
                    {client.email || '—'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-petroleum-300">
                    <Phone size={16} className="text-slate-400" />
                    {client.phone || '—'}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-petroleum-800 dark:bg-petroleum-900/20">
                <button className="flex w-full items-center justify-center gap-2 text-sm font-bold text-petroleum-600 dark:text-petroleum-400">
                  Ver Histórico de Cotações
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Novo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-petroleum-900 animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Novo Cliente</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-petroleum-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Nome / Razão Social *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-950 dark:text-white"
                    placeholder="Ex: Secretaria de Saúde"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">CNPJ / CPF</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-950 dark:text-white"
                    placeholder="00.000.000/0001-00"
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-950 dark:text-white"
                      placeholder="seu@contato.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-950 dark:text-white"
                      placeholder="(00) 0000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-petroleum-800 dark:text-petroleum-400 dark:hover:bg-petroleum-800"
                >
                  Cancelar
                </button>
                <Button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
