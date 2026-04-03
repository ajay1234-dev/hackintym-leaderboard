'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Injection, Bounty } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Target } from 'lucide-react';

export default function EventsSidebar() {
  const [injections, setInjections] = useState<Injection[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Active Injections
    const qInjections = query(collection(db, 'injections'));
    const unsubInjections = onSnapshot(qInjections, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Injection[];
      setInjections(data.filter(inj => inj.status === 'active'));
    });

    // Listen to Active Bounties
    const qBounties = query(collection(db, 'bounties'));
    const unsubBounties = onSnapshot(qBounties, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bounty[];
      setBounties(data.filter(b => b.status === 'active'));
    });
      setLoading(false);
    return () => {
      unsubInjections();
      unsubBounties();
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-full flex flex-col items-center justify-center neon-border animate-pulse">
        <Activity className="w-8 h-8 text-[var(--color-neon-green)] animate-bounce mb-2" />
        <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Syncing Uplink...</span>
      </div>
    );
  }

  const hasActiveEvents = injections.length > 0 || bounties.length > 0;

  return (
    <aside className="flex flex-col gap-4 sm:gap-6 h-full w-full max-h-[600px] sm:max-h-[700px] md:max-h-[800px]">
      
      {/* Live Events Section */}
      <div className={`glass-panel rounded-2xl flex flex-col shrink-0 transition-opacity ${hasActiveEvents ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-800'}`}>
        <div className="p-3 sm:p-5 border-b border-zinc-800 flex items-center gap-2">
          {hasActiveEvents ? (
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          ) : (
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-zinc-600" />
          )}
          <h2 className={`text-xs sm:text-sm font-black uppercase tracking-widest ${hasActiveEvents ? 'text-red-400' : 'text-zinc-500'}`}>
            Live Events
          </h2>
        </div>
        
        <div className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 max-h-[200px] sm:max-h-[250px] overflow-y-auto overflow-x-hidden">
          <AnimatePresence>
            {!hasActiveEvents && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4 text-xs font-mono text-zinc-600 uppercase tracking-widest italic"
              >
                No active events in the arena...
              </motion.div>
            )}

            {injections.map((inj) => (
              <motion.div
                key={inj.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                <div className="flex justify-between items-start mb-1 relative z-10">
                  <h3 className="text-red-400 font-bold text-xs uppercase flex items-center gap-1.5 flex-1 pr-2 leading-tight">
                    <Zap size={10} className="text-red-500 flex-shrink-0" /> {inj.title}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                    {inj.points > 0 ? '+' : ''}{inj.points} PTS
                  </span>
                </div>
                <p className="text-[10px] text-red-200/70 leading-relaxed mt-1">{inj.description}</p>
              </motion.div>
            ))}

            {bounties.map((bounty) => (
              <motion.div
                key={bounty.id}
                layout
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                <div className="flex justify-between items-start mb-1 relative z-10">
                  <h3 className="text-purple-400 font-bold text-xs uppercase flex items-center gap-1.5 flex-1 pr-2 leading-tight">
                    <Target size={10} className="text-purple-500 flex-shrink-0" /> {bounty.title}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/20 whitespace-nowrap">
                    {bounty.rewardPoints > 0 ? '+' : ''}{bounty.rewardPoints} PTS
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/70 leading-relaxed mt-1">{bounty.description}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
