/**
 * Idle Timer Hook
 * 120 секунд хөдөлгөөнгүй бол screensaver идэвхжнэ
 */
'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // milliseconds
  onIdle: () => void;
  onActive: () => void;
}

export function useIdleTimer({ timeout, onIdle, onActive }: UseIdleTimerOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef(false);

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If was idle, trigger onActive
    if (isIdleRef.current) {
      isIdleRef.current = false;
      setIsIdle(false);
      onActive();
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      isIdleRef.current = true;
      setIsIdle(true);
      onIdle();
    }, timeout);
  }, [timeout, onIdle, onActive]);

  useEffect(() => {
    // Events to listen for
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'keyup',
      'touchstart',
      'touchmove',
      'touchend',
      'scroll',
      'wheel',
      'click',
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start initial timer - defer to avoid synchronous setState in effect
    const initialTimeout = setTimeout(() => {
      if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          isIdleRef.current = true;
          setIsIdle(true);
          onIdle();
        }, timeout);
      }
    }, 0);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer, timeout, onIdle]);

  return { isIdle };
}
