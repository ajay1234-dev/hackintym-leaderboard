'use client';

import { motion, Variants } from 'framer-motion';
import { Zap, Timer, ShieldAlert, BookOpen, ChevronRight, CheckCircle2, XCircle, Shield, Hand, MonitorPlay, AlertTriangle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ProtocolPage() {
  return (
    <main className="min-h-screen p-4 md:p-6 flex flex-col gap-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <header className="glass-panel p-6 rounded-2xl flex items-center justify-between border neon-border relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 text-sm font-mono uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Arena
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase neon-text flex items-center gap-3">
            <BookOpen size={36} className="text-[#39ff14]" />
            Power Card Protocol
          </h1>
          <p className="text-sm md:text-base text-zinc-400 uppercase tracking-widest mt-2 max-w-2xl">
            Official guidelines for earning, managing, and executing strategic power cards in the Evolution Arena.
          </p>
        </div>
        
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none w-1/3 bg-gradient-to-l from-[#39ff14] to-transparent mix-blend-screen"></div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* A. What Are Power Cards? */}
        <motion.section variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-zinc-800/50 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Zap size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-purple-400">What Are Power Cards?</h2>
          </div>
          
          <ul className="space-y-4 text-zinc-300 relative z-10">
            <li className="flex gap-3">
               <span className="text-purple-400 mt-1"><CheckCircle2 size={16} /></span>
               <p><strong className="text-white">Strategic Power-ups:</strong> Cards are game-changing items that can manipulate scores, alter circumstances, or grant unique abilities.</p>
            </li>
            <li className="flex gap-3">
               <span className="text-purple-400 mt-1"><CheckCircle2 size={16} /></span>
               <p><strong className="text-white">Earning Mechanic:</strong> Cards are not given freely. They must be earned through extraordinary performance, completing Bounties, or during special Injection windows.</p>
            </li>
          </ul>
        </motion.section>

        {/* B. When Can You Use Cards? */}
        <motion.section variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-zinc-800/50 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Timer size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Timer size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-blue-400">Timing & Usage</h2>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} /> Allowed Windows
              </h3>
              <ul className="space-y-2 text-zinc-300 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" /> Before a review submission begins
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" /> During special announced Injection periods
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" /> When explicitly instructed by organizers
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <XCircle size={14} /> Restricted Windows
              </h3>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5" /> After final event submissions
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5" /> Once formal review evaluation has started
                </li>
                <li className="flex items-start gap-2 text-zinc-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5" /> Without informing the Control Room
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* C. How To Use A Card (Animated Step Flow) */}
        <motion.section variants={itemVariants} className="md:col-span-2 glass-panel p-6 rounded-2xl border border-zinc-800/50 hover:border-[#39ff14]/50 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#39ff14]/20 text-[#39ff14] rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                <MonitorPlay size={24} />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-[#39ff14]">How to Execute a Power Card</h2>
            </div>
            <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Standard Protocol
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
             {/* Flow Lines */}
             <div className="hidden md:block absolute top-[45px] left-10 right-10 h-0.5 bg-zinc-800 z-0"></div>
             
             {[
               { icon: Lightbulb, title: "Decision", desc: "Team decides to use a strategic card.", color: "text-blue-400", bg: "bg-blue-400/20" },
               { icon: Hand, title: "Present", desc: "Physically show the card to the judge.", color: "text-amber-400", bg: "bg-amber-400/20" },
               { icon: Shield, title: "Verify", desc: "Organizer authenticates the real card.", color: "text-purple-400", bg: "bg-purple-400/20" },
               { icon: MonitorPlay, title: "Trigger", desc: "Control Room digital activation.", color: "text-pink-400", bg: "bg-pink-400/20" },
               { icon: Zap, title: "Effect", desc: "Instant sync to global leaderboard.", color: "text-[#39ff14]", bg: "bg-[#39ff14]/20" }
             ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2, type: 'spring', stiffness: 200 }}
                  className="flex flex-col items-center text-center relative z-10"
                >
                   <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${step.bg} ${step.color} border border-${step.color.split('-')[1]}-500/20 mb-4 shadow-lg backdrop-blur-md relative`}>
                     {idx > 0 && <div className="md:hidden absolute -top-4 w-0.5 h-4 bg-zinc-800"></div>}
                     <step.icon size={32} />
                     <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                       {idx + 1}
                     </div>
                   </div>
                   <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-1">{step.title}</h4>
                   <p className="text-xs text-zinc-400 leading-relaxed px-2">{step.desc}</p>
                </motion.div>
             ))}
          </div>
        </motion.section>

        {/* D. Physical Card Rules */}
        <motion.section variants={itemVariants} className="glass-panel p-6 rounded-2xl border flex flex-col border-red-500/30 hover:border-red-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/20 text-red-500 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-red-400">Physical Integrity Rules</h2>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
               <p className="text-sm text-red-200 mb-2">Each team receives physical cards. These tangible items represent real, usable power. They must be maintained with strict integrity.</p>
               <ul className="text-xs text-red-300 space-y-1">
                 <li>• <strong className="text-red-400">Lost Card:</strong> Considered void and permanently invalid.</li>
                 <li>• <strong className="text-red-400">Used Card:</strong> Collected or officially marked as consumed.</li>
                 <li>• <strong className="text-red-400">Activation:</strong> Only Admin Control Room can trigger digital changes.</li>
               </ul>
            </div>
            
            <div className="flex bg-orange-950/40 border border-orange-900/50 rounded-xl p-4 gap-3 items-start">
               <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
               <p className="text-xs text-orange-200/80 leading-relaxed">
                 <strong className="text-orange-400 block mb-1">MISUSE WARNING:</strong> 
                 Cards cannot be manually self-applied. Forgery, transferring to other teams unnoticed, or attempting to use invalidated cards will result in severe point penalties or immediate disqualification.
               </p>
            </div>
          </div>
        </motion.section>

        {/* Strategy Tips */}
        <motion.section variants={itemVariants} className="glass-panel p-6 rounded-2xl border border-yellow-500/30 hover:border-yellow-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <Lightbulb size={24} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-yellow-500">Strategy Tips</h2>
          </div>
          
          <div className="space-y-4">
             <div className="group p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all cursor-default">
               <h4 className="text-sm font-bold text-yellow-400 mb-1 flex items-center justify-between">
                 Hold the Line <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </h4>
               <p className="text-xs text-zinc-400">Save Legendary cards for trailing moments or the final review stages. Early deployments can leave you vulnerable later.</p>
             </div>
             
             <div className="group p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/30 transition-all cursor-default">
               <h4 className="text-sm font-bold text-purple-400 mb-1 flex items-center justify-between">
                 Pre-Review Disruption <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </h4>
               <p className="text-xs text-zinc-400">Using Sabotage or Freeze cards immediately before a review window puts immense pressure on leading teams.</p>
             </div>
             
             <div className="group p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-green-500/10 hover:border-green-500/30 transition-all cursor-default">
               <h4 className="text-sm font-bold text-green-400 mb-1 flex items-center justify-between">
                 Synergy Execution <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </h4>
               <p className="text-xs text-zinc-400">Combine a shield with an attack during an injection event to maximize your point differential against rivals.</p>
             </div>
          </div>
        </motion.section>

      </motion.div>
    </main>
  );
}
