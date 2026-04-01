'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Team, Card } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import AnimatedScore from './AnimatedScore';
import { useGlobalEffects } from './GlobalEffectsContext';
import { CARD_ICONS } from '@/lib/icons';

// Extend Team to include totalScore locally for sorting and display
interface TeamWithScore extends Team {
  totalScore: number;
}

// Sub-component for individual rows to track their own state changes
function LeaderboardRow({ team, index, renderCard }: { team: TeamWithScore, index: number, renderCard: (id: string, isUsed: boolean, i: number) => React.ReactNode }) {
  const [prevScore, setPrevScore] = useState(team.totalScore);
  const [delta, setDelta] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const { triggerPoints } = useGlobalEffects();

  useEffect(() => {
    if (team.totalScore !== prevScore) {
      const d = team.totalScore - prevScore;
      setDelta(d);
      setPrevScore(team.totalScore);
      
      if (rowRef.current) {
        const rect = rowRef.current.getBoundingClientRect();
        triggerPoints(d, rect.right - 50, rect.top + rect.height / 2);
      }

      const timeout = setTimeout(() => setDelta(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [team.totalScore, prevScore, triggerPoints]);

  const glowClass = delta ? (delta > 0 ? 'bg-[rgba(57,255,20,0.15)] border-[#39ff14]/50 shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'bg-[rgba(239,68,68,0.15)] border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]') : 'bg-zinc-800/20 border-zinc-700/50 hover:bg-zinc-800/40';

  let rankClass = 'text-zinc-500';
  if (index === 0) rankClass = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]';
  else if (index === 1) rankClass = 'text-zinc-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.5)]';
  else if (index === 2) rankClass = 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]';

  return (
    <motion.div
      ref={rowRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={delta !== null ? { opacity: 1, y: 0, scale: [1, 1.02, 1] } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, scale: { duration: 0.5 } }}
      className={`grid grid-cols-12 gap-2 md:gap-4 items-center p-3 md:p-4 rounded-xl border transition-all duration-500 relative ${glowClass} hover:bg-zinc-800/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]`}
    >
      {/* Absolute floating text has been offloaded to GlobalEffectsLayer */}

      {/* Rank */}
      <div className="col-span-2 md:col-span-1 flex justify-center">
        <span className={`text-xl md:text-2xl font-black ${rankClass}`}>
          #{index + 1}
        </span>
      </div>
      
      {/* Team Name */}
      <div className="col-span-4 md:col-span-3 lg:col-span-2 text-left pl-2">
        <h3 className="text-[13px] md:text-base font-bold text-white truncate transition-colors">
          {team.teamName}
        </h3>
      </div>
      
      {/* Reviews */}
      <div className="hidden lg:flex col-span-1 justify-center text-zinc-400 font-mono text-sm">
        {team.review1}
      </div>
      <div className="hidden lg:flex col-span-1 justify-center text-zinc-400 font-mono text-sm">
        {team.review2}
      </div>
      <div className="hidden lg:flex col-span-1 justify-center text-zinc-400 font-mono text-sm">
        {team.review3}
      </div>

      {/* Power Cards */}
      <div className="col-span-4 md:col-span-5 lg:col-span-3 flex flex-wrap gap-1.5 md:gap-3 items-center text-left pl-2">
          {(team.cardsOwned || []).map((cardId, i) => renderCard(cardId, false, i))}
          {(team.cardsUsed || []).map((cardId, i) => renderCard(cardId, true, i))}
          
          {[...Array(Math.max(0, 4 - ((team.cardsOwned?.length || 0) + (team.cardsUsed?.length || 0))))].map((_, i) => (
             <div key={`empty-${i}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg border-2 border-dashed border-zinc-700/60 bg-zinc-900/40 flex items-center justify-center shadow-inner">
               <span className="text-zinc-600 font-bold opacity-50">+</span>
             </div>
          ))}
      </div>

      {/* Bonus Points */}
      <div className="hidden md:flex col-span-1 justify-center items-center">
          <span className={`text-[10px] md:text-xs font-mono font-bold tracking-widest flex items-center ${team.bonusPoints > 0 ? 'text-[#39ff14]' : team.bonusPoints < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
            {team.bonusPoints > 0 ? '+' : ''}<AnimatedNumber value={team.bonusPoints} />
          </span>
      </div>

      {/* Total Score */}
      <div className="col-span-2 md:col-span-2 text-right pr-2">
        <motion.div 
          animate={delta !== null ? { scale: [1, 1.25, 1], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'], color: ['#ffffff', delta > 0 ? '#39ff14' : '#ef4444', '#ffffff'] } : {}}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <AnimatedScore 
            value={team.totalScore}
            className="text-xl md:text-3xl font-mono font-bold tracking-tight block drop-shadow-lg relative z-10"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [teams, setTeams] = useState<TeamWithScore[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const { showTooltip, hideTooltip } = useGlobalEffects();

  useEffect(() => {
    // Listen to teams
    const qTeams = query(collection(db, 'teams'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const review1 = data.review1 || 0;
        const review2 = data.review2 || 0;
        const review3 = data.review3 || 0;
        const bonusPoints = data.bonusPoints || 0;

        return {
          id: doc.id,
          teamName: data.teamName || 'Unnamed Team',
          review1,
          review2,
          review3,
          bonusPoints,
          cardsOwned: data.cardsOwned || [],
          cardsUsed: data.cardsUsed || [],
          totalScore: review1 + review2 + review3 + bonusPoints
        } as TeamWithScore;
      });

      setTeams(teamsData.sort((a, b) => b.totalScore - a.totalScore));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching teams:", error);
      setLoading(false);
    });

    // Listen to cards
    const unsubscribeCards = onSnapshot(collection(db, 'cards'), (snapshot) => {
      const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Card[];
      setCards(cardsData);
    });

    return () => {
      unsubscribeTeams();
      unsubscribeCards();
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-96 flex items-center justify-center neon-border">
        <div className="w-8 h-8 rounded-full border-4 border-t-[var(--color-neon-green)] border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  // Helper to render a card icon with tooltip
  const renderCard = (cardId: string, isUsed: boolean, i: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return null;

    let typeColor = 'text-green-400 border-green-500/50 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]'; // common
    if (card.type === 'rare') typeColor = 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
    else if (card.type === 'legendary') typeColor = 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.3)]';

    const usedStyle = isUsed ? 'opacity-30 grayscale filter border-dashed border-zinc-700 bg-zinc-800/30 blur-[0.5px] mix-blend-luminosity' : typeColor;
    const IconComponent = CARD_ICONS[card.icon as keyof typeof CARD_ICONS] || CARD_ICONS.CircleSlash;

    return (
      <motion.div 
         key={`${isUsed ? 'used' : 'owned'}-${card.id}-${i}`} 
         initial={!isUsed ? { scale: 2.5, opacity: 0, y: -30 } : false}
         animate={{ scale: 1, opacity: 1, y: 0 }}
         transition={{ type: 'spring', stiffness: 300, damping: 20 }}
         className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg border shadow-sm cursor-help transition-all ${usedStyle} hover:scale-115 z-10 hover:shadow-[0_0_20px_currentColor]`}
         onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            showTooltip({
              x: rect.left + rect.width / 2,
              y: rect.top,
              name: card.name,
              type: card.type,
              description: card.description,
              effect: card.effect,
              isUsed
            });
         }}
         onMouseLeave={hideTooltip}
      >
        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md" />
      </motion.div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden neon-border flex-1 flex flex-col max-h-[800px]">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 md:gap-4 p-4 border-b border-zinc-800 bg-zinc-900/80 text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400">
        <div className="col-span-2 md:col-span-1 text-center">Rank</div>
        <div className="col-span-4 md:col-span-3 lg:col-span-2 text-left pl-2">Team Name</div>
        <div className="hidden lg:block col-span-1 text-center">R1</div>
        <div className="hidden lg:block col-span-1 text-center">R2</div>
        <div className="hidden lg:block col-span-1 text-center">R3</div>
        <div className="col-span-4 md:col-span-5 lg:col-span-3 text-left pl-2">Power Cards</div>
        <div className="hidden md:block col-span-1 text-center">Bonus</div>
        <div className="col-span-2 md:col-span-2 text-right pr-2">Score</div>
      </div>
      
      {/* Table Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        <AnimatePresence>
          {teams.map((team, index) => (
            <LeaderboardRow key={team.id} team={team} index={index} renderCard={renderCard} />
          ))}
        </AnimatePresence>
        
        {teams.length === 0 && (
          <div className="text-center py-16 text-zinc-500 italic uppercase tracking-widest text-sm">
            Initializing Arena... No teams found.
          </div>
        )}
      </div>
    </div>
  );
}
