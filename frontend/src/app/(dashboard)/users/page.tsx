'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Plus, Trash2, ShieldCheck, Search, RefreshCw, Key, Shield, UserCog, Ghost } from 'lucide-react';
import Button from '@/components/ui/Button';
import { shoppingApi } from '@/services/api';

interface Responsible {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const roleMap: Record<string, { label: string, color: string, icon: any }> = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ShieldCheck },
  helper: { label: 'Auxiliar', color: 'bg-petroleum-100 text-petroleum-700 dark:bg-petroleum-800 dark:text-petroleum-400', icon: UserCog },
  auditor: { label: 'Auditor', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: Shield },
  user: { label: 'Usuário', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: User },
};

export default function UsersPage() {
  const [users, setUsers] = useState<Responsible[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'helper' });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await shoppingApi.listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    setIsCreating(true);
    try {
      await shoppingApi.createUser(newUser.name, newUser.email, newUser.role);
      setNewUser({ name: '', email: '', role: 'helper' });
      await fetchUsers();
    } catch (error) {
      alert('Erro ao criar usuário.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    try {
      await shoppingApi.deleteUser(id);
      await fetchUsers();
    } catch (error) {
      alert('Erro ao excluir usuário.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Gestão de Equipe & Acesso</h1>
        <p className="mt-2 text-slate-500 dark:text-petroleum-400">Cadastre usuários e defina quem pode realizar as cotações e auditorias.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Formulário de Cadastro */}
        <div className="lg:col-span-4">
          <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-petroleum-800 dark:bg-petroleum-900/30">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Plus size={20} className="text-petroleum-500" />
              Novo Usuário
            </h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
               <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Nome do membro da equipe"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="exemplo@empresa.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-petroleum-400">Nível de Acesso</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white appearance-none"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="admin">Administrador (Tudo)</option>
                    <option value="helper">Auxiliar de Cotação (Opera)</option>
                    <option value="auditor">Auditor (Apenas Visualiza)</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" isLoading={isCreating}>
                Criar Conta
              </Button>
            </form>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="lg:col-span-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="relative grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou e-mail..." 
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm focus:border-petroleum-500 focus:ring-4 focus:ring-petroleum-500/10 dark:border-petroleum-800 dark:bg-petroleum-900/50 dark:text-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw size={16} />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              <div className="col-span-full py-20 text-center text-slate-400">Carregando usuários...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const roleInfo = roleMap[user.role] || roleMap.user;
                const RoleIcon = roleInfo.icon;
                
                return (
                  <div key={user.id} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-petroleum-800 dark:bg-petroleum-900/40">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${roleInfo.color}`}>
                        <RoleIcon size={24} />
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all dark:hover:bg-red-900/20"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-slate-900 dark:text-white">{user.name}</h3>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-petroleum-400 mt-1">
                        <Mail size={12} /> {user.email}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4 dark:border-petroleum-800">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleInfo.color}`}>
                         {roleInfo.label}
                       </span>
                       <span className="text-[10px] text-slate-400">{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center gap-4">
                <Ghost size={48} className="text-slate-200" />
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
