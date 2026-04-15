'use client';

import { motion, Variants } from 'framer-motion';
import {
  Zap,
  Timer,
  ShieldAlert,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Shield,
  Swords,
  BarChart2,
  Gamepad2,
  Lightbulb,
  ArrowLeft,
  Send,
  Eye,
  Cpu,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
};

// ─── Rule Section Data ───────────────────────────────────────────────────────

const ruleSections = [
  {
    icon: Gamepad2,
    title: 'Gameplay',
    emoji: '🎮',
    accent: 'cyan',
    border: 'border-cyan-500/30',
    hover: 'hover:border-cyan-500/60',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.12)]',
    rules: [
      'Each team starts with 2 Power Cards',
      'Additional cards can be earned through Bounties or Injections',
      'Cards affect scores, time limits, or game conditions',
      'Inventory is visible only to your team — keep your strategy hidden',
    ],
  },
  {
    icon: Send,
    title: 'Card Usage',
    emoji: '🎴',
    accent: 'blue',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500/60',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.12)]',
    rules: [
      'Submit a card request through the digital panel on the Arena page',
      'Select the card → confirm (and pick a target for Attack cards)',
      'Each request must be approved by the Control Room admin',
      'Once used, a card moves to "Used" — it cannot be replayed',
    ],
  },
  {
    icon: Timer,
    title: 'Timing',
    emoji: '⏳',
    accent: 'amber',
    border: 'border-amber-500/30',
    hover: 'hover:border-amber-500/60',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
    rules: [
      'Card usage is only allowed when the request window is OPEN',
      'Window status is shown as a live timer on the Arena page',
      'Requests submitted while the window is closed are not accepted',
      'Admin opens and closes windows — watch for announcements',
    ],
  },
  {
    icon: Swords,
    title: 'Attack & Defense',
    emoji: '⚔️',
    accent: 'red',
    border: 'border-red-500/30',
    hover: 'hover:border-red-500/60',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]',
    rules: [
      'Attack cards must target exactly ONE opposing team',
      'Defense cards protect your team from incoming attacks',
      'Freeze effects prevent a team from gaining or losing points',
      'All active effects are shown on the live leaderboard',
    ],
  },
  {
    icon: BarChart2,
    title: 'Scoring',
    emoji: '📊',
    accent: 'green',
    border: 'border-green-500/30',
    hover: 'hover:border-green-500/60',
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-400',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.12)]',
    rules: [
      'All score changes pass through the system engine automatically',
      'Score multipliers apply to the NEXT valid score update only',
      'Frozen teams cannot gain or lose any points while frozen',
      'Bonus points from cards are added instantly on approval',
    ],
  },
  {
    icon: Shield,
    title: 'Fair Play',
    emoji: '🛡️',
    accent: 'purple',
    border: 'border-purple-500/30',
    hover: 'hover:border-purple-500/60',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.12)]',
    rules: [
      'No team may submit a request pretending to be another team',
      'Every action is logged in real-time and reviewed by admin',
      'Attempting to abuse the system results in point penalties',
      'Admin decisions are final — no appeals after approval',
    ],
  },
];

// ─── How It Works Steps ──────────────────────────────────────────────────────

const steps = [
  {
    icon: Eye,
    label: 'Check Window',
    desc: 'Watch the Arena page for "Card Window: OPEN" status',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
  },
  {
    icon: Gamepad2,
    label: 'Pick Your Card',
    desc: 'Scroll to "Use Your Cards" and click REQUEST USE',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
  },
  {
    icon: Send,
    label: 'Submit Request',
    desc: 'Confirm in the modal (select target if Attack card)',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
  },
  {
    icon: Cpu,
    label: 'Admin Reviews',
    desc: 'Control Room sees your request and approves or rejects',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
  },
  {
    icon: Zap,
    label: 'Effect Fires',
    desc: 'Card activates instantly — leaderboard updates live',
    color: 'text-[#39ff14]',
    bg: 'bg-[#39ff14]/15',
    border: 'border-[#39ff14]/30',
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProtocolPage() {
  return (
    <main className="min-h-screen p-4 md:p-6 flex flex-col gap-6 max-w-[1200px] mx-auto">

      {/* ── Header ── */}
      <header className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between border neon-border relative overflow-hidden gap-4">
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 text-sm font-mono uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Back to Leaderboard
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase neon-text flex items-center gap-3">
            <BookOpen size={36} className="text-[#39ff14]" />
            Hackintym Evolution Rules
          </h1>
          <p className="text-sm md:text-base text-zinc-400 uppercase tracking-widest mt-2 max-w-2xl">
            Official rules for the fully digital card-based gameplay system.
          </p>
        </div>

        {/* Decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none w-1/3 bg-gradient-to-l from-[#39ff14] to-transparent" />

        {/* Quick badge */}
        <div className="relative z-10 flex items-center gap-2 px-4 py-2 bg-[#39ff14]/10 border border-[#39ff14]/30 rounded-xl shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#39ff14]" />
          <span className="text-xs font-black text-[#39ff14] uppercase tracking-widest">
            Digital System Active
          </span>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >

        {/* ── 6 Rule Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {ruleSections.map((section) => (
            <motion.section
              key={section.title}
              variants={itemVariants}
              className={`glass-panel p-5 rounded-2xl border ${section.border} ${section.hover} ${section.glow} transition-colors group relative overflow-hidden`}
            >
              {/* Watermark icon */}
              <div className="absolute -bottom-4 -right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <section.icon size={100} />
              </div>

              {/* Title row */}
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl ${section.iconBg} ${section.iconColor} border ${section.border}`}>
                  <section.icon size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {section.emoji}
                  </span>
                  <h2 className={`text-base font-black uppercase tracking-wider ${section.iconColor} leading-tight`}>
                    {section.title}
                  </h2>
                </div>
              </div>

              {/* Rules list */}
              <ul className="space-y-2.5 relative z-10">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={13}
                      className={`${section.iconColor} shrink-0 mt-0.5`}
                    />
                    <span className="text-xs text-zinc-300 leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>

        {/* ── How To Submit A Request (Step Flow) ── */}
        <motion.section
          variants={itemVariants}
          className="glass-panel p-6 rounded-2xl border border-zinc-800/60 hover:border-[#39ff14]/40 transition-colors relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#39ff14]/15 text-[#39ff14] rounded-xl border border-[#39ff14]/30">
                <Send size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Step-by-Step</p>
                <h2 className="text-lg font-black uppercase tracking-wider text-[#39ff14]">
                  How to Use a Card
                </h2>
              </div>
            </div>
            <span className="text-[10px] px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-zinc-500 uppercase tracking-widest">
              Digital Request Flow
            </span>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden sm:block absolute top-[36px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent z-0" />

            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: 'spring', stiffness: 220, damping: 20 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Icon circle */}
                <div
                  className={`w-[72px] h-[72px] rounded-2xl flex items-center justify-center ${step.bg} ${step.color} border ${step.border} mb-3 relative`}
                >
                  <step.icon size={28} />
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-400">
                    {idx + 1}
                  </div>
                </div>

                <h4 className={`font-black text-xs uppercase tracking-wider mb-1 ${step.color}`}>
                  {step.label}
                </h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed px-1 max-w-[120px]">
                  {step.desc}
                </p>

                {/* Mobile connector arrow */}
                {idx < steps.length - 1 && (
                  <ChevronRight
                    size={14}
                    className="sm:hidden text-zinc-600 mt-2 rotate-90"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Bottom Row: Strategy Tip + Enforcement ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Strategy Tip */}
          <motion.section
            variants={itemVariants}
            className="glass-panel p-5 rounded-2xl border border-amber-500/30 hover:border-amber-500/50 transition-colors relative overflow-hidden group"
          >
            <div className="absolute -bottom-4 -right-4 opacity-[0.05] pointer-events-none"><Lightbulb size={90} /></div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
                <Lightbulb size={20} />
              </div>
              <h2 className="text-base font-black uppercase tracking-wider text-amber-400">
                🎯 Strategy Tips
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Time Your Attack',
                  tip: 'Deploy attack cards right before a review round — opponents can\'t recover fast enough.',
                  color: 'text-red-400',
                  bg: 'hover:bg-red-500/10 hover:border-red-500/30',
                },
                {
                  title: 'Save Legendaries',
                  tip: 'Use Common cards early. Keep Legendary cards for the final scoring window.',
                  color: 'text-yellow-400',
                  bg: 'hover:bg-yellow-500/10 hover:border-yellow-500/30',
                },
                {
                  title: 'Stack Your Shield',
                  tip: 'If you\'re leading — play a defense card before others can attack you.',
                  color: 'text-blue-400',
                  bg: 'hover:bg-blue-500/10 hover:border-blue-500/30',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`group/tip p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl ${s.bg} transition-all cursor-default`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`text-xs font-black ${s.color} uppercase tracking-wider`}>{s.title}</h4>
                    <ChevronRight size={12} className="text-zinc-600 opacity-0 group-hover/tip:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{s.tip}</p>
                </div>
              ))}
            </div>

            {/* Quote */}
            <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
              <p className="text-xs text-amber-300/80 italic">
                &ldquo;Use your cards wisely. Timing matters more than power.&rdquo;
              </p>
            </div>
          </motion.section>

          {/* Enforcement / Fair Play */}
          <motion.section
            variants={itemVariants}
            className="glass-panel p-5 rounded-2xl border border-red-500/30 hover:border-red-500/50 transition-colors relative overflow-hidden group"
          >
            <div className="absolute -bottom-4 -right-4 opacity-[0.05] pointer-events-none"><ShieldAlert size={90} /></div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-red-500/15 text-red-400 rounded-xl border border-red-500/30">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-base font-black uppercase tracking-wider text-red-400">
                🛡️ Enforcement
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  rule: 'Identity Spoofing',
                  penalty: 'No team may authenticate as another team',
                  icon: Lock,
                  color: 'text-red-400',
                },
                {
                  rule: 'System Abuse',
                  penalty: 'Exploiting the request system results in point penalty',
                  icon: ShieldAlert,
                  color: 'text-orange-400',
                },
                {
                  rule: 'Admin is Final',
                  penalty: 'Approved or rejected requests cannot be disputed',
                  icon: CheckCircle2,
                  color: 'text-zinc-400',
                },
              ].map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <e.icon size={13} className={e.color} />
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-wider ${e.color} mb-0.5`}>{e.rule}</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{e.penalty}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* All logged notice */}
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/40 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <p className="text-[11px] text-red-300/80">
                All card requests and approvals are <strong className="text-red-400">permanently logged</strong> in the activity feed.
              </p>
            </div>
          </motion.section>

        </div>

      </motion.div>
    </main>
  );
}
