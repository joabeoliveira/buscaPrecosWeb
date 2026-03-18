import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BuscaPrecosWeb | Comparação Inteligente de Preços',
  description: 'Encontre os melhores preços em centenas de lojas simultaneamente. Suba sua lista de produtos e economize em segundos.',
};

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-inter antialiased bg-slate-50 dark:bg-petroleum-950 text-slate-900 dark:text-slate-50 transition-colors">
        <AuthProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
