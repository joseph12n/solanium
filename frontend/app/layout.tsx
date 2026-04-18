import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TenantProvider } from '@/lib/tenant-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Solanium — Facturación Universal',
  description: 'Sistema de facturación multi-rubro basado en metadatos dinámicos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen">
        <TenantProvider>{children}</TenantProvider>
      </body>
    </html>
  );
}
