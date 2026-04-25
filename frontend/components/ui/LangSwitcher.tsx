'use client';

import { motion } from 'framer-motion';

import { useLanguage, type Lang } from '@/lib/language-context';

/**
 * LangSwitcher — pill segmentado ES/EN con indicador animado.
 */
export function LangSwitcher() {
  const { lang, setLang } = useLanguage();

  const options: Lang[] = ['es', 'en'];

  return (
    <div
      className="relative flex items-center rounded-full border text-[11px] font-medium"
      style={{
        borderColor: 'var(--border-default)',
        background: 'rgb(var(--surface-raised) / 0.6)',
      }}
    >
      {options.map((opt) => {
        const active = lang === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setLang(opt)}
            aria-pressed={active}
            className="relative z-10 px-3 py-1.5 uppercase tracking-widest transition-colors"
            style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {opt}
            {active && (
              <motion.span
                layoutId="lang-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-0 -z-10 rounded-full"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(110,86,207,0.18), rgba(16,185,129,0.15))',
                  boxShadow: 'inset 0 0 0 1px var(--border-hover)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
