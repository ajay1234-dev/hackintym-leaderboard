'use client';

import { useEffect, useState, useRef } from 'react';
import { playScoreSound, playScoreDeductSound } from '@/lib/soundManager';

interface AnimatedScoreProps {
  value: number;
  className?: string;
  isRolling?: boolean;
}

export default function AnimatedScore({ value, className = '', isRolling = false }: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const isFirstRender = useRef(true);

  // Rolling effect (Casino-style reveal)
  useEffect(() => {
    if (isRolling) {
      const randomizeInterval = setInterval(() => {
        // Random number between 0 and 9999
        setDisplayValue(Math.floor(Math.random() * 9999));
      }, 50); // fast flicker
      
      return () => clearInterval(randomizeInterval);
    } else if (!isFirstRender.current) {
        setDisplayValue(value); // Snap to final value when rolling finishes
    }
  }, [isRolling]);

  useEffect(() => {
    // Prevent animation on initial mount
    if (isFirstRender.current) {
       setDisplayValue(value);
       isFirstRender.current = false;
       return;
    }

    if (displayValue === value || isRolling) return;
    
    if (value < displayValue) {
       playScoreDeductSound();
    } else {
       playScoreSound();
    }
    
    const startValue = displayValue;
    const endValue = value;
    const difference = endValue - startValue;
    
    // Max duration ~600ms. 
    // With 30ms ticks, that means exactly 20 ticks.
    const totalTicks = 20; 
    const tickIntervalMs = 30;
    
    let stepAmount = Math.round(difference / totalTicks);
    // Ensure we step by at least 1
    if (stepAmount === 0) stepAmount = difference > 0 ? 1 : -1;

    const interval = setInterval(() => {
      setDisplayValue(prev => {
        if ((stepAmount > 0 && prev + stepAmount >= endValue) ||
            (stepAmount < 0 && prev + stepAmount <= endValue)) {
          clearInterval(interval);
          return endValue;
        }
        return prev + stepAmount;
      });
    }, tickIntervalMs);

    return () => clearInterval(interval);
  // We intentionally do not list displayValue in dependencies to avoid restarting the effect loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={`${className} ${isRolling ? 'blur-[1px] opacity-80' : ''} transition-[filter] duration-300`}>
      {displayValue}
    </span>
  );
}
