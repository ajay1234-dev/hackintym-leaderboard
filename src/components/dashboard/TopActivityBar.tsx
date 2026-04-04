'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActivityLog, Card } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useGlobalEffects } from './GlobalEffectsContext';
import { playActivitySound, playBountySound, playInjectionSound } from '@/lib/soundManager';

export default function TopActivityBar() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [flashId, setFlashId] = useState<string | null>(null);
  const lastLogId = useRef<string | null>(null);

  useEffect(() => {
    // Listen to Activity Logs (limit 5 directly in query)
    const qLogs = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
      setLogs(data);
      setLoading(false);
      
      // Trigger flash animation if there's a new latest log
      if (data.length > 0) {
         const topLog = data[0];
         if (lastLogId.current && lastLogId.current !== topLog.id) {
            setFlashId(topLog.id);
            setTimeout(() => setFlashId(null), 500);

            // Audio Routing
            const rawMsg = topLog.message || topLog.action || '';
            if (topLog.actionType === 'bounty' || rawMsg.includes('Bounty')) {
               playBountySound();
            } else if (topLog.actionType === 'injection' || rawMsg.includes('Injection')) {
               playInjectionSound();
            } else if (topLog.actionType !== 'card' && topLog.actionType !== 'score') {
               // Subtly play activity for general events, skip cards/scores since they natively sound
               playActivitySound();
            }
         }
         lastLogId.current = topLog.id;
      }
    });

    // Listen to Cards for proper formatting/icons
    const qCards = query(collection(db, 'cards'));
    const unsubCards = onSnapshot(qCards, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Card[];
      setCards(data);
    });

    return () => {
      unsubLogs();
      unsubCards();
    };
  }, []);

  if (loading) {
     return (
       <div className="glass-panel w-full p-3 rounded-2xl border neon-border mb-4 flex items-center justify-center animate-pulse">
          <Activity className="w-4 h-4 text-[#39ff14]/70 mr-2" />
          <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Connecting to Uplink...</span>
       </div>
     );
  }

  const getTimeString = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(time.getTime())) return "Just now";
      return time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' });
    } catch {
      return "Just now";
    }
  };

  // Returns formatted message string, matched card and aesthetic classes for a given log
  const getLogDetails = (log: ActivityLog) => {
    const rawAction = log.message || log.action || 'System Event';
    let logMessage = rawAction.replace(/ \(Manual:.*?\)/, '');
    
    let actionColor = 'text-zinc-300';
    let iconColor = 'text-zinc-500';
    let bgHighlight = 'bg-transparent';
    let borderLine = 'border-l-zinc-500';

    if (log.actionType === 'score' || logMessage.toLowerCase().includes('points') || logMessage.toLowerCase().includes('score')) {
        actionColor = 'text-[#39ff14]';
        iconColor = 'text-[var(--color-neon-green)]';
        bgHighlight = 'bg-[#39ff14]/5';
        borderLine = 'border-l-[#39ff14]';
    } else if (log.actionType === 'card' || logMessage.toLowerCase().includes('card')) {
        const isLegendary = logMessage.toLowerCase().includes('legendary') || logMessage.toLowerCase().includes('mythic');
        const isRare = logMessage.toLowerCase().includes('rare');
        
        if (isLegendary) {
          actionColor = 'text-yellow-400'; iconColor = 'text-yellow-500'; bgHighlight = 'bg-yellow-500/10'; borderLine = 'border-l-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]';
        } else if (isRare) {
          actionColor = 'text-purple-400'; iconColor = 'text-purple-500'; bgHighlight = 'bg-purple-500/10'; borderLine = 'border-l-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]';
        } else {
          actionColor = 'text-cyan-400'; iconColor = 'text-cyan-500'; bgHighlight = 'bg-cyan-500/5'; borderLine = 'border-l-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]';
        }
    } else if (log.actionType === 'bounty' || logMessage.toLowerCase().includes('bounty')) {
        actionColor = 'text-purple-400';
        iconColor = 'text-purple-500';
        bgHighlight = 'bg-purple-500/5';
        borderLine = 'border-l-purple-400';
    } else if (log.actionType === 'injection' || logMessage.toLowerCase().includes('injection')) {
        actionColor = 'text-red-400';
        iconColor = 'text-red-500';
        bgHighlight = 'bg-red-500/5';
        borderLine = 'border-l-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    } else {
       if (logMessage.toLowerCase().includes('executed') || logMessage.toLowerCase().includes('deleted')) {
        actionColor = 'text-red-400'; iconColor = 'text-red-500'; borderLine = 'border-l-red-500';
      } else if (logMessage.toLowerCase().includes('granted') || logMessage.toLowerCase().includes('added')) {
        actionColor = 'text-blue-400'; iconColor = 'text-blue-500'; borderLine = 'border-l-blue-500';
      } else if (logMessage.toLowerCase().includes('updated')) {
        actionColor = 'text-[#39ff14]'; iconColor = 'text-[var(--color-neon-green)]'; borderLine = 'border-l-[#39ff14]';
      }
    }

    return { logMessage, actionColor, iconColor, bgHighlight, borderLine };
  };

  // We ONLY keep the absolute 2 newest logs for a tight layout.
  // We slice first to get the newest 2, then reverse so the absolute newest is at index 1 (bottom).
  const displayLogs = logs.slice(0, 2).reverse();

  return (
    <div className="relative mb-4 sm:mb-6 w-full z-20">
      <div className="absolute -top-3 left-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#39ff14] bg-black px-2 z-10 flex items-center gap-1.5 shadow-[0_0_10px_#39ff14]">
        <Activity className="w-3 h-3 animate-pulse" />
        Live Feed
      </div>

      <div className="relative glass-panel rounded-xl border neon-border h-[88px] overflow-hidden flex flex-col bg-black/40">
        {/* Soft gradient masks at top and bottom for the cinematic fade out effect */}
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-zinc-950 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none"></div>

        <div className="p-2 sm:p-3 flex flex-col gap-1.5 h-full">
          <AnimatePresence mode="popLayout">
            {displayLogs.length === 0 ? (
               <motion.div key="empty" className="text-center text-xs text-zinc-500 uppercase tracking-widest font-mono py-2">
                 Standing by for uplink...
               </motion.div>
            ) : (
               displayLogs.map((log) => {
                 const { logMessage, actionColor, bgHighlight, borderLine } = getLogDetails(log);
                 const timeString = getTimeString(log.timestamp);
                 const isFlash = flashId === log.id;

                 return (
                    <motion.div
                      layout
                      key={log.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        backgroundColor: isFlash ? 'rgba(255,255,255,0.1)' : undefined
                      }}
                      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.4 } }}
                      transition={{ 
                         duration: 0.5, 
                         type: 'spring', 
                         stiffness: 300, 
                         damping: 30 
                      }}
                      className={`flex gap-3 items-center p-2 rounded-lg border-l-2 ${borderLine} ${bgHighlight} bg-zinc-900/40 w-full relative overflow-hidden`}
                    >
                       {isFlash && (
                         <motion.div 
                           className="absolute inset-0 bg-white/20"
                           initial={{ opacity: 1 }}
                           animate={{ opacity: 0 }}
                           transition={{ duration: 0.8 }}
                         />
                       )}
                       
                       <div className="text-zinc-500 shrink-0 flex items-center justify-center w-4 h-4 ml-1">
                         {log.actionType === 'score' ? <span className="text-[#39ff14] drop-shadow-md">⚡</span> : log.actionType === 'bounty' ? <Target size={12} className="text-purple-500" /> : <Clock size={12} />}
                       </div>
                       
                       <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden z-10">
                           <span className="text-[10px] items-center px-1.5 rounded-sm font-mono text-zinc-500 bg-black/80 shrink-0 border border-zinc-800">
                              {timeString}
                           </span>
                           {log.teamName && (
                             <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/50 px-1.5 py-0.5 rounded-sm shrink-0">
                               {log.teamName}
                             </span>
                           )}
                           <span className={`text-[11px] sm:text-xs truncate max-w-full font-bold tracking-wide ${actionColor}`} title={logMessage}>
                             {logMessage}
                           </span>
                       </div>
                    </motion.div>
                 );
               })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
