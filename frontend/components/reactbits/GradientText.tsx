'use client';

import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

/**
 * GradientText — from ReactBits (reactbits.dev)
 * Texto con gradiente animado que rota colores.
 * Uso: logo "Solanium", títulos hero, branding.
 */
export default function GradientText({
  children,
  className = '',
  colors = ['#6e56cf', '#0a9d7f', '#22d3ee', '#6e56cf'],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const animationDuration = animationSpeed * 1000;

  useAnimationFrame((time) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    const fullCycle = animationDuration * 2;
    const cycleTime = elapsedRef.current % fullCycle;
    if (cycleTime < animationDuration) {
      progress.set((cycleTime / animationDuration) * 100);
    } else {
      progress.set(100 - ((cycleTime - animationDuration) / animationDuration) * 100);
    }
  });

  const backgroundPosition = useTransform(progress, (p) => `${p}% 50%`);
  const gradientColors = [...colors, colors[0]].join(', ');
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${gradientColors})`,
    backgroundSize: '300% 100%',
    backgroundRepeat: 'repeat' as const,
  };

  return (
    <motion.span
      className={`inline-flex items-center justify-center font-medium overflow-hidden ${showBorder ? 'py-1 px-2 rounded-2xl' : ''} ${className}`}
    >
      {showBorder && (
        <motion.span
          className="absolute inset-0 z-0 pointer-events-none rounded-2xl"
          style={{ ...gradientStyle, backgroundPosition }}
        >
          <span
            className="absolute rounded-2xl z-[-1]"
            style={{
              background: 'rgb(var(--surface-base))',
              width: 'calc(100% - 2px)',
              height: 'calc(100% - 2px)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </motion.span>
      )}
      <motion.span
        className="inline-block relative z-[2] text-transparent bg-clip-text"
        style={{
          ...gradientStyle,
          backgroundPosition,
          WebkitBackgroundClip: 'text',
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}
