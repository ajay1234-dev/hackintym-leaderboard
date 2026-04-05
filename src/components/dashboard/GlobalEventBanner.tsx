'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Injection } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveGlobalPhenomena } from '@/lib/effectEngine';
import { Globe } from 'lucide-react';
import { playScoreSound, playRankChangeSound, playInjectionSound, playFreezeSound, playSpecialRuleSound } from '@/lib/soundManager';

export default function GlobalEventBanner() {
  const [injections, setInjections] = useState<Injection[]>([]);
  const [now, setNow] = useState(Date.now());
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);
  const [visibleEvent, setVisibleEvent] = useState<Injection | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const qInjections = query(collection(db, 'injections'));
    const unsub = onSnapshot(qInjections, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Injection[];
      setInjections(data);
    });
    return () => unsub();
  }, []);

  const activeGlobals = getActiveGlobalPhenomena(injections);
  const currentEvent = activeGlobals.length > 0 ? activeGlobals[0] : null;

  // Sound Integration
  useEffect(() => {
    if (currentEvent && currentEvent.id !== lastAnnouncedId) {
      if (currentEvent.eventType === 'POINTS') playScoreSound();
      else if (currentEvent.eventType === 'MULTIPLIER') playRankChangeSound();
      else if (currentEvent.eventType === 'FREEZE') playFreezeSound();
      else if (currentEvent.eventType === 'SPECIAL_RULE') playSpecialRuleSound();
      else playInjectionSound();
      
      setLastAnnouncedId(currentEvent.id);
      setVisibleEvent(currentEvent);
    }
  }, [currentEvent, lastAnnouncedId]);

  // Decoupled Popup Dismissal (Fixes timeout cancellation bug)
  useEffect(() => {
    if (visibleEvent) {
      const timeout = setTimeout(() => {
        setVisibleEvent(null);
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [visibleEvent]);

  return (
    <AnimatePresence mode="wait">
      {visibleEvent && (
        <motion.div
          key={visibleEvent.id}
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9, transition: { ease: 'easeIn', duration: 0.4 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 inset-x-0 mx-auto w-[90%] max-w-[800px] z-[9999] pointer-events-none"
        >
          {(() => {
            let color = 'text-green-400';
            let bgGlow = 'from-green-500/20 via-green-500/10';
            let borderColor = 'border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.4)]';
            let titlePrefix = '⚡ GLOBAL EVENT ACTIVATED';

            if (visibleEvent.eventType === 'MULTIPLIER') {
               color = 'text-blue-400';
               bgGlow = 'from-blue-500/20 via-blue-500/10';
               borderColor = 'border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.4)]';
               titlePrefix = '⚡ DOUBLE SCORE ENHANCED';
            } else if (visibleEvent.eventType === 'FREEZE') {
               color = 'text-red-500';
               bgGlow = 'from-red-500/20 via-red-500/10';
               borderColor = 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.4)]';
               titlePrefix = '⚡ CRITICAL SCORE FREEZE';
            } else if (visibleEvent.eventType === 'POINTS') {
               titlePrefix = '⚡ GLOBAL EVENT POINT DISBURSEMENT';
            } else if (visibleEvent.eventType === 'SPECIAL_RULE') {
               color = 'text-amber-400';
               bgGlow = 'from-amber-500/20 via-amber-500/10';
               borderColor = 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.4)]';
               titlePrefix = '⚡ NEW RULE OVERRIDE';
            }

            return (
              <div className={`overflow-hidden relative rounded-2xl border-2 ${borderColor} backdrop-blur-xl bg-black/80 flex flex-col items-center justify-center py-4 px-6 md:py-6 md:px-8 text-center`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${bgGlow} to-transparent animate-pulse`}></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`flex items-center gap-2 md:gap-3 mb-1 ${color}`}>
                    <Globe className="w-5 h-5 md:w-8 md:h-8 animate-spin-slow" />
                    <span className="text-xs md:text-sm font-black tracking-[0.3em] uppercase drop-shadow-[0_0_8px_currentColor]">{titlePrefix}</span>
                    <Globe className="w-5 h-5 md:w-8 md:h-8 animate-spin-slow" />
                  </div>
                  
                  <h1 className={`text-2xl md:text-5xl font-black uppercase text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] mt-2 leading-none whitespace-nowrap`}>
                    {visibleEvent.title}
                  </h1>
                  
                  <p className="text-zinc-300 text-xs md:text-base mt-3 max-w-lg font-bold">
                    {visibleEvent.description}
                  </p>
                  
                  {visibleEvent.expiresAt && (
                    <div className="mt-4 px-6 py-1.5 rounded-full bg-white/10 border border-white/20 font-mono text-sm md:text-lg font-bold tracking-widest text-white shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                      {Math.ceil(Math.max(0, visibleEvent.expiresAt - now) / 1000)} SEC SURVIVAL
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
