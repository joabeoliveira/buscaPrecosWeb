'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Building, 
  Plus, 
  Search,
  MoreVertical,
  Mail,
  Phone,
  ArrowUpRight
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock initial clients
  const [clients] = useState([
    { id: '1', name: 'Secretaria de Saúde', document: '12.345.678/0001-90', email: 'saude@prefeitura.gov.br', phone: '(11) 9999-8888' },
    { id: '2', name: 'Almoxarifado Central', document: '98.765.432/0001-10', email: 'almox@prefeitura.gov.br', phone: '(11) 8888-7777' },
  ]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document.includes(searchTerm)
  );

  return (
    <div className="p-8">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl text-slate-900 dark:text-white sm:text-4xl">Clientes Interassados</h1>
          <p className="mt-2 text-slate-500 dark:text-petroleum-400 text-slate-500 dark:text-petroleum-400">Gerencie as entidades que solicitam cotações.</p>
        </div>
        <Button>
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
              <p className="mt-1 text-sm text-slate-500 dark:text-petroleum-400">{client.document}</p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-petroleum-300">
                  <Mail size={16} className="text-slate-400" />
                  {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-petroleum-300">
                  <Phone size={16} className="text-slate-400" />
                  {client.phone}
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
    </div>
  );
}
