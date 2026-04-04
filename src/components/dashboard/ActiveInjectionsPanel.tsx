'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Injection } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { playInjectionSound, playResolveSound } from '@/lib/soundManager';

export default function ActiveInjectionsPanel() {
  const [injections, setInjections] = useState<Injection[]>([]);
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState(false);
  const prevInjectionsRef = useRef<Injection[] | undefined>(undefined);

  // Sync clock every second to update countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active injections
  useEffect(() => {
    const qInjections = query(collection(db, 'injections'), where('status', '==', 'active'));
    const unsub = onSnapshot(qInjections, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Injection[];
      setInjections(data.sort((a,b) => (a.expiresAt || 0) - (b.expiresAt || 0)));
    });
    return () => unsub();
  }, []);

  // Sound triggers on state changes
  useEffect(() => {
    if (prevInjectionsRef.current !== undefined) {
      const prevIds = prevInjectionsRef.current.map(i => i.id);
      const newIds = injections.map(i => i.id);

      const added = newIds.filter(id => !prevIds.includes(id));
      const removedOrResolved = prevIds.filter(id => !newIds.includes(id));

      if (added.length > 0) {
        playInjectionSound();
      } else if (removedOrResolved.length > 0) {
        playResolveSound();
      }
    }
    
    prevInjectionsRef.current = injections;
  }, [injections]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTypeStyles = (type: string | undefined) => {
    switch (type) {
      case 'MULTIPLIER': return { border: 'border-blue-500/80', text: 'text-blue-400', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]', bg: 'bg-blue-500/10' };
      case 'FREEZE': return { border: 'border-red-500/80', text: 'text-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]', bg: 'bg-red-500/10' };
      case 'POINTS': return { border: 'border-green-500/80', text: 'text-green-400', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.4)]', bg: 'bg-green-500/10' };
      case 'SPECIAL_RULE': return { border: 'border-amber-500/80', text: 'text-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]', bg: 'bg-amber-500/10' };
      default: return { border: 'border-zinc-500/80', text: 'text-zinc-400', shadow: 'shadow-[0_0_15px_rgba(113,113,122,0.4)]', bg: 'bg-zinc-500/10' };
    }
  };

  const displayedInjections = expanded ? injections : injections.slice(0, 2);
  const hiddenCount = injections.length > 2 ? injections.length - 2 : 0;

  return (
    <div className="flex flex-col gap-2 justify-center items-end absolute md:relative right-full md:right-auto mr-4 md:mr-0 z-20 pointer-events-none min-w-[200px]">
      <AnimatePresence mode="popLayout">
        {displayedInjections.map(injection => {
          const remainingTime = injection.expiresAt ? Math.max(0, injection.expiresAt - now) : null;
          const styles = getTypeStyles(injection.eventType);
          let displayType = injection.title.toUpperCase();
          if (injection.eventType === 'MULTIPLIER') displayType = `${injection.multiplier}X SCORE MULTIPLIER`;
          
          return (
             <motion.div
               layout
               key={injection.id}
               initial={{ opacity: 0, x: -20, scale: 0.95 }}
               animate={{ opacity: 1, x: 0, scale: 1 }}
               exit={{ opacity: 0, x: -20, scale: 0.9, transition: { duration: 0.2 } }}
               className={`glass-panel border ${styles.border} ${styles.shadow} ${styles.bg} rounded-full py-1.5 px-3 bg-black/80 backdrop-blur-md flex items-center gap-2 pointer-events-auto`}
             >
                <div className="flex items-center justify-between w-full gap-3">
                  <span className={`text-[11px] sm:text-xs font-black uppercase tracking-widest ${styles.text} whitespace-nowrap`}>
                    ⚡ {displayType}
                  </span>
                  
                  {remainingTime !== null && (
                    <span className={`font-mono text-white text-[10px] sm:text-xs font-bold tabular-nums bg-black/50 px-2 py-0.5 rounded-full border border-white/10 ${remainingTime < 10000 ? 'text-red-400 animate-pulse' : ''}`}>
                      {formatTime(remainingTime)}
                    </span>
                  )}
                </div>
             </motion.div>
          );
        })}

        {!expanded && hiddenCount > 0 && (
          <motion.button
            layout
            key="expand-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setExpanded(true)}
            className="pointer-events-auto text-[10px] font-bold tracking-widest uppercase bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 px-3 py-1 rounded-full transition-colors backdrop-blur-md shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          >
            +{hiddenCount} More Events
          </motion.button>
        )}

        {expanded && injections.length > 2 && (
          <motion.button
            layout
            key="collapse-btn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setExpanded(false)}
            className="pointer-events-auto text-[10px] font-bold tracking-widest uppercase bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 px-3 py-1 rounded-full transition-colors backdrop-blur-md shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          >
            Show Less
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
