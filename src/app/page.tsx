import Leaderboard from '@/components/dashboard/Leaderboard';
import EventsSidebar from '@/components/dashboard/EventsSidebar';
import Link from 'next/link';
import { Lock, BookOpen } from 'lucide-react';
import { GlobalEffectsProvider } from '@/components/dashboard/GlobalEffectsContext';
import TopActivityBar from '@/components/dashboard/TopActivityBar';

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6 max-w-[1600px] mx-auto">
      {/* Title Header */}
      <header className="glass-panel p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between border neon-border gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight uppercase neon-text">
            Hackintym
          </h1>
          <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold tracking-[0.2em] text-zinc-400 uppercase mt-1">
            Evolution Arena
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#39ff14] animate-pulse shadow-[0_0_10px_rgba(57,255,20,0.8)]"></div>
            <span className="text-xs sm:text-sm font-mono text-[#39ff14] tracking-wider uppercase font-bold">
              Live Sync Active
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest mb-1">Global Leaderboard</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/cards" className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-zinc-300 hover:text-blue-400 transition-all border border-zinc-700 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-zinc-900/50 uppercase tracking-widest hover:scale-105 active:scale-95">
              Library
            </Link>
            <Link href="/protocol" className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-zinc-300 hover:text-amber-400 transition-all border border-zinc-700 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-zinc-900/50 uppercase tracking-widest hover:scale-105 active:scale-95">
              <BookOpen size={14} className="sm:w-4 sm:h-4" /> Rules
            </Link>
            <Link href="/control-room/login" className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-[#39ff14]/90 hover:text-[#39ff14] transition-all border border-[#39ff14]/30 hover:border-[#39ff14] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] shadow-[0_0_10px_rgba(57,255,20,0.1)] px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#39ff14]/5 uppercase tracking-widest hover:scale-105 active:scale-95 font-bold">
              <Lock size={14} className="sm:w-4 sm:h-4" /> Control
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 flex-1 items-start">
        {/* Left Side: Activity + Leaderboard */}
        <div className="xl:col-span-3">
          <GlobalEffectsProvider>
            <TopActivityBar />
            <Leaderboard />
          </GlobalEffectsProvider>
        </div>
        
        {/* Right Side: Events Sidebar */}
        <div className="xl:col-span-1 xl:sticky xl:top-6">
          <EventsSidebar />
        </div>
      </div>
    </main>
  );
}
