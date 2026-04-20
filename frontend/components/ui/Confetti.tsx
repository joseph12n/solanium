'use client';

import { useEffect, useState } from 'react';

/**
 * Confetti — Partículas que caen al completar una acción exitosa.
 * Se muestra brevemente y se auto-limpia del DOM.
 */
interface ConfettiProps {
  /** Activar la animación. Se auto-desactiva tras ~1.5s */
  active: boolean;
  /** Cantidad de partículas */
  count?: number;
}

const COLORS = ['#7c5cff', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#eab308'];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function Confetti({ active, count = 24 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    size: number;
    rotation: number;
  }>>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: randomBetween(10, 90),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: randomBetween(0, 0.4),
      size: randomBetween(4, 8),
      rotation: randomBetween(0, 360),
    }));
    setParticles(newParticles);

    // Auto-limpieza después de la animación
    const timer = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(timer);
  }, [active, count]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.size > 6 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
