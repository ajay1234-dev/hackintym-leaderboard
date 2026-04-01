'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Lock } from 'lucide-react';
import { syncSession } from '@/app/actions';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Firebase Authentication using predetermined system email
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@hackintym.com';
      await signInWithEmailAndPassword(auth, adminEmail, password);

      // 2. Set Middleware Session Cookie
      const res = await syncSession('login');

      if (res.success) {
        router.refresh();
        router.push('/control-room');
      } else {
        setError('Session synchronization failed');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid access token');
      } else if (err.code === 'auth/too-many-requests') {
        setError('System locked. Try again later.');
      } else {
        setError('Authentication server error');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md border border-zinc-800 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#39ff14] to-transparent opacity-75"></div>
        
        <h1 className="text-3xl font-black text-center mb-2 uppercase tracking-tight" style={{ color: '#39ff14', textShadow: '0 0 10px rgba(57, 255, 20, 0.3)' }}>
          Control Room
        </h1>
        <p className="text-center text-zinc-400 mb-8 uppercase text-xs tracking-widest font-bold">Authentication Required</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Access Token</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14] transition-all placeholder:text-zinc-600 font-mono text-sm tracking-widest"
                required
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-400 text-xs text-center font-mono bg-red-950/50 border border-red-500/20 p-3 rounded-lg flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#39ff14]/10 hover:bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] font-black uppercase tracking-widest py-3.5 rounded-lg transition-all shadow-[0_0_15px_rgba(57,255,20,0.15)] hover:shadow-[0_0_25px_rgba(57,255,20,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#39ff14]/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            {loading ? 'Authenticating...' : 'Initialize Uplink'}
          </button>
        </form>
      </div>
    </main>
  );
}

