'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Injection, Bounty } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { playInjectionSound, playResolveSound, playBountySound, playScoreSound, playRankChangeSound, playFreezeSound, playSpecialRuleSound, playHourAlertSound, playTickingSound } from '@/lib/soundManager';

interface ActiveEvent {
  id: string;
  type: 'INJECTION' | 'BOUNTY';
  title: string;
  eventType?: string;
  multiplier?: number;
  expiresAt?: number;
}

export default function ActiveInjectionsPanel() {
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState(false);
  
  const prevEventsRef = useRef<ActiveEvent[] | undefined>(undefined);
  const isFirstMount = useRef(true);
  
  const eventsRef = useRef<ActiveEvent[]>([]);
  const playedAlertsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Clock & Audio Countdown Enforcement
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      eventsRef.current.forEach(ev => {
         if (!ev.expiresAt) return;
         const remaining = ev.expiresAt - currentTime;

         if (remaining <= 30000 && remaining > 29000 && !playedAlertsRef.current.has(`${ev.id}-30s`)) {
            playedAlertsRef.current.add(`${ev.id}-30s`);
            playHourAlertSound();
         }

         if (remaining <= 10000 && remaining > 9000 && !playedAlertsRef.current.has(`${ev.id}-10s`)) {
            playedAlertsRef.current.add(`${ev.id}-10s`);
            playTickingSound();
         }

         if (remaining <= 0 && remaining > -1000 && !playedAlertsRef.current.has(`${ev.id}-end`)) {
            playedAlertsRef.current.add(`${ev.id}-end`);
            playResolveSound();
         }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Injections & Bounties
  useEffect(() => {
    const qInjs = query(collection(db, 'injections'), where('status', '==', 'active'));
    const qBounties = query(collection(db, 'bounties'), where('status', '==', 'active'));

    let currentInjs: ActiveEvent[] = [];
    let currentBounties: ActiveEvent[] = [];

    const syncEvents = () => {
       const merged = [...currentInjs, ...currentBounties].sort((a,b) => {
          const timeA = a.expiresAt || Infinity;
          const timeB = b.expiresAt || Infinity;
          return timeA - timeB; // Sort by closest expiration
       });
       setEvents(merged);
    };

    const unsubInjs = onSnapshot(qInjs, (snap) => {
      currentInjs = snap.docs.map(doc => {
         const data = doc.data() as Injection;
         return {
           id: doc.id,
           type: 'INJECTION' as const,
           title: data.title,
           eventType: data.eventType,
           multiplier: data.multiplier,
           expiresAt: data.expiresAt
         };
      });
      syncEvents();
    });

    const unsubBounties = onSnapshot(qBounties, (snap) => {
      currentBounties = snap.docs.map(doc => {
         const data = doc.data() as Bounty;
         return {
           id: doc.id,
           type: 'BOUNTY' as const,
           title: data.title
         };
      });
      syncEvents();
    });

    return () => { unsubInjs(); unsubBounties(); };
  }, []);

  // Audio Engine Validation
  useEffect(() => {
    if (isFirstMount.current) {
       // Allow array to populate without triggering sounds on initial page boot
       if (events.length > 0) {
         prevEventsRef.current = events;
         isFirstMount.current = false;
       }
       return;
    }

    if (prevEventsRef.current !== undefined) {
      const prevIds = prevEventsRef.current.map(e => e.id);
      const newIds = events.map(e => e.id);

      const added = events.filter(e => !prevIds.includes(e.id));
      const removed = prevIds.filter(id => !newIds.includes(id));

      if (added.length > 0) {
         const addedInjections = added.filter(a => a.type === 'INJECTION');
         const hasBounty = added.some(a => a.type === 'BOUNTY');
         
         if (addedInjections.length > 0) {
            const firstInj = addedInjections[0];
            if (firstInj.eventType === 'POINTS') playScoreSound();
            else if (firstInj.eventType === 'MULTIPLIER') playRankChangeSound();
            else if (firstInj.eventType === 'FREEZE') playFreezeSound();
            else if (firstInj.eventType === 'SPECIAL_RULE') playSpecialRuleSound();
            else playInjectionSound();
         } else if (hasBounty) {
            playBountySound();
         }
      } else if (removed.length > 0) {
         // Network-synced fallback for manual admin deletions
         let newlyResolved = false;
         removed.forEach(id => {
            if (!playedAlertsRef.current.has(`${id}-end`)) {
               newlyResolved = true;
               playedAlertsRef.current.add(`${id}-end`);
            }
         });
         // Only play if it wasn't already caught by the ultra-fast local clock
         if (newlyResolved) {
            playResolveSound();
         }
      }
    }
    
    prevEventsRef.current = events;
  }, [events]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getEventStyles = (ev: ActiveEvent) => {
    if (ev.type === 'BOUNTY') {
       return { border: 'border-purple-500/80', text: 'text-purple-400', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]', bg: 'bg-purple-500/10' };
    }
    switch (ev.eventType) {
      case 'MULTIPLIER': return { border: 'border-blue-500/80', text: 'text-blue-400', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]', bg: 'bg-blue-500/10' };
      case 'FREEZE': return { border: 'border-red-500/80', text: 'text-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]', bg: 'bg-red-500/10' };
      case 'POINTS': return { border: 'border-green-500/80', text: 'text-green-400', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.4)]', bg: 'bg-green-500/10' };
      case 'SPECIAL_RULE': return { border: 'border-amber-500/80', text: 'text-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]', bg: 'bg-amber-500/10' };
      default: return { border: 'border-zinc-500/80', text: 'text-zinc-400', shadow: 'shadow-[0_0_15px_rgba(113,113,122,0.4)]', bg: 'bg-zinc-500/10' };
    }
  };

  const validEvents = events.filter(ev => {
    if (!ev.expiresAt) return true;
    return ev.expiresAt - now > 0;
  });

  const displayedEvents = expanded ? validEvents : validEvents.slice(0, 2);
  const hiddenCount = validEvents.length > 2 ? validEvents.length - 2 : 0;

  return (
    <AnimatePresence>
      {displayedEvents.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, width: 0, marginRight: 0 }}
          animate={{ opacity: 1, width: 'auto', marginRight: '16px' }}
          exit={{ opacity: 0, width: 0, marginRight: 0, transition: { duration: 0.3 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex flex-col gap-3 justify-center items-end absolute md:relative right-full md:right-auto z-20 pointer-events-none shrink-0"
        >
          <AnimatePresence mode="popLayout">
            {displayedEvents.map(ev => {
              const remainingTime = ev.expiresAt ? Math.max(0, ev.expiresAt - now) : null;
              const styles = getEventStyles(ev);
              
              let displayType = '';
              if (ev.type === 'BOUNTY') {
                 displayType = `🎯 BOUNTY LIVE`;
              } else {
                 displayType = `⚡ ${ev.title.toUpperCase()}`;
                 if (ev.eventType === 'MULTIPLIER') displayType = `⚡ ${ev.multiplier}X SCORE MULTIPLIER`;
              }
              
              return (
                 <motion.div
                   layout
                   key={ev.id}
                   initial={{ opacity: 0, scale: 0.95, y: -10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } }}
                   className={`glass-panel border-2 ${styles.border} ${styles.shadow} ${styles.bg} rounded-full py-2 px-4 sm:py-2.5 sm:px-5 bg-black/90 backdrop-blur-xl flex items-center gap-3 pointer-events-auto`}
                 >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className={`text-xs sm:text-sm font-black uppercase tracking-widest ${styles.text} whitespace-nowrap drop-shadow-[0_0_8px_currentColor]`}>
                        {displayType}
                      </span>
                      
                      {remainingTime !== null && (
                        <span className={`font-mono text-white text-sm sm:text-base font-black tabular-nums bg-black/80 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 shadow-[inset_0_3px_6px_rgba(0,0,0,0.8)] ${remainingTime < 10000 ? 'text-red-400 animate-pulse border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}>
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
                className="pointer-events-auto text-xs font-black tracking-widest uppercase bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-500 text-zinc-100 px-4 py-1.5 rounded-full transition-colors backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.6)] mt-1"
              >
                +{hiddenCount} More
              </motion.button>
            )}

            {expanded && validEvents.length > 2 && (
              <motion.button
                layout
                key="collapse-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setExpanded(false)}
                className="pointer-events-auto text-xs font-black tracking-widest uppercase bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-500 text-zinc-100 px-4 py-1.5 rounded-full transition-colors backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.6)] mt-1"
              >
                Show Less
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
