'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  animateBy?: 'words' | 'characters';
}

/**
 * BlurText — inspirado en ReactBits (reactbits.dev)
 * Texto que emerge de un blur, letra por letra o palabra por palabra.
 * Uso: subtítulos de secciones, descripciones.
 */
export default function BlurText({
  text,
  className = '',
  delay = 0.04,
  animateBy = 'words',
}: BlurTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {elements.map((segment, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 4 }}
          animate={
            isInView
              ? { opacity: 1, filter: 'blur(0px)', y: 0 }
              : { opacity: 0, filter: 'blur(8px)', y: 4 }
          }
          transition={{
            duration: 0.4,
            delay: index * delay,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="inline-block"
        >
          {segment}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </span>
  );
}
