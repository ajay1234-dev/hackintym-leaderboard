'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActivityLog, Card } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useGlobalEffects } from './GlobalEffectsContext';
import { playActivitySound, playBountySound, playInjectionSound, playCardActivateSound } from '@/lib/soundManager';

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
            } else if ((topLog.actionType === 'card' || rawMsg.toLowerCase().includes('card')) && (rawMsg.toLowerCase().includes('used') || rawMsg.toLowerCase().includes('executed'))) {
               playCardActivateSound();
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

  // Separate the most recent log from the older history
  const mostRecentLog = logs[0];
  const olderLogs = logs.slice(1, 15);

  return (
    <div className="relative mb-4 sm:mb-6 w-full z-20">
      <div className="absolute -top-3 left-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#39ff14] bg-black px-2 z-10 flex items-center gap-1.5 shadow-[0_0_10px_#39ff14]">
        <Activity className="w-3 h-3 animate-pulse" />
        Live Feed
      </div>

      <div className="relative glass-panel rounded-xl border neon-border h-[88px] overflow-hidden flex flex-col bg-black/80">
        <div className="w-full h-full relative overflow-hidden flex flex-col pt-1.5 pb-1 px-1.5">
             {!mostRecentLog ? (
                <div className="w-full h-full flex items-center justify-center text-center text-xs text-zinc-500 uppercase tracking-widest font-mono py-2">
                  Standing by for uplink...
                </div>
             ) : (
                <>
                  {/* Fixed Recent Log */}
                  <div className="w-full relative z-20 shrink-0">
                    {(() => {
                      const { logMessage, actionColor, bgHighlight, borderLine } = getLogDetails(mostRecentLog);
                      const timeString = getTimeString(mostRecentLog.timestamp);
                      const isFlash = flashId === mostRecentLog.id;

                      return (
                         <div
                           key={`recent-${mostRecentLog.id}`}
                           className={`flex gap-3 items-center px-3 py-2 rounded-lg border-l-2 ${borderLine} ${bgHighlight} bg-zinc-900 w-full relative overflow-hidden transition-all duration-300 ${isFlash ? 'bg-white/20 scale-[1.01] shadow-[0_0_15px_white]' : ''}`}
                         >
                            {isFlash && (
                              <motion.div 
                                className="absolute inset-0 bg-white/20 pointer-events-none"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 0.8 }}
                              />
                            )}
                            <div className="text-zinc-500 shrink-0 flex items-center justify-center w-4 h-4">
                              {mostRecentLog.actionType === 'score' ? <span className="text-[#39ff14] drop-shadow-md">⚡</span> : mostRecentLog.actionType === 'bounty' ? <Target size={12} className="text-purple-500" /> : <Clock size={12} />}
                            </div>
                            
                            <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden z-10">
                                <span className="text-[10px] items-center px-1.5 py-0.5 rounded-sm font-mono text-white bg-zinc-800/80 shrink-0 border border-zinc-600 shadow-[0_0_8px_rgba(255,255,255,0.15)] font-bold">
                                   {timeString}
                                </span>
                                {mostRecentLog.teamName && (
                                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-sm shrink-0">
                                    {mostRecentLog.teamName}
                                  </span>
                                )}
                                <span className={`text-xs sm:text-sm truncate max-w-full font-bold tracking-wide ${actionColor}`} title={logMessage}>
                                  {logMessage}
                                </span>
                            </div>
                         </div>
                      );
                    })()}
                  </div>

                  {/* Horizontal Scrolling Older Logs */}
                  {olderLogs.length > 0 && (
                     <div className="w-full flex-1 overflow-hidden relative flex items-center mt-1 pt-1 border-t border-zinc-800/30">
                        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none"></div>
                        
                        <motion.div
                          animate={{ x: ["0%", "-50%"] }}
                          transition={{ 
                             ease: "linear", 
                             duration: Math.max(olderLogs.length * 4, 10), 
                             repeat: Infinity 
                          }}
                          className="flex w-max gap-4 px-4 items-center h-full"
                        >
                          {[...olderLogs, ...olderLogs].map((log, index) => {
                            const { logMessage, actionColor, borderLine } = getLogDetails(log);
                            const timeString = getTimeString(log.timestamp);

                            return (
                               <div
                                 key={`old-${log.id}-${index}`}
                                 className={`flex gap-2 items-center px-3 py-1 rounded border-l-2 ${borderLine} bg-zinc-900/50 whitespace-nowrap`}
                               >
                                  <span className="text-[9px] items-center px-1.5 py-[1px] rounded-sm font-mono text-zinc-300 bg-zinc-800 shrink-0 border border-zinc-700 font-bold">
                                     {timeString}
                                  </span>
                                  {log.teamName && (
                                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">
                                      [{log.teamName}]
                                    </span>
                                  )}
                                  <span className={`text-[10px] sm:text-xs font-bold tracking-wide ${actionColor}`}>
                                    {logMessage}
                                  </span>
                               </div>
                            );
                          })}
                        </motion.div>
                     </div>
                  )}
                </>
             )}
        </div>
      </div>
    </div>
  );
}
