import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/lib/session-context';
import { ThemeProvider } from '@/lib/theme-context';
import { LanguageProvider } from '@/lib/language-context';
import { LayoutShell } from '@/components/LayoutShell';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Solanium — Facturación Universal',
  description:
    'Sistema SaaS de facturación multi-rubro con onboarding por token, branding personalizado y plantillas vibrantes.',
};

// Anti-FOUC: aplicar tema ANTES de React hidrate para evitar flash.
const ANTI_FOUC_SCRIPT = `
(function(){try{
  var t = localStorage.getItem('solanium.theme');
  if (t === 'light') document.documentElement.classList.add('light');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <LanguageProvider>
            <SessionProvider>
              <LayoutShell>{children}</LayoutShell>
            </SessionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
