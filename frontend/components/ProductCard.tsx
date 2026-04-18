'use client';

import { motion } from 'framer-motion';
import type { Product, TipoNegocio } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

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
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
      whileHover={{ y: -2 }}
      className="glass hairline hairline-hover rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-ink-500 font-mono uppercase tracking-wider">{product.sku}</div>
          <h3 className="text-lg font-medium tracking-tight mt-0.5">{product.nombre}</h3>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold tracking-tight">
            {formatCurrency(Number(product.precio))}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            Stock: {Number(product.stock)} {product.unidad}
          </div>
        </div>
      </div>

      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
          {highlights.map((h, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-ink-300"
            >
              {h}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}
