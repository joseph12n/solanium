'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: 'view' | 'hover';
}

/**
 * DecryptedText — from ReactBits (reactbits.dev)
 * Efecto de descifrado/scramble al hover o al entrar en viewport.
 * Uso: números de factura, SKUs, datos monospace.
 */
export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableChars = useMemo(() => characters.split(''), [characters]);

  const shuffleText = useCallback(
    (originalText: string) => {
      return originalText
        .split('')
        .map((char) => {
          if (char === ' ') return ' ';
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join('');
    },
    [availableChars]
  );

  const triggerDecrypt = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      setDisplayText(shuffleText(text));
      iteration++;
      if (iteration >= maxIterations) {
        clearInterval(intervalRef.current ?? undefined);
        setDisplayText(text);
        setIsAnimating(false);
        setHasAnimated(true);
      }
    }, speed);
  }, [isAnimating, text, speed, maxIterations, shuffleText]);

  const resetText = useCallback(() => {
    clearInterval(intervalRef.current ?? undefined);
    setIsAnimating(false);
    setDisplayText(text);
  }, [text]);

  // IntersectionObserver for 'view' mode
  useEffect(() => {
    if (animateOn !== 'view') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            triggerDecrypt();
          }
        });
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [animateOn, hasAnimated, triggerDecrypt]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current ?? undefined);
  }, []);

  const hoverProps =
    animateOn === 'hover'
      ? { onMouseEnter: triggerDecrypt, onMouseLeave: resetText }
      : {};

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block whitespace-pre-wrap ${parentClassName}`}
      {...hoverProps}
    >
      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const isRevealed = !isAnimating || displayText === text;
          return (
            <span key={index} className={isRevealed ? className : encryptedClassName || 'opacity-60'}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
