'use client';

import { motion } from 'framer-motion';
import type { Product, TipoNegocio } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import DecryptedText from '@/components/reactbits/DecryptedText';

const EASE = [0.23, 1, 0.32, 1] as const;

function renderMetadataHighlights(tipo: TipoNegocio, meta: Record<string, any>) {
  switch (tipo) {
    case 'carniceria':
      return [
        meta.unidad_medida && `${meta.unidad_medida}`,
        meta.requiere_refrigeracion ? 'Refrigerado' : null,
        meta.corte,
      ].filter(Boolean) as string[];
    case 'electronica':
      return [meta.marca, meta.modelo, meta.garantia_meses ? `${meta.garantia_meses} m garantía` : null].filter(Boolean) as string[];
    case 'papeleria':
      return [meta.presentacion, meta.marca, meta.color].filter(Boolean) as string[];
    default:
      return [];
  }
}

export function ProductCard({
  product,
  tipoNegocio,
  index,
}: {
  product: Product;
  tipoNegocio: TipoNegocio;
  index: number;
}) {
  const highlights = renderMetadataHighlights(tipoNegocio, product.metadata || {});

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
      whileHover={{ y: -2 }}
      className="rounded-2xl p-[1px] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-white/[0.04]"
    >
      <div className="rounded-[calc(1rem-1px)] bg-surface-card p-5 flex flex-col gap-3"
        style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04), 0 4px 20px -4px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] text-ink-600 font-mono uppercase tracking-wider">
              <DecryptedText text={product.sku} animateOn="view" speed={35} maxIterations={5} className="text-ink-400" encryptedClassName="text-accent-light/50" />
            </div>
            <h3 className="text-base font-medium tracking-tight mt-0.5">{product.nombre}</h3>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tracking-tight">
              {formatCurrency(Number(product.precio))}
            </div>
            <div className="text-[10px] text-ink-600 mt-0.5">
              Stock: {Number(product.stock)} {product.unidad}
            </div>
          </div>
        </div>

        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2.5 border-t border-white/[0.04]">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-ink-400 font-medium"
              >
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
