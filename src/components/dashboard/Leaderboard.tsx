'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Team, Card } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import AnimatedScore from './AnimatedScore';
import { useGlobalEffects, useTeamHighlight } from './GlobalEffectsContext';
import { useCardDetection } from '@/hooks/useCardDetection';
import { CARD_ICONS } from '@/lib/icons';
import { Info } from 'lucide-react';
import { playRankChangeSound } from '@/lib/soundManager';

// Extend Team to include totalScore locally for sorting and display
interface TeamWithScore extends Team {
  totalScore: number;
}

// Sub-component for animating review score updates
function AnimatedReviewCell({ value, color, prefix = '' }: { value: number, color: 'blue' | 'yellow' | 'gray' | 'golden', prefix?: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsUpdating(true);
      setPrevValue(value);
      setTimeout(() => setIsUpdating(false), 500); // Reset after animation
    }
  }, [value, prevValue]);

  let styles = '';
  switch (color) {
    case 'blue': // the user requested cyan glow for R1
      styles = 'text-cyan-400 [text-shadow:0_0_6px_rgba(34,211,238,0.6)] hover:[text-shadow:0_0_10px_rgba(34,211,238,0.8)]';
      break;
    case 'yellow':
      styles = 'text-yellow-200 [text-shadow:0_0_6px_rgba(254,240,138,0.6)] hover:[text-shadow:0_0_10px_rgba(254,240,138,0.8)]';
      break;
    case 'gray':
      styles = 'text-zinc-200 [text-shadow:0_0_6px_rgba(255,255,255,0.6)] hover:[text-shadow:0_0_10px_rgba(255,255,255,0.8)]';
      break;
    case 'golden':
      styles = 'text-amber-400 [text-shadow:0_0_6px_rgba(245,158,11,0.6)] hover:[text-shadow:0_0_10px_rgba(245,158,11,0.8)]';
      break;
  }

  return (
    <motion.div
      initial={false}
      animate={isUpdating ? { scale: [1, 1.25, 1], y: [0, -5, 0], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : { scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.1 }}
      className={`text-lg md:text-xl font-semibold font-mono transition-all duration-300 cursor-default ${styles}`}
    >
      {prefix}<AnimatedScore value={value} />
    </motion.div>
  );
}

// Sub-component for individual rows to track their own state changes
function LeaderboardRow({ team, index, renderCard }: { team: TeamWithScore, index: number, renderCard: (id: string, isUsed: boolean, i: number) => React.ReactNode }) {
  const [prevScore, setPrevScore] = useState(team.totalScore);
  const [delta, setDelta] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const { triggerPoints } = useGlobalEffects();
  const { isHighlighted } = useTeamHighlight(team.id);

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

  const glowClass = delta 
    ? (delta > 0 
        ? 'bg-[rgba(57,255,20,0.15)] border-[#39ff14]/50 shadow-[0_0_15px_rgba(57,255,20,0.2)]' 
        : 'bg-[rgba(239,68,68,0.15)] border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]')
    : isHighlighted
    ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 border-blue-400/60 shadow-[0_0_25px_rgba(59,130,246,0.4),0_0_40px_rgba(168,85,247,0.3)]'
    : 'bg-zinc-800/20 border-zinc-700/50 hover:bg-zinc-800/40';

  let rankClass = 'text-zinc-500';
  if (index === 0) rankClass = 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]';
  else if (index === 1) rankClass = 'text-zinc-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.5)]';
  else if (index === 2) rankClass = 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]';

  return (
    <motion.div
      ref={rowRef}
      layout
      initial={false}
      animate={{
        scale: isHighlighted ? [1, 1.03, 1.02, 1] : delta !== null ? [1, 1.02, 1] : 1,
        borderColor: isHighlighted ? ['#3b82f6', '#a855f7', '#3b82f6'] : undefined,
        boxShadow: isHighlighted 
          ? ['0_0_25px_rgba(59,130,246,0.4)', '0_0_40px_rgba(168,85,247,0.6)', '0_0_25px_rgba(59,130,246,0.4)']
          : undefined
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30, 
        scale: { duration: isHighlighted ? 2 : 0.5 },
        borderColor: { duration: 2, repeat: isHighlighted ? Infinity : 0, repeatType: 'reverse' },
        boxShadow: { duration: 2, repeat: isHighlighted ? Infinity : 0, repeatType: 'reverse' }
      }}
      className={`grid grid-cols-12 gap-2 md:gap-4 items-center p-3 rounded-xl border transition-all duration-300 relative ${glowClass} hover:bg-zinc-800/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-h-[72px] max-h-[72px] md:min-h-[80px] md:max-h-[80px]`}
    >
      {/* Absolute floating text has been offloaded to GlobalEffectsLayer */}

      {/* Rank */}
      <div className="col-span-2 lg:col-span-1 flex justify-center">
        <span className={`text-base sm:text-xl md:text-2xl font-black ${rankClass}`}>
          #{index + 1}
        </span>
      </div>
      
      {/* Team Name */}
      <div className="col-span-5 sm:col-span-4 md:col-span-3 lg:col-span-2 text-left pl-1 sm:pl-2">
        <h3 className="text-xs sm:text-[13px] md:text-base font-bold text-white truncate transition-colors">
          {team.teamName}
        </h3>
      </div>
      
      {/* Reviews */}
      <div className="hidden lg:flex col-span-1 justify-center">
        <AnimatedReviewCell value={team.review1} color="blue" />
      </div>
      <div className="hidden lg:flex col-span-1 justify-center">
        <AnimatedReviewCell value={team.review2} color="yellow" />
      </div>
      <div className="hidden lg:flex col-span-1 justify-center">
        <AnimatedReviewCell value={team.review3} color="gray" />
      </div>

      {/* Power Cards */}
      <div className="col-span-3 sm:col-span-4 md:col-span-4 lg:col-span-3 flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-visible text-left pl-1 sm:pl-2">
          {(() => {
            const owned = team.cardsOwned || [];
            const used = team.cardsUsed || [];
            const allCards = [
              ...owned.map((id, i) => ({ id, isUsed: false, index: i })), 
              ...used.map((id, i) => ({ id, isUsed: true, index: i }))
            ].slice(0, 4); // Show maximum 4 cards
            
            return (
              <>
                 {allCards.map(c => renderCard(c.id, c.isUsed, c.index))}
                 {[...Array(Math.max(0, 4 - allCards.length))].map((_, i) => (
                   <div key={`empty-${i}`} className="w-[24px] h-[24px] sm:w-[34px] sm:h-[34px] md:w-[38px] md:h-[38px] shrink-0 rounded-md border border-dashed border-zinc-700/40 bg-zinc-900/30 flex items-center justify-center">
                     <span className="text-zinc-600 font-bold opacity-30 text-[10px] sm:text-xs">+</span>
                   </div>
                 ))}
              </>
            );
          })()}
      </div>

      {/* Bonus Points */}
      <div className="hidden md:flex col-span-1 justify-center items-center">
          <AnimatedReviewCell 
             value={team.bonusPoints} 
             color="golden" 
             prefix={team.bonusPoints > 0 ? '+' : ''} 
          />
      </div>

      {/* Total Score */}
      <div className="col-span-2 md:col-span-2 text-right pr-2">
        <motion.div 
          animate={delta !== null ? { scale: [1, 1.25, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'], color: ['#ffffff', delta > 0 ? '#39ff14' : '#ef4444', '#ffffff'] } : {}}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <AnimatedScore 
            value={team.totalScore}
            className="text-lg sm:text-2xl md:text-3xl font-mono font-black block relative z-10 text-[#39ff14] [text-shadow:0_0_15px_rgba(57,255,20,0.8)]"
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
  const { showTooltip, hideTooltip, showCardCelebration, triggerTeamHighlight } = useGlobalEffects();
  const isFirstRender = useRef(true);
  const prevRanks = useRef<Record<string, number>>({});

  // Card detection hook with celebration triggers
  useCardDetection({
    teams,
    cards,
    onNewCardDetected: (result) => {
      // Trigger the celebration popup
      showCardCelebration(result.teamName, result.card);
      
      // Find the team and trigger row highlighting
      const team = teams.find(t => t.teamName === result.teamName);
      if (team) {
        triggerTeamHighlight(team.id);
      }
    }
  });

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

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

      const sortedTeams = teamsData.sort((a, b) => b.totalScore - a.totalScore);
      
      // Perform strict rank change checks to play audio
      if (!isFirstRender.current) {
         let playedRankSound = false; // anti-spam for batch changes
         sortedTeams.forEach((t, i) => {
            const newRank = i + 1;
            const prevRank = prevRanks.current[t.id];
            if (prevRank && newRank < prevRank) {
               if (!playedRankSound && (newRank <= 3 || (prevRank - newRank) >= 3)) {
                  playRankChangeSound();
                  playedRankSound = true;
               }
            }
            prevRanks.current[t.id] = newRank;
         });
      } else {
         sortedTeams.forEach((t, i) => {
            prevRanks.current[t.id] = i + 1;
         });
      }

      setTeams(sortedTeams);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching teams:", error);
      setLoading(false);
    });

    // Listen to cards
    const unsubscribeCards = onSnapshot(collection(db, 'cards'), (snapshot) => {
      const cardsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, type: (data.type || 'COMMON').toUpperCase() } as Card;
      });
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

    let typeColor = 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10 shadow-[inset_0_0_6px_rgba(34,211,238,0.1),_0_0_6px_rgba(34,211,238,0.2)]'; // common
    if (card.type === 'RARE') typeColor = 'text-purple-400 border-purple-500/20 bg-purple-500/10 shadow-[inset_0_0_6px_rgba(168,85,247,0.1),_0_0_8px_rgba(168,85,247,0.3)]';
    else if (card.type === 'LEGENDARY') typeColor = 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10 shadow-[inset_0_0_8px_rgba(234,179,8,0.2),_0_0_12px_rgba(234,179,8,0.4)] animate-[pulse_2s_ease-in-out_infinite]';

    const usedStyle = isUsed ? 'opacity-15 grayscale filter border-dashed border-zinc-700 bg-zinc-800/10 blur-[1px] mix-blend-luminosity hover:opacity-30' : typeColor;
    const IconComponent = CARD_ICONS[card.icon as keyof typeof CARD_ICONS] || CARD_ICONS.CircleSlash;

    return (
      <motion.div 
         key={`${isUsed ? 'used' : 'owned'}-${card.id}-${i}`} 
         className={`relative flex items-center justify-center w-[24px] h-[24px] sm:w-[34px] sm:h-[34px] md:w-[38px] md:h-[38px] shrink-0 rounded-md border shadow-sm cursor-help transition-all duration-300 ${usedStyle} hover:scale-[1.08] hover:z-50 hover:shadow-[0_0_15px_currentColor]`}
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
        <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 drop-shadow-md" />
      </motion.div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden neon-border flex-1 flex flex-col max-h-[600px] sm:max-h-[700px] md:max-h-[800px]">
      {/* Real-time Card Status Note */}
      <div className="bg-blue-900/20 border-b border-blue-500/20 px-3 sm:px-4 py-2 flex items-center justify-center gap-2">
         <Info size={12} className="sm:w-3.5 sm:h-3.5 text-blue-400" />
         <span className="text-[10px] sm:text-[11px] text-blue-200/80 font-mono uppercase tracking-widest leading-tight">
           Cards shown = available usable cards
         </span>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 sm:gap-2 md:gap-4 p-2 sm:p-4 border-b border-zinc-800 bg-zinc-900/80 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400">
        <div className="col-span-2 lg:col-span-1 text-center">#</div>
        <div className="col-span-5 sm:col-span-4 md:col-span-3 lg:col-span-2 text-left pl-1 sm:pl-2">Team</div>
        <div className="hidden lg:block col-span-1 text-center">R1</div>
        <div className="hidden lg:block col-span-1 text-center">R2</div>
        <div className="hidden lg:block col-span-1 text-center">R3</div>
        <div className="col-span-3 sm:col-span-4 md:col-span-4 lg:col-span-3 text-left pl-1 sm:pl-2">Cards</div>
        <div className="hidden md:block col-span-1 text-center">Bonus</div>
        <div className="col-span-2 text-right pr-1 sm:pr-2">Score</div>
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
