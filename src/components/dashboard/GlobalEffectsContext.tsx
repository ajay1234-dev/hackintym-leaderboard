'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/types';
import { CARD_ICONS } from '@/lib/icons';
import { CardCelebrationPopup } from '../celebration/CardCelebrationPopup';
import { enableAudio } from '@/lib/soundManager';

export type CardCelebration = {
  id: string;
  teamName: string;
  card: Card;
};

export type TooltipData = {
  x: number;
  y: number;
  name: string;
  type: 'COMMON' | 'RARE' | 'LEGENDARY';
  description: string;
  effect: string;
  isUsed?: boolean;
};

type PointsAnimation = {
  id: string;
  x: number;
  y: number;
  delta: number;
};

type CardDropAnimation = {
  id: string;
  x: number;
  y: number;
  icon: React.ReactNode;
  type: 'COMMON' | 'RARE' | 'LEGENDARY';
};

interface GlobalEffectsContextType {
  showTooltip: (data: TooltipData) => void;
  hideTooltip: () => void;
  triggerPoints: (delta: number, x: number, y: number) => void;
  triggerCardDrop: (icon: React.ReactNode, type: 'COMMON' | 'RARE' | 'LEGENDARY', x: number, y: number) => void;
  showCardCelebration: (teamName: string, card: Card) => void;
  triggerTeamHighlight: (teamId: string) => void;
  isCelebrationPlaying: boolean;
  isTeamHighlighted: (teamId: string) => boolean;
}

const GlobalEffectsContext = createContext<GlobalEffectsContextType>({
  showTooltip: () => {},
  hideTooltip: () => {},
  triggerPoints: () => {},
  triggerCardDrop: () => {},
  showCardCelebration: () => {},
  triggerTeamHighlight: () => {},
  isCelebrationPlaying: false,
  isTeamHighlighted: () => false
});

export const useGlobalEffects = () => useContext(GlobalEffectsContext);

// Helper hook for components to check team highlight status
export const useTeamHighlight = (teamId: string) => {
  const { isTeamHighlighted, isCelebrationPlaying } = useGlobalEffects();
  return { 
    isHighlighted: isTeamHighlighted(teamId), 
    isCelebrationPlaying 
  };
};

export const GlobalEffectsProvider = ({ children }: { children: ReactNode }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [points, setPoints] = useState<PointsAnimation[]>([]);
  const [cardDrops, setCardDrops] = useState<CardDropAnimation[]>([]);
  const [celebrationQueue, setCelebrationQueue] = useState<CardCelebration[]>([]);
  const [activeCelebration, setActiveCelebration] = useState<CardCelebration | null>(null);
  const [isCelebrationPlaying, setIsCelebrationPlaying] = useState(false);
  const [highlightedTeams, setHighlightedTeams] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const enable = () => enableAudio();
    const events = ["click", "mousedown", "keydown", "touchstart"];
    events.forEach(e => window.addEventListener(e, enable, { once: true }));
    return () => events.forEach(e => window.removeEventListener(e, enable));
  }, []);

  useEffect(() => {
    // Queue lock mechanism - prevent overlapping celebrations
    if (!isCelebrationPlaying && celebrationQueue.length > 0) {
      const next = celebrationQueue[0];
      setActiveCelebration(next);
      setIsCelebrationPlaying(true);
      setCelebrationQueue(curr => curr.slice(1));
    }
  }, [celebrationQueue, isCelebrationPlaying]);

  useEffect(() => {
    if (activeCelebration) {
      // Auto-dismiss after 3.5 seconds unconditionally 
      const timer = setTimeout(() => {
        setActiveCelebration(null);
        setIsCelebrationPlaying(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [activeCelebration]);

  const showTooltip = useCallback((data: TooltipData) => setTooltip(data), []);
  const hideTooltip = useCallback(() => setTooltip(null), []);
  
  const triggerPoints = useCallback((delta: number, x: number, y: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setPoints(curr => [...curr, { id, delta, x, y }]);
    setTimeout(() => {
      setPoints(curr => curr.filter(p => p.id !== id));
    }, 2000); // 2 second animation as requested
  }, []);

  const triggerCardDrop = useCallback((icon: React.ReactNode, type: 'COMMON' | 'RARE' | 'LEGENDARY', x: number, y: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setCardDrops(curr => [...curr, { id, icon, type, x, y }]);
    setTimeout(() => {
        setCardDrops(curr => curr.filter(p => p.id !== id));
    }, 1500); // 1.5s visual burst
  }, []);

  const showCardCelebration = useCallback((teamName: string, card: Card) => {
    // Check if same celebration is already in queue to prevent duplicates
    const isDuplicate = celebrationQueue.some(c => c.card.id === card.id && c.teamName === teamName);
    const isActive = activeCelebration?.card.id === card.id && activeCelebration?.teamName === teamName;
    
    if (!isDuplicate && !isActive) {
      const id = Math.random().toString(36).substring(2, 9);
      setCelebrationQueue(curr => [...curr, { id, teamName, card }]);
    }
  }, [celebrationQueue, activeCelebration]);

  const triggerTeamHighlight = useCallback((teamId: string) => {
    setHighlightedTeams(prev => new Set(prev).add(teamId));
    
    // Remove highlight after animation duration
    setTimeout(() => {
      setHighlightedTeams(prev => {
        const newSet = new Set(prev);
        newSet.delete(teamId);
        return newSet;
      });
    }, 2000); // Match team row animation duration
  }, []);

  const isTeamHighlighted = useCallback((teamId: string) => {
    return highlightedTeams.has(teamId);
  }, [highlightedTeams]);

  if (!mounted || typeof document === 'undefined') return <>{children}</>;

  const portalContent = (
    <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ overflow: 'visible' }}>
      {/* Tooltip Layer */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="global-tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ 
               position: 'absolute', 
               left: tooltip.x, 
               top: tooltip.y,
               transform: 'translate(-50%, -100%)',
               marginTop: '-20px' // Offset completely above finger/mouse
            }}
            className="w-56 p-3 rounded-xl bg-black/95 backdrop-blur-md border border-zinc-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none"
          >
            <div className="text-xs uppercase font-black tracking-widest flex items-center justify-between gap-4 pb-2 border-b border-zinc-700/50">
              <span className={tooltip.type === 'RARE' ? 'text-purple-400 drop-shadow-[0_0_5px_currentColor]' : tooltip.type === 'LEGENDARY' ? 'text-yellow-400 drop-shadow-[0_0_5px_currentColor]' : 'text-cyan-400 drop-shadow-[0_0_5px_currentColor]'}>{tooltip.name}</span>
              <span className="text-[9px] text-zinc-500">[{tooltip.type}]</span>
              {tooltip.isUsed && <span className="text-red-500 font-black tracking-widest ml-1">(USED)</span>}
            </div>
            <div className="text-[11px] text-zinc-300 mt-2 leading-tight">{tooltip.description}</div>
            <div className={`text-[10px] font-mono font-bold mt-2 p-1.5 rounded inline-block w-full border ${tooltip.type === 'RARE' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : tooltip.type === 'LEGENDARY' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'}`}>
              {tooltip.effect}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Score +Points Animation Layer */}
      <AnimatePresence>
        {points.map(p => (
           <motion.div
             key={p.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: -40 }}
             exit={{ opacity: 0, y: -80 }}
             transition={{ duration: 2, ease: 'easeOut' }}
             style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}
             className={`text-2xl md:text-3xl lg:text-4xl font-black drop-shadow-[0_0_15px_currentColor] ${p.delta > 0 ? 'text-[#39ff14]' : 'text-red-500'}`}
           >
             {p.delta > 0 ? '+' : ''}{p.delta}
           </motion.div>
        ))}
      </AnimatePresence>

      {/* Drop-in Burst Card Animation */}
      <AnimatePresence>
        {cardDrops.map(c => {
           let typeColor = 'text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] border-cyan-500 bg-cyan-500/20'; // common
           if (c.type === 'RARE') typeColor = 'text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] border-purple-500 bg-purple-500/20';
           else if (c.type === 'LEGENDARY') typeColor = 'text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] border-yellow-500 bg-yellow-500/20';
           
           return (
             <motion.div
               key={c.id}
               initial={{ scale: 2.5, opacity: 0, y: -30 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.5 }}
               transition={{ type: 'spring', stiffness: 300, damping: 20 }}
               style={{ position: 'absolute', left: c.x, top: c.y, transform: 'translate(-50%, -50%)' }}
               className={`flex items-center justify-center p-3 rounded-xl border-2 backdrop-blur-sm z-1000 ${typeColor}`}
             >
               <span className="scale-[1.5]">{c.icon}</span>
             </motion.div>
           );
        })}
      </AnimatePresence>

      {/* Card Celebration Popup */}
      <CardCelebrationPopup 
        celebration={activeCelebration!} 
        isVisible={!!activeCelebration} 
      />
    </div>
  );

  return (
    <GlobalEffectsContext.Provider value={{ 
      showTooltip, 
      hideTooltip, 
      triggerPoints, 
      triggerCardDrop, 
      showCardCelebration,
      triggerTeamHighlight,
      isCelebrationPlaying,
      isTeamHighlighted
    }}>
      {children}
      {createPortal(portalContent, document.body)}
    </GlobalEffectsContext.Provider>
  );
};
