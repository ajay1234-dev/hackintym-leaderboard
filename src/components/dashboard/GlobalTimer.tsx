'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { playHourPassedSound, playTickingSound, playTimeUpSound } from '@/lib/soundManager';

export default function GlobalTimer() {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [hasEnded, setHasEnded] = useState(false);
  
  // Track previous step to accurately detect crossed boundaries without exact-match failures
  const prevRemainingSeconds = useRef<number | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'globalState', 'timer'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().endTime) {
        setEndTime(docSnap.data().endTime);
        setDuration(docSnap.data().duration || null);
        setHasEnded(false); // Reset tracking if timer is restarted
        prevRemainingSeconds.current = null;
      } else {
        setEndTime(null);
        setDuration(null);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
       const currentTime = Date.now();
       setNow(currentTime);

       const remainingSeconds = Math.max(0, Math.floor((endTime - currentTime) / 1000));

       // Final completion trigger
       if (remainingSeconds <= 0 && !hasEnded) {
          setHasEnded(true);
          playTimeUpSound();
          return;
       }

       if (remainingSeconds > 0 && !hasEnded) {
          if (prevRemainingSeconds.current !== null) {
              const prevHours = Math.ceil(prevRemainingSeconds.current / 3600);
              const currHours = Math.ceil(remainingSeconds / 3600);
              
              // Play alert when an hour boundary is crossed (e.g. 2h 00m 01s -> 2h 00m 00s)
              // This is immune to setInterval skipping exact seconds.
              if (prevHours > currHours && remainingSeconds > 10) {
                 playHourPassedSound();
              }

              // Tick sequence for final 10 seconds. Play exactly once when entering the threshold.
              if (prevRemainingSeconds.current > 10 && remainingSeconds <= 10) {
                 playTickingSound();
              }
          }
       }
       
       prevRemainingSeconds.current = remainingSeconds;
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, hasEnded]);

  const timeRemaining = endTime ? Math.max(0, endTime - now) : null;
  
  if (timeRemaining === null) return null;

  const totalSeconds = Math.ceil(timeRemaining / 1000);
  
  const formatTime = () => {
    if (totalSeconds >= 3600) {
        const hours = Math.floor(totalSeconds / 3600).toString();
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  let percentage = 100;
  if (duration && duration > 0) {
      percentage = Math.max(0, Math.min(100, (totalSeconds / duration) * 100));
  }

  let strokeColor = '#39ff14'; // Full time -> Green
  let glowColor = 'rgba(57, 255, 20, 0.4)';

  if (totalSeconds === 0 || percentage <= 10) {
      strokeColor = '#ef4444'; // <10% -> Red
      glowColor = 'rgba(239, 68, 68, 0.6)';
  } else if (percentage <= 20) {
      strokeColor = '#f97316'; // <20% -> Orange
      glowColor = 'rgba(249, 115, 22, 0.5)';
  } else if (percentage <= 50) {
      strokeColor = '#06b6d4'; // <50% -> Cyan
      glowColor = 'rgba(6, 182, 212, 0.5)';
  }

  // SVG Ring calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isMoreThanAnHour = totalSeconds >= 3600;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="flex justify-center shrink-0"
      >
        <div 
          className="relative flex justify-center items-center rounded-full glass-panel border border-zinc-700/50"
          style={{ 
            width: '120px', 
            height: '120px',
            boxShadow: `0 0 25px ${glowColor}, inset 0 0 30px rgba(0,0,0,0.8)` 
          }}
        >
          {/* Outer Rotating Glow Ring (Subtle) */}
          <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_10s_linear_infinite] pointer-events-none"></div>
          
          {/* Inner Soft Gradient Glow */}
          <div 
            className="absolute inset-2 rounded-full opacity-30 blur-xl pointer-events-none transition-colors duration-1000"
            style={{ backgroundColor: strokeColor }}
          />

          {/* SVG Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-md" viewBox="0 0 120 120">
            {/* Dark Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="4"
            />
            {/* Bright Value */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
            />
          </svg>

          {/* Digital Timer Text */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {totalSeconds === 0 ? (
              <motion.span 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="text-2xl font-mono font-black tracking-widest text-[#ef4444] animate-pulse"
                 style={{ textShadow: `0 0 15px rgba(239, 68, 68, 0.8)` }}
              >
                00:00
              </motion.span>
            ) : (
              <motion.div 
                 key={totalSeconds} // Pulse effect on actual seconds update
                 initial={{ scale: 1.05 }}
                 animate={{ scale: 1 }}
                 transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                 className={`${isMoreThanAnHour ? 'text-lg' : 'text-3xl'} font-mono font-black tabular-nums tracking-widest`}
                 style={{ color: strokeColor, textShadow: `0 0 15px ${strokeColor}` }}
              >
                 {formatTime()}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

