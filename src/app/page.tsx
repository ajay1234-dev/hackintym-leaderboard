import Leaderboard from '@/components/dashboard/Leaderboard';
import EventsSidebar from '@/components/dashboard/EventsSidebar';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { GlobalEffectsProvider } from '@/components/dashboard/GlobalEffectsContext';

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-4 md:p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title Header */}
      <header className="glass-panel p-6 rounded-2xl flex items-center justify-between border neon-border">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase neon-text">
            Hackintym
          </h1>
          <h2 className="text-lg md:text-2xl font-bold tracking-[0.2em] text-zinc-400 uppercase mt-1">
            Evolution Arena
          </h2>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#39ff14] animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.8)]"></div>
            <span className="text-sm font-mono text-[#39ff14] tracking-wider uppercase font-bold">
              Live Sync Active
            </span>
          </div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Global Leaderboard</p>
          <div className="flex gap-2">
            <Link href="/cards" className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors border border-zinc-800 hover:border-blue-500/50 px-2.5 py-1 rounded bg-zinc-900/50 uppercase tracking-widest shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              Library
            </Link>
            <Link href="/control-room" className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-[#39ff14] transition-colors border border-zinc-800 hover:border-[#39ff14]/50 px-2.5 py-1 rounded bg-zinc-900/50 uppercase tracking-widest shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <Lock size={10} /> Control Room
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-start">
        {/* Left Side: Leaderboard */}
        <div className="lg:col-span-3">
          <GlobalEffectsProvider>
            <Leaderboard />
          </GlobalEffectsProvider>
        </div>
        
        {/* Right Side: Events Sidebar */}
        <div className="lg:col-span-1 sticky top-6">
          <EventsSidebar />
        </div>
      </div>
    </main>
  );
}
