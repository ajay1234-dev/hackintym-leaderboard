'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActivityLog, Card } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useGlobalEffects } from './GlobalEffectsContext';

export default function TopActivityBar() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showCardCelebration } = useGlobalEffects();
  
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    // Listen to Activity Logs (limit 5 directly in query)
    const qLogs = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
      setLogs(data);
      setLoading(false);
      
      // Trigger flash animation if there's a new latest log
      if (data.length > 0) {
         setFlashId(data[0].id);
         setTimeout(() => setFlashId(null), 300);
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

  const activityLabelMap: Record<string, string> = {
    SCORE_UPDATE: "Score Updated",
    CARD_GAIN: "Card Unlocked",
    BOUNTY_CLAIM: "Bounty Completed",
    INJECTION: "Injection Activated"
  };

  // Returns formatted message string, matched card and aesthetic classes for a given log
  const getLogDetails = (log: ActivityLog) => {
    const rawAction = log.message || log.action || '';
    let logMessage = rawAction.replace(/ \(Manual:.*?\)/, '');
    if (activityLabelMap[logMessage]) {
      logMessage = activityLabelMap[logMessage];
    }
    
    let cardInfo: Card | null = null;
    
    let actionColor = 'text-zinc-300';
    let iconColor = 'text-zinc-500';
    let bgHighlight = 'bg-transparent';
    let borderLine = 'border-l-zinc-500';

    if (log.actionType === 'score') {
        const pointsStr = logMessage.match(/([+-]\d+)/)?.[0] || '';
        logMessage = `${log.teamName || 'A team'} gained ${pointsStr} points`;
        actionColor = 'text-[#39ff14]';
        iconColor = 'text-[var(--color-neon-green)]';
        bgHighlight = 'bg-[#39ff14]/5';
        borderLine = 'border-l-[#39ff14]';
    } else if (log.actionType === 'card') {
        const cardName = logMessage.match(/acquired (.+) card/)?.[1] || 'a card';
        const foundCard = cards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
        cardInfo = foundCard || null;
        
        if (cardInfo) {
          const rarityPrefix = cardInfo.type === 'LEGENDARY' ? 'LEGENDARY' : cardInfo.type === 'RARE' ? 'RARE' : '';
          logMessage = `${log.teamName || 'A team'} unlocked ${rarityPrefix} ${cardName.toUpperCase()} 🎴`;
          if (cardInfo.type === 'LEGENDARY') {
            actionColor = 'text-yellow-400';
            iconColor = 'text-yellow-500';
            bgHighlight = 'bg-yellow-500/10';
            borderLine = 'border-l-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]';
          } else if (cardInfo.type === 'RARE') {
            actionColor = 'text-purple-400';
            iconColor = 'text-purple-500';
            bgHighlight = 'bg-purple-500/10';
            borderLine = 'border-l-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]';
          } else {
            actionColor = 'text-cyan-400';
            iconColor = 'text-cyan-500';
            bgHighlight = 'bg-cyan-500/5';
            borderLine = 'border-l-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]';
          }
        } else {
          logMessage = `${log.teamName || 'A team'} unlocked ${cardName.toUpperCase()} 🎴`;
          actionColor = 'text-blue-400';
          iconColor = 'text-blue-500';
          bgHighlight = 'bg-blue-500/5';
          borderLine = 'border-l-blue-400';
        }
    } else if (log.actionType === 'bounty' || logMessage.includes('Bounty')) {
        logMessage = `${log.teamName || 'A team'} earned completed a bounty 🎯`;
        actionColor = 'text-purple-400';
        iconColor = 'text-purple-500';
        bgHighlight = 'bg-purple-500/5';
        borderLine = 'border-l-purple-400';
    } else if (log.actionType === 'injection' || logMessage.includes('Injection')) {
        logMessage = `${log.teamName || 'A team'} received an injection`;
        actionColor = 'text-red-400';
        iconColor = 'text-red-500';
        bgHighlight = 'bg-red-500/5';
        borderLine = 'border-l-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
    } else if (!log.actionType) {
       // Legacy
       if (logMessage.toLowerCase().includes('executed') || logMessage.toLowerCase().includes('deleted')) {
        actionColor = 'text-red-400'; iconColor = 'text-red-500'; borderLine = 'border-l-red-500';
      } else if (logMessage.toLowerCase().includes('granted') || logMessage.toLowerCase().includes('added')) {
        actionColor = 'text-blue-400'; iconColor = 'text-blue-500'; borderLine = 'border-l-blue-500';
      } else if (logMessage.toLowerCase().includes('updated')) {
        actionColor = 'text-[#39ff14]'; iconColor = 'text-[var(--color-neon-green)]'; borderLine = 'border-l-[#39ff14]';
      }
    }

    return { logMessage, cardInfo, actionColor, iconColor, bgHighlight, borderLine };
  };

  const latestLog = logs[0];
  const { logMessage, actionColor, borderLine } = latestLog ? getLogDetails(latestLog) : { logMessage: '', actionColor: '', borderLine: '' };

  return (
    <div className="relative mb-4 sm:mb-6 w-full z-20">
      {/* Main Top Bar (Glassmorphism Strip) */}
      <div 
         className={`relative glass-panel rounded-xl flex items-center justify-between border neon-border cursor-pointer transition-all duration-300 overflow-hidden ${isExpanded ? 'rounded-b-none border-b-0' : ''}`}
         onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Neon Left Border Indicator */}
        <div className={`absolute top-0 bottom-0 left-0 border-l-4 ${latestLog ? borderLine : 'border-l-zinc-700'}`}></div>
        
        {/* Flash Background Effect */}
        <AnimatePresence>
          {flashId === (latestLog?.id || 'none') && (
            <motion.div 
               initial={{ opacity: 0.8 }} 
               animate={{ opacity: 0 }} 
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="absolute inset-0 bg-white/20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="p-3 sm:px-4 flex-1 flex items-center gap-3 overflow-hidden">
           <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#39ff14] shrink-0 animate-pulse" />
           <div className="flex-1 min-w-0 pr-4">
              {logs.length === 0 ? (
                 <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase truncate block">Waiting for activity...</span>
              ) : (
                 <AnimatePresence mode="popLayout">
                    <motion.div
                       key={latestLog.id}
                       initial={{ opacity: 0, y: -20, scale: 1 }}
                       animate={{ opacity: 1, y: 0, scale: flashId === latestLog.id ? [1, 1.02, 1] : 1 }}
                       exit={{ opacity: 0, y: 20 }}
                       transition={{ duration: 0.3 }}
                       className="flex items-center gap-2"
                    >
                       <span className="text-[10px] items-center py-0.5 px-1.5 rounded-md font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 hidden sm:flex shrink-0">
                          {getTimeString(latestLog.timestamp)}
                       </span>
                       {latestLog.teamName && (
                         <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-sm border border-zinc-700 shrink-0">
                           {latestLog.teamName}
                         </span>
                       )}
                       <span className={`text-xs sm:text-sm font-bold truncate max-w-full ${actionColor}`} title={logMessage}>
                          {latestLog.actionType === 'score' ? '⚡ ' : ''}
                          {logMessage}
                       </span>
                    </motion.div>
                 </AnimatePresence>
              )}
           </div>
        </div>
        
        <div className="shrink-0 pr-3 sm:pr-4 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <span className="text-xs font-mono uppercase tracking-widest font-bold hidden sm:block">View All</span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expandable Dropdown History */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             exit={{ opacity: 0, height: 0 }}
             transition={{ duration: 0.3, ease: 'easeOut' }}
             className="absolute top-full left-0 right-0 glass-panel rounded-b-xl border border-t-zinc-800/50 neon-border shadow-2xl overflow-hidden z-50 flex flex-col"
          >
             <div className="p-2 sm:p-3 max-h-[300px] overflow-y-auto flex flex-col gap-1.5 sm:gap-2">
                {logs.length === 0 && (
                   <div className="text-center py-6 text-xs text-zinc-500 uppercase tracking-widest italic font-mono">No History</div>
                )}
                          {logs.map((log) => {
                   const { logMessage, cardInfo, actionColor, bgHighlight, borderLine } = getLogDetails(log);
                   const timeString = getTimeString(log.timestamp);

                   return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex gap-3 items-center p-2 rounded-lg border-l-2 ${borderLine} ${bgHighlight} bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors w-full group`}
                      >
                         <div className="text-zinc-500 shrink-0 flex items-center justify-center w-4 h-4">
                           {log.actionType === 'score' ? <span className="text-[#39ff14] drop-shadow-md">⚡</span> : log.actionType === 'bounty' ? <Target size={12} className="text-purple-500" /> : <Clock size={12} />}
                         </div>
                         <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                             <span className="text-[10px] items-center px-1.5 rounded-sm font-mono text-zinc-500 bg-zinc-800/80 shrink-0">
                                {timeString}
                             </span>
                             {log.teamName && (
                               <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-300 bg-zinc-800 border border-zinc-700/50 px-1.5 py-0.5 rounded-sm shrink-0">
                                 {log.teamName}
                               </span>
                             )}
                             <span className={`text-[11px] sm:text-xs truncate max-w-full ${actionColor}`} title={logMessage}>
                               {logMessage}
                             </span>
                         </div>
                      </motion.div>
                   );
                })}
             </div>
             <div className="bg-zinc-900/80 p-2 text-center border-t border-zinc-800">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-mono text-zinc-500 flex items-center justify-center gap-1">
                   <Clock size={10} /> Showing Last 5 Events
                </span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
