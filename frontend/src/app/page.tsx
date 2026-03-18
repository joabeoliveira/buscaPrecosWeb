'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ShoppingBag, ArrowRight, ShieldCheck, Zap, BarChart3, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white px-4 pt-16 pb-32 dark:bg-petroleum-950 sm:pt-24 sm:pb-48">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-1/4 h-[500px] w-[500px] rounded-full bg-petroleum-100/50 blur-3xl dark:bg-petroleum-900/20" />
        <div className="absolute bottom-0 -right-1/4 h-[500px] w-[500px] rounded-full bg-slate-100 blur-3xl dark:bg-slate-900/20" />

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-petroleum-200 bg-petroleum-50 px-4 py-1.5 text-sm font-semibold text-petroleum-700 dark:border-petroleum-800 dark:bg-petroleum-900/30 dark:text-petroleum-400">
            <Zap size={16} />
            <span>Busca Inteligente de Preços</span>
          </div>
          
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-7xl">
            Pare de perder dinheiro <br />
            <span className="bg-gradient-to-r from-petroleum-600 to-indigo-600 bg-clip-text text-transparent dark:from-petroleum-400 dark:to-indigo-400">
              em cada compra online.
            </span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-xl text-slate-600 dark:text-slate-400">
            Suba sua lista de produtos e encontre os menores preços em centenas de lojas simultaneamente usando nossa tecnologia de busca em lote.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-lg">
                Começar agora gratuitamente
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <p className="text-sm font-medium text-slate-500">
              Sem necessidade de cadastro para testar.
            </p>
          </div>

          {/* Simple Stats/Trust */}
          <div className="mt-20 grid grid-cols-2 gap-8 border-t border-slate-100 pt-16 dark:border-petroleum-900 sm:grid-cols-4">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">100%</p>
              <p className="mt-1 text-sm text-slate-500">Automatizado</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">100+</p>
              <p className="mt-1 text-sm text-slate-500">Produtos por lista</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">3s</p>
              <p className="mt-1 text-sm text-slate-500">Busca rápida</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">0</p>
              <p className="mt-1 text-sm text-slate-500">Cadastro obrigatório</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-24 dark:bg-petroleum-900/20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Como o Busca Preços funciona</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Eficiência e economia em 3 passos simples.</p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Importe sua lista',
                desc: 'Suba um arquivo TXT, CSV ou apenas cole seus produtos um por linha.',
                icon: <FileUp size={24} />,
              },
              {
                title: 'Robôs em Ação',
                desc: 'Nossa tecnologia varre o Google Shopping atrás das melhores ofertas em tempo real.',
                icon: <Search size={24} />,
              },
              {
                title: 'Economize Agora',
                desc: 'Veja os menores preços organizados em uma tabela e clique para comprar direto na loja.',
                icon: <ShoppingBag size={24} />,
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-3xl bg-white p-8 shadow-sm transition-all hover:shadow-md dark:bg-petroleum-900/40">
                <div className="mb-6 inline-flex rounded-2xl bg-petroleum-100 p-4 text-petroleum-900 dark:bg-petroleum-800 dark:text-petroleum-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{feature.title}</h3>
                <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-petroleum-950 px-4 py-24 text-center text-white">
        <h2 className="text-4xl font-bold">Pronto para economizar?</h2>
        <p className="mx-auto mt-6 max-w-xl text-petroleum-300">
          Não gaste horas abrindo abas. Resolva sua lista de compras em segundos.
        </p>
        <div className="mt-10">
          <Link href="/dashboard">
            <Button variant="primary" size="lg" className="bg-white text-petroleum-900 hover:bg-slate-100">
              Ir para o Aplicativo
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const FileUp = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
