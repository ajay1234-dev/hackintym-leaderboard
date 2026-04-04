'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CARD_ICONS } from '@/lib/icons';

const CATEGORIES = ['COMMON', 'RARE', 'LEGENDARY'] as const;
type Category = typeof CATEGORIES[number];

export default function CardsLibrary() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Category>('COMMON');

  useEffect(() => {
    const q = query(collection(db, 'cards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
           id: doc.id,
           ...data,
           type: (data.type || 'COMMON').toUpperCase()
        } as Card;
      });
      
      cardsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCards(cardsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter(c => c.type === activeTab);
  }, [cards, activeTab]);

  const cardsCount = useMemo(() => {
    return {
      COMMON: cards.filter(c => c.type === 'COMMON').length,
      RARE: cards.filter(c => c.type === 'RARE').length,
      LEGENDARY: cards.filter(c => c.type === 'LEGENDARY').length,
    };
  }, [cards]);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 md:space-y-8">
      <header className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border neon-border z-10 relative shadow-[0_0_30px_rgba(57,255,20,0.05)]">
        <div>
          <h1 className="text-2xl md:text-5xl font-black uppercase drop-shadow-[0_0_15px_rgba(57,255,20,0.5)] text-[#39ff14]">Power Cards</h1>
          <p className="text-zinc-400 text-xs md:text-sm tracking-[0.2em] font-bold uppercase mt-1">Registry Protocol</p>
        </div>
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white border border-zinc-700 hover:border-[#39ff14] hover:bg-[#39ff14]/10 transition-all py-2.5 px-5 rounded-lg text-sm font-black uppercase tracking-widest shadow-sm w-full md:w-auto justify-center md:justify-start">
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </header>

      {/* Tabs Layout */}
      <div className="flex gap-2 p-2 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 overflow-x-auto relative z-10 scrollbar-none snap-x w-full">
        {CATEGORIES.map((tab) => {
           const isActive = activeTab === tab;
           let tabColors = '';
           if (tab === 'COMMON') tabColors = isActive ? 'text-cyan-400' : 'text-zinc-500 hover:text-cyan-400/50';
           if (tab === 'RARE') tabColors = isActive ? 'text-purple-400' : 'text-zinc-500 hover:text-purple-400/50';
           if (tab === 'LEGENDARY') tabColors = isActive ? 'text-yellow-400' : 'text-zinc-500 hover:text-yellow-400/50';

           return (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-3 rounded-xl font-black tracking-widest text-sm uppercase transition-all whitespace-nowrap shrink-0 min-w-[120px] sm:flex-1 lg:flex-none snap-center ${tabColors} ${isActive ? 'scale-[1.02] drop-shadow-[0_0_8px_currentColor]' : ''}`}
             >
                {isActive && (
                   <motion.div
                     layoutId="activeTabIndicator"
                     className={`absolute inset-0 rounded-xl border z-0 ${tab === 'COMMON' ? 'border-cyan-500/50 bg-cyan-500/10' : tab === 'RARE' ? 'border-purple-500/50 bg-purple-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}
                     initial={false}
                     transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                   />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                   {tab} <span className="opacity-60 text-xs">({cardsCount[tab]})</span>
                </span>
             </button>
           );
        })}
      </div>

      {loading ? (
        <div className="glass-panel p-16 rounded-2xl flex items-center justify-center neon-border">
          <div className="w-8 h-8 rounded-full border-4 border-t-[#39ff14] border-zinc-800 animate-spin flex items-center justify-center">
             <div className="w-4 h-4 rounded-full border-4 border-t-purple-500 border-zinc-800 animate-spin-reverse"></div>
          </div>
        </div>
      ) : (
        <motion.div layout className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div 
               key={activeTab} 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -30 }}
               transition={{ duration: 0.4 }}
               className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
            >
               {filteredCards.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
                    <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase">No <span className={activeTab === 'COMMON' ? 'text-cyan-400/50' : activeTab === 'RARE' ? 'text-purple-400/50' : 'text-yellow-400/50'}>{activeTab}</span> anomalies detected.</p>
                 </div>
               )}

               {filteredCards.map((card, i) => {
                 let borderClass = 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.05)] hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]';
                 let glowClass = 'bg-cyan-500';
                 let textClass = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
                 let cardGlowEffect = '';
                 
                 if (card.type === 'RARE') {
                    borderClass = 'border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-500/80 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] bg-gradient-to-br from-zinc-900 to-purple-900/10';
                    glowClass = 'bg-purple-500';
                    textClass = 'text-purple-400 border-purple-500/40 bg-purple-500/10 drop-shadow-[0_0_5px_currentColor]';
                 } else if (card.type === 'LEGENDARY') {
                    borderClass = 'border-yellow-500/60 shadow-[0_0_25px_rgba(234,179,8,0.15)] hover:border-yellow-400 hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] bg-gradient-to-br from-zinc-900 via-zinc-900 to-yellow-900/20';
                    glowClass = 'bg-yellow-500';
                    textClass = 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.4)] drop-shadow-[0_0_8px_currentColor]';
                    cardGlowEffect = 'animate-[pulse_4s_ease-in-out_infinite_alternate]';
                 }

                 const IconComponent = CARD_ICONS[card.icon as keyof typeof CARD_ICONS] || CARD_ICONS.CircleSlash;

                 return (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ duration: 0.3, delay: i * 0.05 }}
                     key={card.id} 
                     className={`glass-panel p-6 rounded-3xl border relative overflow-hidden group hover:-translate-y-2 hover:rotate-[1deg] transition-all duration-300 cursor-default ${borderClass} ${cardGlowEffect}`}
                   >
                     {/* Background Glow */}
                     <div className={`absolute -top-12 -right-12 w-32 h-32 blur-[50px] opacity-20 group-hover:opacity-60 transition-opacity duration-500 ${glowClass}`}></div>
                     
                     {/* Legendary Shimmer */}
                     {card.type === 'LEGENDARY' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-20 pointer-events-none"></div>
                     )}
                     
                     <div className="flex flex-col h-full relative z-10">
                        <div className="flex items-start justify-between mb-6">
                           <div className={`text-4xl p-3.5 rounded-2xl border bg-zinc-950 shadow-inner group-hover:scale-110 transition-transform ${textClass}`}>
                             <IconComponent className="w-8 h-8 drop-shadow-[0_0_8px_currentColor]" />
                           </div>
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded border shadow-sm ${textClass}`}>
                             {card.type}
                           </span>
                        </div>
                        
                        <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight leading-tight">{card.name}</h3>
                        <p className="text-sm text-zinc-400 mb-8 flex-1 leading-relaxed font-medium">{card.description}</p>
                        
                        <div className="pt-4 border-t border-zinc-800">
                           <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Effect Sequence</div>
                           <div className={`text-sm font-mono font-black tracking-wider px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 ${textClass.split(' ')[0]}`}>
                             {card.effect}
                           </div>
                        </div>
                     </div>
                   </motion.div>
                 );
               })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}
