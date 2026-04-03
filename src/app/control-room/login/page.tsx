'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { syncSession } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ShieldAlert, Fingerprint, Key, ChevronRight } from 'lucide-react';

type AuthStep = 'FIREBASE_AUTH' | 'PASSPHRASE' | 'AUTHENTICATING' | 'GLITCH_TRAP';

export default function CinematicLogin() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('FIREBASE_AUTH');
  const [returnStep, setReturnStep] = useState<AuthStep>('FIREBASE_AUTH');
  const [inputValue, setInputValue] = useState('');
  const [glitchLogs, setGlitchLogs] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const playSound = (type: 'error' | 'unlock') => {
     try {
        const a = new Audio(`/sounds/${type}.mp3`);
        a.volume = 0.5;
        a.play().catch(() => {});
     } catch(e) {}
  };

  const triggerGlitch = (fallback: AuthStep) => {
    playSound('error');
    setIsSuccess(false);
    setReturnStep(fallback);
    setStep('GLITCH_TRAP');
    setGlitchLogs([]);
    
    const logs = [
      "⚠ UNAUTHORIZED ACCESS DETECTED",
      "Tracking IP signature...",
      "Location: ACCESS NODE UNKNOWN",
      "Security Alert Level: CRITICAL",
      "Initiating systematic lockdown..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setGlitchLogs(prev => [...prev, logs[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
           setStep(fallback);
           setInputValue('');
        }, 2500);
      }
    }, 400);
  };

  const handleSubmitSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (step === 'FIREBASE_AUTH') {
       try {
          // Phase 1: Firebase Real Auth
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@hackintym.com';
          await signInWithEmailAndPassword(auth, adminEmail, inputValue);
          
          setIsSuccess(true);
          playSound('unlock');
          
          setTimeout(() => {
             setStep('PASSPHRASE');
             setInputValue('');
             setIsSuccess(false); // Revert to RED layer
          }, 1200);
          
       } catch (err) {
          triggerGlitch('FIREBASE_AUTH');
       }
       
    } else if (step === 'PASSPHRASE') {
       // Phase 2: ENV Control Secret Verification
       const secret = process.env.NEXT_PUBLIC_CONTROL_SECRET || 'EVOLUTION_ARENA_2603';
       
       if (inputValue === secret) {
          setIsSuccess(true);
          playSound('unlock');
          
          setTimeout(() => {
             setStep('AUTHENTICATING');
             syncSession('login').then((res) => {
                 if (res.success) {
                    router.refresh(); 
                    setTimeout(() => router.push('/control-room'), 500);
                 } else triggerGlitch('PASSPHRASE');
             }).catch(() => triggerGlitch('PASSPHRASE'));
          }, 1000);
          
       } else {
          triggerGlitch('PASSPHRASE');
       }
    }
  };

  // Dynamic Theme Mapping
  const cText = isSuccess ? 'text-[#39ff14]' : 'text-red-500';
  const cBorder = isSuccess ? 'border-[#39ff14]/50' : 'border-red-500/50';
  const cBorderThin = isSuccess ? 'border-[#39ff14]/30' : 'border-red-500/30';
  const cHoverBorder = isSuccess ? 'hover:border-[#39ff14]' : 'hover:border-red-500';
  const cBgSubtle = isSuccess ? 'bg-[#39ff14]/10' : 'bg-red-500/10';
  const cHoverBg = isSuccess ? 'hover:bg-[#39ff14]/20' : 'hover:bg-red-500/20';
  const cShadow = isSuccess ? 'shadow-[0_0_20px_rgba(57,255,20,0.3)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.3)]';
  const cHoverShadow = isSuccess ? 'hover:shadow-[0_0_30px_rgba(57,255,20,0.3)]' : 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]';
  const cGlow = isSuccess ? '0 0 15px rgba(57,255,20,0.5)' : '0 0 15px rgba(239,68,68,0.5)';
  const cFocusBorder = isSuccess ? 'focus:border-[#39ff14]' : 'focus:border-red-500';
  const cFocusShadow = isSuccess ? 'focus:shadow-[0_0_20px_rgba(57,255,20,0.2)]' : 'focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]';
  const cScanline = isSuccess ? 'bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#39ff14_3px)]' : 'bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#ef4444_3px)]';

  return (
    <main className={`min-h-screen flex items-center justify-center p-4 bg-zinc-950 ${cText} overflow-hidden transition-all duration-300 ${step === 'GLITCH_TRAP' ? 'bg-black text-red-500' : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black'}`}>
      
      {/* Background Decor (Grid Lines) */}
      <div className={`absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] transition-colors duration-500 mix-blend-screen`}></div>
      
      <AnimatePresence mode="wait">
         {/* GLITCH TRAP */}
         {step === 'GLITCH_TRAP' && (
           <motion.div 
             key="glitch"
             initial={{ opacity: 0, scale: 1.1 }}
             animate={{ 
               opacity: 1, 
               scale: 1,
               x: [-10, 10, -10, 10, -5, 5, 0],
               y: [5, -5, 5, -5, 2, -2, 0]
             }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.4 }}
             className="absolute inset-0 flex flex-col items-center justify-center p-8 z-50 mix-blend-screen bg-black/90 backdrop-blur-sm"
             style={{ textShadow: '3px 0 0 red, -3px 0 0 blue' }}
           >
              <ShieldAlert className="w-32 h-32 text-red-500 mb-8 animate-bounce" />
              <h1 className="text-4xl md:text-7xl font-black text-red-500 mb-8 uppercase tracking-tighter text-center">Access Denied</h1>
              
              <div className="w-full max-w-2xl bg-black/80 border-2 border-red-500/50 p-6 rounded-lg font-mono text-lg md:text-xl text-red-400">
                <AnimatePresence>
                  {glitchLogs.map((log, i) => (
                    <motion.div
                       key={i}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="mb-2"
                    >
                      <span className="opacity-50 mr-2">{'>'}</span>{log}
                    </motion.div>
                  ))}
                  {glitchLogs.length === 5 && (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} className="mt-6 text-center text-red-500 font-black text-2xl md:text-3xl animate-pulse">
                        SYSTEM LOCKDOWN ENGAGED
                     </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </motion.div>
         )}

         {/* MAIN AUTH */}
         {step !== 'GLITCH_TRAP' && (
           <motion.div
             key="auth"
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className={`relative z-10 w-full max-w-lg glass-panel p-8 md:p-12 rounded-3xl border ${cBorderThin} shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500`}
           >
              {/* Scanline overlay */}
              <div className={`absolute inset-0 rounded-3xl opacity-10 pointer-events-none transition-all duration-500 mix-blend-overlay ${cScanline}`}></div>
              
              <div className="flex flex-col items-center mb-10 relative">
                 <div className={`w-16 h-16 rounded-2xl ${cBgSubtle} border ${cBorder} flex items-center justify-center mb-6 ${cShadow} transition-all duration-500`}>
                   {isSuccess || step === 'AUTHENTICATING' ? <Unlock className={`w-8 h-8 ${cText} transition-colors`} /> : step === 'FIREBASE_AUTH' ? <Lock className={`w-8 h-8 ${cText} transition-colors`} /> : <Key className={`w-8 h-8 ${cText} transition-colors`} />}
                 </div>
                 <h2 className={`text-sm font-bold tracking-[0.4em] uppercase opacity-70 mb-2 text-center transition-opacity ${cText}`}>Prime Directive Override</h2>
                 <h1 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter text-center transition-all ${cText}`} style={{ textShadow: cGlow }}>Control Room</h1>
              </div>

              {step === 'AUTHENTICATING' && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-8"
                 >
                    <Fingerprint className={`w-16 h-16 animate-pulse mb-6 opacity-80 ${cText}`} />
                    <div className={`text-lg md:text-xl font-mono uppercase tracking-widest text-center animate-pulse drop-shadow-[0_0_10px_currentColor] ${cText}`}>Verifying Internal Protocol...</div>
                    <div className={`mt-4 text-[10px] uppercase tracking-widest opacity-50 ${cText}`}>Synchronizing socket keys</div>
                 </motion.div>
              )}

              {(step === 'FIREBASE_AUTH' || step === 'PASSPHRASE') && (
                 <form onSubmit={handleSubmitSequence} className="space-y-6">
                    <div className="space-y-2">
                      <label className={`text-xs font-bold uppercase tracking-[0.2em] opacity-80 ml-1 transition-colors ${cText}`}>
                        {step === 'FIREBASE_AUTH' ? 'Phase 1: Admin Credentials' : 'Final Access Verification'}
                      </label>
                      <div className="relative group">
                         <ChevronRight className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors opacity-50 group-focus-within:opacity-100 ${cText}`} />
                         <input
                           type={step === 'FIREBASE_AUTH' ? 'password' : 'text'}
                           autoFocus
                           className={`w-full bg-zinc-950/50 border-2 border-zinc-800 text-sm md:text-lg font-mono rounded-xl pl-12 pr-4 py-4 focus:outline-none transition-all placeholder:text-zinc-700 uppercase ${cText} ${cFocusBorder} ${cFocusShadow}`}
                           placeholder={step === 'FIREBASE_AUTH' ? "ENTER CONTROL PASSWORD" : "ENTER SYSTEM PASSPHRASE"}
                           value={inputValue}
                           onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                           disabled={isSuccess}
                           required
                         />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isSuccess}
                      className={`w-full relative overflow-hidden group border ${cBorder} ${cHoverBorder} ${cBgSubtle} ${cHoverBg} font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cShadow} ${cHoverShadow} ${cText}`}
                    >
                       <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite]`}></div>
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isSuccess ? 'ACCESS GRANTED' : step === 'FIREBASE_AUTH' ? 'Validate Core' : 'Bypass Final Layer'}
                      </span>
                    </button>
                 </form>
              )}
           </motion.div>
         )}
      </AnimatePresence>
    </main>
  );
}
