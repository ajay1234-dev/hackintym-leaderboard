'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CardsLibrary() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'cards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Card[];
      
      // Sort client-side to avoid requiring a composite Firebase Index
      cardsData.sort((a, b) => {
        if (a.type !== b.type) return (a.type || '').localeCompare(b.type || '');
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setCards(cardsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 md:space-y-8">
      <header className="glass-panel p-6 rounded-2xl flex items-center justify-between border neon-border">
        <div>
          <h1 className="text-2xl md:text-5xl font-black uppercase neon-text">Power Cards</h1>
          <p className="text-zinc-400 text-xs md:text-sm tracking-widest uppercase mt-1">Official Library Data</p>
        </div>
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-[#39ff14] border border-zinc-700 hover:border-[#39ff14] transition-colors py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Return
        </Link>
      </header>

      {loading ? (
        <div className="glass-panel p-16 rounded-2xl flex items-center justify-center neon-border">
          <div className="w-8 h-8 rounded-full border-4 border-t-[#39ff14] border-zinc-800 animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <div key={card.id} className={`glass-panel p-5 rounded-2xl border ${card.type === 'rare' ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'} relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-default`}>
               {/* Background Glow */}
               <div className={`absolute -top-10 -right-10 w-24 h-24 blur-3xl opacity-20 ${card.type === 'rare' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
               
               <div className="flex items-center justify-between mb-4 relative z-10">
                 <span className="text-3xl drop-shadow-lg bg-zinc-900/50 p-2 rounded-xl border border-zinc-700">{card.icon}</span>
                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${card.type === 'rare' ? 'text-purple-400 border-purple-500/50 bg-purple-500/10' : 'text-blue-400 border-blue-500/50 bg-blue-500/10'}`}>
                   {card.type}
                 </span>
               </div>
               
               <h3 className="text-xl font-bold text-white mb-2 relative z-10 uppercase">{card.name}</h3>
               <p className="text-sm text-zinc-400 mb-4 h-16 line-clamp-3 relative z-10">{card.description}</p>
               
               <div className="pt-4 border-t border-zinc-800 relative z-10">
                 <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Effect</div>
                 <div className="text-sm font-mono text-[#39ff14] font-bold">{card.effect}</div>
               </div>
            </div>
          ))}
          
          {cards.length === 0 && (
            <div className="col-span-full text-center py-20 text-zinc-500 font-mono tracking-widest uppercase border border-dashed border-zinc-800 rounded-2xl">
              No cards discovered in the registry.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
