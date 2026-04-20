'use client';

import { useRef, useState } from 'react';

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
}

/**
 * SpotlightCard — from ReactBits (reactbits.dev)
 * Card con spotlight radial que sigue al cursor del mouse.
 * Uso: módulos del dashboard, cards de features.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(110, 86, 207, 0.15)',
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => { setIsFocused(true); setOpacity(0.6); }}
      onBlur={() => { setIsFocused(false); setOpacity(0); }}
      onMouseEnter={() => setOpacity(0.6)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative rounded-2xl overflow-hidden bezel ${className}`}
    >
      {/* Spotlight gradient following cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ease-out-expo"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {/* Card content with Double-Bezel inner */}
      <div className="bezel-inner p-5 relative z-0">
        {children}
      </div>
    </div>
  );
}
