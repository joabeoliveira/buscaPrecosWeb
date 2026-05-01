'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface SystemAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AlertDropdown() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts');
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await axios.post(`/api/alerts/${id}/read`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    for (const alert of alerts) {
      await markAsRead(alert.id);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'price_opportunity':
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'system_error':
        return <AlertTriangle className="text-red-500" size={18} />;
      default:
        return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 dark:text-petroleum-300 dark:hover:bg-petroleum-900/40"
      >
        <Bell size={20} />
        {alerts.length > 0 && (
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-full bottom-0 z-50 ml-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-petroleum-800 dark:bg-petroleum-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-petroleum-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notificações</h3>
              {alerts.length > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-petroleum-500 hover:text-petroleum-600 dark:text-petroleum-400"
                >
                  Marcar todas lidas
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto p-2">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-petroleum-400">
                  Nenhuma notificação nova
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="mb-2 flex gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-petroleum-800"
                  >
                    <div className="mt-1 flex-shrink-0">{getIcon(alert.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
                        {alert.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-petroleum-300">
                        {alert.message}
                      </p>
                      <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-wider">
                        {new Date(alert.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button 
                      onClick={() => markAsRead(alert.id)}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-petroleum-700 dark:hover:text-white"
                      title="Marcar como lida"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
