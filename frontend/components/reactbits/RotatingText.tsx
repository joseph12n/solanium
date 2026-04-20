'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

interface RotatingTextProps {
  texts: string[];
  transition?: Transition;
  rotationInterval?: number;
  staggerDuration?: number;
  mainClassName?: string;
  elementLevelClassName?: string;
}

/**
 * RotatingText — from ReactBits (reactbits.dev)
 * Texto que rota entre opciones con spring animation por letra.
 * Uso: hero de bienvenida mostrando rubros.
 */
const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: 'spring', damping: 25, stiffness: 300 },
      rotationInterval = 2500,
      staggerDuration = 0.02,
      mainClassName,
      elementLevelClassName,
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);

    const elements = useMemo(() => {
      const currentText = texts[currentTextIndex];
      const words = currentText.split(' ');
      return words.map((word, i) => ({
        characters: Array.from(word),
        needsSpace: i !== words.length - 1,
      }));
    }, [texts, currentTextIndex]);

    const getStaggerDelay = useCallback(
      (index: number, totalChars: number) => {
        return index * staggerDuration;
      },
      [staggerDuration]
    );

    const next = useCallback(() => {
      setCurrentTextIndex((prev) =>
        prev === texts.length - 1 ? 0 : prev + 1
      );
    }, [texts.length]);

    const previous = useCallback(() => {
      setCurrentTextIndex((prev) =>
        prev === 0 ? texts.length - 1 : prev - 1
      );
    }, [texts.length]);

    const jumpTo = useCallback(
      (index: number) => {
        setCurrentTextIndex(Math.max(0, Math.min(index, texts.length - 1)));
      },
      [texts.length]
    );

    const reset = useCallback(() => setCurrentTextIndex(0), []);

    useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [
      next,
      previous,
      jumpTo,
      reset,
    ]);

    useEffect(() => {
      const intervalId = setInterval(next, rotationInterval);
      return () => clearInterval(intervalId);
    }, [next, rotationInterval]);

    return (
      <motion.span
        className={`inline-flex flex-wrap whitespace-pre-wrap relative ${mainClassName || ''}`}
        layout
        transition={transition}
      >
        <span className="sr-only">{texts[currentTextIndex]}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentTextIndex}
            className="inline-flex flex-wrap whitespace-pre-wrap relative"
            layout
            aria-hidden="true"
          >
            {elements.map((wordObj, wordIndex, array) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum, word) => sum + word.characters.length, 0);
              const totalChars = array.reduce(
                (sum, word) => sum + word.characters.length,
                0
              );
              return (
                <span key={wordIndex} className="inline-flex">
                  {wordObj.characters.map((char, charIndex) => (
                    <motion.span
                      key={charIndex}
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '-120%', opacity: 0 }}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(
                          previousCharsCount + charIndex,
                          totalChars
                        ),
                      }}
                      className={`inline-block ${elementLevelClassName || ''}`}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wordObj.needsSpace && (
                    <span className="whitespace-pre"> </span>
                  )}
                </span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    );
  }
);

RotatingText.displayName = 'RotatingText';
export default RotatingText;
