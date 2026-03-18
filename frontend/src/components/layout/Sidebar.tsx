'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart2, 
  ShieldCheck,
  FileText,
  LogOut,
  Users,
  Search,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
        active 
          ? "bg-petroleum-600 text-white shadow-lg shadow-petroleum-900/20 dark:bg-petroleum-500" 
          : "text-slate-500 hover:bg-slate-100 dark:text-petroleum-300 dark:hover:bg-petroleum-900/40"
      )}
    >
      <span className={cn(active ? "text-white" : "text-slate-400 dark:text-petroleum-400")}>
        {icon}
      </span>
      {label}
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userRole = user?.role || 'user'; 

  const menuItems = [
    { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['admin', 'helper', 'auditor', 'user'] },
    { href: '/quotations/new', icon: <PlusCircle size={20} />, label: 'Nova Cotação', roles: ['admin', 'helper'] },
    { href: '/clients', icon: <Users size={20} />, label: 'Clientes', roles: ['admin', 'helper', 'auditor'] },
    { href: '/users', icon: <UserCog size={20} />, label: 'Equipe', roles: ['admin'] },
    { href: '/reports', icon: <FileText size={20} />, label: 'Relatórios', roles: ['admin', 'helper', 'auditor'] },
    { href: '/audit', icon: <ShieldCheck size={20} />, label: 'Auditoria', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200 bg-white p-6 dark:border-petroleum-800 dark:bg-petroleum-950">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-petroleum-500 to-indigo-600 text-white shadow-md">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Busca<span className="text-petroleum-500">Preços</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-petroleum-500">
            Menu Principal
          </div>
          {filteredItems.map((item) => (
            <NavItem 
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </nav>

        {/* Footer / User Info */}
        <div className="mt-auto border-t border-slate-100 pt-6 dark:border-petroleum-900">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-petroleum-900/30">
            <div className="h-10 w-10 rounded-full bg-petroleum-100 flex items-center justify-center text-petroleum-700 font-bold dark:bg-petroleum-800 dark:text-petroleum-400">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-petroleum-400 uppercase font-bold tracking-tight">
                {userRole === 'admin' ? 'Administrador' : userRole === 'helper' ? 'Auxiliar' : userRole === 'auditor' ? 'Auditor' : 'Usuário'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
        </div>
      </div>
    </aside>
  );
}
