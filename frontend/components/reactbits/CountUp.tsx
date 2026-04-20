'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

/**
 * CountUp — inspirado en ReactBits
 * Animación de conteo numérico al entrar en viewport.
 * Uso: StatCards del dashboard, totales de facturación.
 */
export default function CountUp({
  from = 0,
  to,
  duration = 1.2,
  className = '',
  formatter,
}: CountUpProps) {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const diff = to - from;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = from + diff * eased;
      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(to);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, from, to, duration]);

  const display = formatter ? formatter(value) : Math.round(value).toString();

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {display}
    </span>
  );
}
