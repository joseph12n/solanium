'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps extends React.PropsWithChildren {
  className?: string;
  glowColor?: string;
}

/**
 * GlowCard — Double-Bezel Architecture con spotlight border.
 * Sigue al cursor con un gradiente radial que ilumina el borde.
 */
export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(110, 86, 207, 0.2)',
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`relative rounded-2xl p-[1px] ${className}`}
      style={{
        background: isHovered
          ? `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.02) 80%)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)',
      }}
    >
      {/* Inner core with Double-Bezel highlight */}
      <div
        className="rounded-[calc(1rem-1px)] bg-surface-card relative overflow-hidden"
        style={{
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 24px -4px rgba(0,0,0,0.35)`,
        }}
      >
        {/* Spotlight overlay */}
        {isHovered && (
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-40 transition-opacity duration-500"
            style={{
              background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 60%)`,
            }}
          />
        )}
        <div className="relative z-20 p-5">{children}</div>
      </div>
    </motion.div>
  );
}
