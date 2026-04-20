'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

/**
 * SplitText — versión Framer Motion (sin GSAP)
 * Inspirado en ReactBits. Anima letra por letra al entrar en viewport.
 * Uso: títulos principales de cada página.
 */
export default function SplitText({
  text,
  className = '',
  delay = 0.03,
  tag: _tag = 'h1',
}: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const chars = text.split('');

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`} role="heading" aria-level={_tag === 'h1' ? 1 : _tag === 'h2' ? 2 : _tag === 'h3' ? 3 : undefined}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, rotateX: -40 }}
          animate={
            isInView
              ? { opacity: 1, y: 0, rotateX: 0 }
              : { opacity: 0, y: 30, rotateX: -40 }
          }
          transition={{
            duration: 0.5,
            delay: i * delay,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="inline-block"
          style={{ transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}
