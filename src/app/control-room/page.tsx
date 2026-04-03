'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Team, Card, Injection, Bounty } from '@/types';
import { syncSession } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Lock, Unlock, X, Info, CheckCircle2, Play, Pause, Zap, Trash2, Activity } from 'lucide-react';
import { CARD_ICONS } from '@/lib/icons';

export default function ControlRoom() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [injections, setInjections] = useState<Injection[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Registry State
  const [newTeamName, setNewTeamName] = useState('');
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  // Deck Builder State
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    name: '', type: 'COMMON', description: '', effect: '', icon: 'Zap'
  });

  // Assign state mapped by team id
  const [selectedCards, setSelectedCards] = useState<Record<string, string>>({});

  // Events State
  const [newInjection, setNewInjection] = useState<{title: string, description: string, points: number, type: 'global' | 'selective', targetTeamId: string, rewardCardId: string}>({ title: '', description: '', points: 0, type: 'global', targetTeamId: '', rewardCardId: '' });
  const [isAddingInjection, setIsAddingInjection] = useState(false);

  const [newBounty, setNewBounty] = useState({ title: '', description: '', rewardPoints: 0, rewardCardId: '' });
  const [isAddingBounty, setIsAddingBounty] = useState(false);
  
  // Bounty Completion Modal State
  const [completingBounty, setCompletingBounty] = useState<Bounty | null>(null);
  const [selectedTeamForBounty, setSelectedTeamForBounty] = useState('');

  // Manual Score State
  const [draftScores, setDraftScores] = useState<Record<string, Partial<Team>>>({});

  // UX Refinements: Lock & Search
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const qTeams = query(collection(db, 'teams'));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Team[];
      setTeams(teamsData.sort((a, b) => (a.teamName || '').localeCompare(b.teamName || '')));
      setLoading(false);
    });

    const qCards = query(collection(db, 'cards'));
    const unsubscribeCards = onSnapshot(qCards, (snapshot) => {
      const cardsData = snapshot.docs.map(doc => {
         const data = doc.data();
         return { id: doc.id, ...data, type: (data.type || 'COMMON').toUpperCase() } as Card;
      });
      setCards(cardsData);
    });

    const unsubscribeInjections = onSnapshot(query(collection(db, 'injections')), (snapshot) => {
      setInjections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Injection[]);
    });

    const unsubscribeBounties = onSnapshot(query(collection(db, 'bounties')), (snapshot) => {
      setBounties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bounty[]);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If Firebase Auth is missing but Middleware let them in, it means the cookie is stale.
        // We MUST clear the cookie before redirecting to avoid an infinite redirect loop.
        syncSession('logout').then(() => {
          window.location.href = '/';
        });
      }
    });

    return () => { 
      unsubscribeTeams(); unsubscribeCards(); unsubscribeAuth(); 
      unsubscribeInjections(); unsubscribeBounties();
    };
  }, [router]);

  const logActivity = async (
    actionType: 'score' | 'card' | 'bounty' | 'injection' | 'system',
    message: string,
    teamName?: string,
    points?: number
  ) => {
    try {
      await addDoc(collection(db, 'activityLogs'), { 
        action: message, // Legacy fallback
        actionType,
        message,
        teamName: teamName || null,
        points: points || 0,
        timestamp: Date.now() 
      });
    } catch (err) { console.error(err); }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsAddingTeam(true);
    try {
      await addDoc(collection(db, 'teams'), {
        teamName: newTeamName.trim(), review1: 0, review2: 0, review3: 0, bonusPoints: 0,
        cardsOwned: [], cardsUsed: []
      });
      await logActivity('system', `Added new team: ${newTeamName.trim()}`, newTeamName.trim());
      setNewTeamName('');
    } finally { setIsAddingTeam(false); }
  };

  const handleDeleteTeam = async (id: string, teamName: string) => {
    if (!confirm(`Purge team ${teamName}?`)) return;
    await deleteDoc(doc(db, 'teams', id));
    await logActivity('system', `Deleted team: ${teamName}`, teamName);
  };

  const handleDraftChange = (teamId: string, field: keyof Team, value: number) => {
    setDraftScores(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], [field]: value }
    }));
  };

  const handleApplyScore = async (id: string, teamName: string) => {
    const draft = draftScores[id];
    if (!draft) return;

    const oldTeam = teams.find(t => t.id === id);
    if (!oldTeam) return;

    let totalDelta = 0;
    const updates: Partial<Team> = {};
    const messageParts: string[] = [];

    (['review1', 'review2', 'review3', 'bonusPoints'] as const).forEach(key => {
       if (draft[key] !== undefined && draft[key] !== oldTeam[key]) {
          const delta = Number(draft[key]) - (Number(oldTeam[key]) || 0);
          totalDelta += delta;
          updates[key] = draft[key];
          
          let fieldName = key === 'bonusPoints' ? 'Bonus' : `R${key.replace('review', '')}`;
          messageParts.push(`${delta > 0 ? '+' : ''}${delta} ${fieldName}`);
       }
    });

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'teams', id), updates);
      
      const message = `Team ${teamName} received ${totalDelta > 0 ? '+' : ''}${totalDelta} points (Manual: ${messageParts.join(', ')})`;
      await logActivity('score', message, teamName, totalDelta);
      showToast(`Score applied for ${teamName} (${totalDelta > 0 ? '+' : ''}${totalDelta})`, 'success');
      
      setDraftScores(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleUpdateName = async (id: string, oldName: string, newName: string) => {
    if (isLocked) return;
    if (oldName === newName || !newName.trim()) return;
    await updateDoc(doc(db, 'teams', id), { teamName: newName.trim() });
    await logActivity('system', `Renamed team: ${oldName} -> ${newName.trim()}`, newName.trim());
    showToast(`Renamed ${oldName} to ${newName.trim()}`, 'info');
  }

  // Card Logic
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.name || !newCard.effect || !newCard.icon) return;
    setIsAddingCard(true);
    try {
      await addDoc(collection(db, 'cards'), newCard);
      await logActivity('system', `Created card: ${newCard.name}`);
      showToast(`Forged card: ${newCard.icon} ${newCard.name}`, 'success');
      setNewCard({ name: '', type: 'COMMON', description: '', effect: '', icon: 'Zap' });
    } finally { setIsAddingCard(false); }
  };

  const handleDeleteCard = async (id: string, cardName: string) => {
    if (isLocked) return;
    if (!confirm(`Delete card ${cardName}?`)) return;
    await deleteDoc(doc(db, 'cards', id));
    await logActivity('system', `Deleted card format: ${cardName}`);
    showToast(`Deleted card: ${cardName}`, 'info');
  };

  const handleAssignCard = async (teamId: string, teamName: string, cardId: string) => {
    if (isLocked) return;
    if (!cardId) return;
    const cardInfo = cards.find(c => c.id === cardId);
    await updateDoc(doc(db, 'teams', teamId), {
      cardsOwned: arrayUnion(cardId)
    });
    await logActivity('card', `Team ${teamName} acquired ${cardInfo?.name} card`, teamName);
    showToast(`Card granted: ${cardInfo?.icon} ${cardInfo?.name} -> ${teamName}`, 'success');
  };

  const handleUseCard = async (teamId: string, teamName: string, cardId: string) => {
    if (isLocked) return;
    const cardInfo = cards.find(c => c.id === cardId);
    if (!confirm(`Execute ${cardInfo?.name} for ${teamName}?`)) return;
    
    await updateDoc(doc(db, 'teams', teamId), {
      cardsOwned: arrayRemove(cardId),
      cardsUsed: arrayUnion(cardId)
    });
    await logActivity('card', `Team ${teamName} used ${cardInfo?.name} card`, teamName);
    showToast(`${teamName} executed ${cardInfo?.name}`, 'success');
  };

  const resolveRewardCard = (team: Team, cardIdStr?: string) => {
    let finalCardId: string | null = null;
    if (cardIdStr === 'random') {
       if (cards.length > 0) {
          finalCardId = cards[Math.floor(Math.random() * cards.length)].id;
       }
    } else if (cardIdStr && cardIdStr !== 'none') {
       finalCardId = cardIdStr;
    }
    if (!finalCardId) return null;

    const owned = team.cardsOwned || [];
    if (owned.includes(finalCardId)) return null; // Reject duplicate

    let newOwned = [...owned];
    if (newOwned.length >= 4) {
       newOwned.shift(); // FIFO logic for limit of 4
    }
    newOwned.push(finalCardId);
    return { finalCardId, newOwned };
  };

  // Events Logic
  const handleAddInjection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInjection.title.trim() || !newInjection.description.trim()) return;
    if (newInjection.type === 'selective' && !newInjection.targetTeamId) {
       alert("Please select a target team for this selective phenomenon.");
       return;
    }
    
    setIsAddingInjection(true);
    try {
      await addDoc(collection(db, 'injections'), { ...newInjection, status: 'active' });
      
      if (newInjection.type === 'global') {
         // Apply points to all teams
         if (newInjection.points !== 0) {
            for (const team of teams) {
              const currentScore = Number(team.bonusPoints) || 0;
              await updateDoc(doc(db, 'teams', team.id), { bonusPoints: currentScore + newInjection.points });
            }
         }
         await logActivity('injection', `Injection activated: ${newInjection.title} (${newInjection.points > 0 ? '+' : ''}${newInjection.points} points to all teams)`, undefined, newInjection.points);
      } else {
         // Apply to selective team
         const targetTeam = teams.find(t => t.id === newInjection.targetTeamId);
         if (targetTeam) {
            const updates: Partial<Team> = {};
            let actionMsg = `Injection applied: ${newInjection.title} → ${targetTeam.teamName} (${newInjection.points > 0 ? '+' : ''}${newInjection.points} pts`;

            if (newInjection.points !== 0) {
               updates.bonusPoints = (Number(targetTeam.bonusPoints) || 0) + newInjection.points;
            }

            if (newInjection.rewardCardId && newInjection.rewardCardId !== 'none') {
               const reward = resolveRewardCard(targetTeam, newInjection.rewardCardId);
               if (reward) {
                  updates.cardsOwned = reward.newOwned;
                  const grantedCard = cards.find(c => c.id === reward.finalCardId);
                  actionMsg += grantedCard ? `, +${grantedCard.name} Card` : '';
               }
            }
            actionMsg += ')';

            if (Object.keys(updates).length > 0) {
               await updateDoc(doc(db, 'teams', targetTeam.id), updates);
            }
            await logActivity('injection', actionMsg, targetTeam.teamName, newInjection.points);
            showToast(`Injection targeted: ${targetTeam.teamName} (${newInjection.points > 0 ? '+' : ''}${newInjection.points} pts)`, 'success');
         }
      }
      
      setNewInjection({ title: '', description: '', points: 0, type: 'global', targetTeamId: '', rewardCardId: '' });
    } finally { setIsAddingInjection(false); }
  };

  const handleUpdateInjectionStatus = async (id: string, title: string, status: string) => {
    if (isLocked) return;
    await updateDoc(doc(db, 'injections', id), { status });
    await logActivity('system', `Marked phenomenon ${title} as ${status}`);
    showToast(`Injection ${title} is now ${status}`, 'info');
  };

  const handleAddBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBounty.title.trim() || !newBounty.description.trim()) return;
    setIsAddingBounty(true);
    try {
      await addDoc(collection(db, 'bounties'), { ...newBounty, status: 'active' });
      await logActivity('system', `Issued bounty: ${newBounty.title}`);
      showToast(`Bounty issued: ${newBounty.title}`, 'success');
      setNewBounty({ title: '', description: '', rewardPoints: 0, rewardCardId: '' });
    } finally { setIsAddingBounty(false); }
  };

  const handleCompleteBounty = async () => {
    if (!completingBounty || !selectedTeamForBounty) return;
    
    const team = teams.find(t => t.id === selectedTeamForBounty);
    if (!team) return;

    try {
       const updates: Partial<Team> = {};
       let actionMsg = `Team ${team.teamName} completed bounty: ${completingBounty.title} (+${completingBounty.rewardPoints} pts`;

       if (completingBounty.rewardPoints !== 0) {
          updates.bonusPoints = (Number(team.bonusPoints) || 0) + completingBounty.rewardPoints;
       }

       if (completingBounty.rewardCardId && completingBounty.rewardCardId !== 'none') {
          const reward = resolveRewardCard(team, completingBounty.rewardCardId);
          if (reward) {
             updates.cardsOwned = reward.newOwned;
             const grantedCard = cards.find(c => c.id === reward.finalCardId);
             actionMsg += grantedCard ? `, +${grantedCard.name} Card` : '';
          }
       }
       actionMsg += ')';

       // 1. Update team
       if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'teams', team.id), updates);
       }
       
       // 2. Update bounty status to completed
       await updateDoc(doc(db, 'bounties', completingBounty.id), { status: 'completed' });
       
       // 3. Create activity log
       await logActivity('bounty', actionMsg, team.teamName, completingBounty.rewardPoints);
       showToast(`Bounty complete: ${team.teamName}`, 'success');
       
       // Reset modal
       setCompletingBounty(null);
       setSelectedTeamForBounty('');
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await syncSession('logout');
      router.push('/');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-t-[#39ff14] border-zinc-800 animate-spin"></div></div>;
  }

  const filteredTeams = teams.filter(t => t.teamName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 lg:space-y-8 relative">
      
      {/* TOAST SYSTEM */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
                toast.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                  : 'bg-blue-500/10 border-blue-500/50 text-blue-400'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" /> : <Info className="w-5 h-5" />}
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-2 hover:bg-white/10 p-1 rounded-full transition-colors"
              >
                <X className="w-3 h-3 opacity-70" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <header className="glass-panel p-6 rounded-2xl border neon-border flex flex-col md:flex-row gap-4 md:items-center justify-between shadow-[0_0_30px_rgba(57,255,20,0.05)]">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: '#39ff14', textShadow: '0 0 20px rgba(57, 255, 20, 0.4)' }}>
            Control Room
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm tracking-[0.2em] font-bold uppercase mt-1">Prime Directive Override</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Action Bar */}
          <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
             <div className="relative">
               <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
               <input 
                 type="text" 
                 placeholder="Search Teams..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full sm:w-48 bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-[#39ff14]/50 transition-colors"
               />
             </div>
             
             <button 
               onClick={() => setIsLocked(!isLocked)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all border ${
                 isLocked 
                 ? 'bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' 
                 : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:text-white'
               }`}
             >
               {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
               {isLocked ? 'Locked' : 'Lock'}
             </button>
          </div>

          <button onClick={handleLogout} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors shadow-sm">
            Exit
          </button>
        </div>
      </header>

      <AnimatePresence>
         {isLocked && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="w-full bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            >
               <Lock className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" />
               <span className="font-black uppercase tracking-[0.2em] text-sm drop-shadow-[0_0_8px_currentColor]">Leaderboard Frozen: All Actions Suspended</span>
            </motion.div>
         )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Team */}
        <section className="glass-panel p-5 border border-zinc-800 rounded-2xl">
          <h2 className="text-lg font-bold mb-4 text-[#39ff14] uppercase">Team Registry</h2>
          <form onSubmit={handleAddTeam} className="flex gap-3">
            <input type="text" placeholder="Team Name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 focus:outline-none focus:border-[#39ff14] font-bold" disabled={isAddingTeam || isLocked} />
            <button type="submit" disabled={isAddingTeam || !newTeamName.trim() || isLocked} className="bg-[#39ff14]/20 hover:bg-[#39ff14]/40 border border-[#39ff14] text-[#39ff14] px-6 py-2 rounded-lg font-black uppercase tracking-widest disabled:opacity-50 transition-colors">Deploy</button>
          </form>
        </section>

        {/* Deck Builder */}
        <section className="glass-panel p-5 border border-zinc-800 rounded-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[#39ff14] uppercase flex justify-between">
            Deck Builder
            <span className="text-xs text-zinc-500">{cards.length} Configured</span>
          </h2>
          
          <form onSubmit={handleAddCard} className="space-y-3">
            <div className="flex gap-3">
              <select value={newCard.icon} onChange={e => setNewCard({...newCard, icon: e.target.value})} className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-center" required>
                {Object.keys(CARD_ICONS).map(iconName => (
                  <option key={iconName} value={iconName}>{iconName}</option>
                ))}
              </select>
              <input type="text" placeholder="Card Name" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white" required />
              <select 
                value={newCard.type} 
                onChange={e => {
                  const newType = e.target.value as any;
                  // Auto-switch icon based on category, user can override later
                  let defaultIcon = newCard.icon;
                  if (newType === 'COMMON') defaultIcon = 'Zap';
                  if (newType === 'RARE') defaultIcon = 'Shield';
                  if (newType === 'LEGENDARY') defaultIcon = 'Crown';
                  
                  setNewCard({...newCard, type: newType, icon: defaultIcon});
                }} 
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 font-bold uppercase tracking-widest text-xs"
              >
                <option value="COMMON" className="text-[#39ff14]">Common</option>
                <option value="RARE" className="text-purple-400">Rare</option>
                <option value="LEGENDARY" className="text-yellow-400">Legendary</option>
              </select>
            </div>
            <div className="flex gap-3">
              <input type="text" placeholder="Description" value={newCard.description} onChange={e => setNewCard({...newCard, description: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              <input type="text" placeholder="Effect (+50 Pts)" value={newCard.effect} onChange={e => setNewCard({...newCard, effect: e.target.value})} className="w-1/3 bg-zinc-900 border border-zinc-700 text-[#39ff14] font-mono rounded-lg px-3 py-2 uppercase placeholder:normal-case placeholder:text-zinc-600 tracking-wider" required />
              <button type="submit" disabled={isAddingCard || !newCard.name || !newCard.effect || isLocked} className="bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/40 px-6 rounded-lg uppercase font-bold text-sm tracking-widest transition-colors disabled:opacity-50">Forge</button>
            </div>
          </form>

          {/* Live Preview Panel */}
          <div className="mt-2 pt-4 border-t border-zinc-800">
             <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-3">Live Hologram Preview</div>
             <div className="max-w-[300px] mx-auto scale-95 origin-top">
                {(() => {
                   let borderClass = 'border-[#39ff14]/30 shadow-[0_0_15px_rgba(57,255,20,0.05)]';
                   let glowClass = 'bg-[#39ff14]';
                   let textClass = 'text-[#39ff14] border-[#39ff14]/30 bg-[#39ff14]/10';
                   let cardGlowEffect = '';
                   
                   if (newCard.type === 'RARE') {
                      borderClass = 'border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)] bg-gradient-to-br from-zinc-900 to-purple-900/10';
                      glowClass = 'bg-purple-500';
                      textClass = 'text-purple-400 border-purple-500/40 bg-purple-500/10';
                   } else if (newCard.type === 'LEGENDARY') {
                      borderClass = 'border-yellow-500/60 shadow-[0_0_25px_rgba(234,179,8,0.15)] bg-gradient-to-br from-zinc-900 via-zinc-900 to-yellow-900/20';
                      glowClass = 'bg-yellow-500';
                      textClass = 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
                      cardGlowEffect = 'animate-[pulse_4s_ease-in-out_infinite_alternate]';
                   }

                   const IconComp = CARD_ICONS[newCard.icon as keyof typeof CARD_ICONS] || CARD_ICONS.CircleSlash;

                   return (
                     <div className={`glass-panel p-5 rounded-3xl border relative overflow-hidden transition-all duration-300 ${borderClass} ${cardGlowEffect}`}>
                       <div className={`absolute -top-12 -right-12 w-32 h-32 blur-[50px] opacity-30 ${glowClass}`}></div>
                       {newCard.type === 'LEGENDARY' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none z-20"></div>
                       )}
                       
                       <div className="flex flex-col h-full relative z-10 min-h-[160px]">
                          <div className="flex items-start justify-between mb-4">
                             <div className={`text-3xl p-3 rounded-2xl border bg-zinc-950 shadow-inner ${textClass}`}>
                               <IconComp className="w-6 h-6 drop-shadow-[0_0_8px_currentColor]" />
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded border shadow-sm ${textClass}`}>
                               {newCard.type}
                             </span>
                          </div>
                          <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">{newCard.name || 'Undefined'}</h3>
                          <p className="text-xs text-zinc-400 mb-6 flex-1 font-medium">{newCard.description || 'Awaiting structural data...'}</p>
                          <div className="pt-3 border-t border-zinc-800">
                             <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Effect Sequence</div>
                             <div className={`text-xs font-mono font-black tracking-wider px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 ${textClass.split(' ')[0]}`}>
                               {newCard.effect || 'NULL'}
                             </div>
                          </div>
                       </div>
                     </div>
                   );
                })()}
             </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manage Injections */}
        <section className="glass-panel p-5 border border-zinc-800 rounded-2xl">
          <h2 className="text-lg font-bold mb-4 text-red-500 uppercase flex justify-between">
            Global Phenomena
            <span className="text-xs text-zinc-500">{injections.filter(i => i.status === 'active').length} Active</span>
          </h2>
          <form onSubmit={handleAddInjection} className="space-y-3 mb-4">
            <div className="flex gap-3">
              <input type="text" placeholder="Phenomenon Title" value={newInjection.title} onChange={e => setNewInjection({...newInjection, title: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm" required />
              <input type="number" placeholder="Pts" value={newInjection.points || ''} onChange={e => setNewInjection({...newInjection, points: Number(e.target.value)})} className="w-20 bg-zinc-900 border border-zinc-700 text-red-400 font-mono rounded-lg px-3 py-2 text-sm text-center" />
              <select value={newInjection.type} onChange={e => setNewInjection({ ...newInjection, type: e.target.value as 'global' | 'selective', targetTeamId: '' })} className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs">
                 <option value="global">Global Effect</option>
                 <option value="selective">Target Team</option>
              </select>
            </div>
            
            {newInjection.type === 'selective' && (
              <div className="flex gap-3">
                <select value={newInjection.targetTeamId} onChange={e => setNewInjection({ ...newInjection, targetTeamId: e.target.value })} className="flex-1 bg-red-900/20 border border-red-500/50 text-red-200 rounded-lg px-3 py-2 text-xs" required>
                   <option value="" disabled>Select target team to inject...</option>
                   {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                </select>
                <select value={newInjection.rewardCardId || ''} onChange={e => setNewInjection({ ...newInjection, rewardCardId: e.target.value })} className="w-1/3 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest">
                   <option value="none">No Card Drop</option>
                   <option value="random">🎲 Random Card</option>
                   {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-3">
               <input type="text" placeholder="Description & requirements..." value={newInjection.description} onChange={e => setNewInjection({...newInjection, description: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs" required />
               <button type="submit" disabled={isAddingInjection || !newInjection.title || (newInjection.type === 'selective' && !newInjection.targetTeamId) || isLocked} className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40 px-4 rounded-lg uppercase tracking-widest text-xs font-bold transition-colors disabled:opacity-50">Deploy</button>
            </div>
          </form>
          <div className="space-y-2 max-h-40 overflow-y-auto">
             {injections.map(inj => (
               <div key={inj.id} className="flex justify-between items-center p-2 rounded-lg bg-zinc-800/30 border border-red-500/20">
                 <div className="flex-1 line-clamp-1">
                   <span className={`text-xs font-bold uppercase ${inj.status === 'active' ? 'text-red-400' : 'text-zinc-500'}`}>{inj.title}</span>
                   <span className="text-[10px] text-zinc-500 ml-2">{inj.points} PTS</span>
                 </div>
                 <select value={inj.status} onChange={(e) => handleUpdateInjectionStatus(inj.id, inj.title, e.target.value)} className={`text-[10px] bg-zinc-900 border px-2 py-1 rounded uppercase tracking-widest font-bold ${inj.status === 'active' ? 'text-red-400 border-red-500' : 'text-zinc-500 border-zinc-700'}`}>
                   <option value="active">Active</option>
                   <option value="resolved">Resolved</option>
                 </select>
               </div>
             ))}
          </div>
        </section>

        {/* Manage Bounties */}
        <section className="glass-panel p-5 border border-zinc-800 rounded-2xl">
          <h2 className="text-lg font-bold mb-4 text-purple-500 uppercase flex justify-between">
            Bounty Board
            <span className="text-xs text-zinc-500">{bounties.filter(b => b.status === 'active').length} Active</span>
          </h2>
          <form onSubmit={handleAddBounty} className="space-y-3 mb-4">
            <div className="flex gap-3">
              <input type="text" placeholder="Bounty Objective" value={newBounty.title} onChange={e => setNewBounty({...newBounty, title: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm" required />
              <input type="number" placeholder="Pts (e.g. 100)" value={newBounty.rewardPoints || ''} onChange={e => setNewBounty({...newBounty, rewardPoints: Number(e.target.value)})} className="w-24 bg-zinc-900 border border-zinc-700 text-purple-400 font-mono rounded-lg px-3 py-2 text-sm text-center" />
              <select value={newBounty.rewardCardId || ''} onChange={e => setNewBounty({ ...newBounty, rewardCardId: e.target.value })} className="w-1/3 bg-zinc-900 border border-zinc-700 text-purple-300 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest focus:border-purple-500 outline-none">
                 <option value="none">No Card Drop</option>
                 <option value="random">🎲 Random Card</option>
                 {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
            <div className="flex gap-3">
               <input type="text" placeholder="Description & rewards..." value={newBounty.description} onChange={e => setNewBounty({...newBounty, description: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs" required />
               <button type="submit" disabled={isAddingBounty || !newBounty.title || isLocked} className="bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/40 px-4 rounded-lg uppercase tracking-widest text-xs font-bold transition-colors disabled:opacity-50">Issue</button>
            </div>
          </form>
          <div className="space-y-2 max-h-40 overflow-y-auto">
             {bounties.map(bounty => (
               <div key={bounty.id} className="flex justify-between items-center p-2 rounded-lg bg-zinc-800/30 border border-purple-500/20">
                 <div className="flex-1 line-clamp-1">
                   <span className={`text-xs font-bold uppercase ${bounty.status === 'active' ? 'text-purple-400' : 'text-zinc-500'}`}>{bounty.title}</span>
                   <span className="text-[10px] text-zinc-500 ml-2">+{bounty.rewardPoints} PTS</span>
                 </div>
                 {bounty.status === 'active' ? (
                    <button type="button" disabled={isLocked} onClick={() => setCompletingBounty(bounty)} className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/40 px-3 py-1.5 rounded uppercase font-bold transition-colors disabled:opacity-50">
                      Complete
                    </button>
                 ) : (
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest px-2">Finished</span>
                 )}
               </div>
             ))}
          </div>
        </section>
      </div>

      {/* Team Listing & Control */}
      <section className={`glass-panel p-4 md:p-6 rounded-2xl border border-zinc-800 overflow-x-auto ${isLocked ? 'opacity-50 pointer-events-none filter grayscale-[30%]' : ''}`}>
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[minmax(150px,2fr)_repeat(4,1fr)_1.5fr_4fr_1fr] gap-4 pb-4 border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-400 px-2 justify-items-center">
             <div className="justify-self-start">Team Name</div>
             <div>R1</div>
             <div>R2</div>
             <div>R3</div>
             <div>Bonus</div>
             <div className="text-[#39ff14]">Total</div>
             <div className="w-full text-left border-l border-zinc-800 pl-4">Power Cards Action Center</div>
             <div className="justify-self-end">Delete</div>
          </div>
          
          <div className="space-y-4 mt-4 relative">
             <AnimatePresence>
               {filteredTeams.length === 0 && (
                 <div className="text-center py-10 text-zinc-500 font-bold uppercase tracking-widest text-sm italic">No teams matching "{searchQuery}"</div>
               )}
               {filteredTeams.map(team => {
                 // Calculate local dynamic total score strictly locally (since admin might be drafting)
                 const r1 = draftScores[team.id]?.review1 ?? (Number(team.review1) || 0);
                 const r2 = draftScores[team.id]?.review2 ?? (Number(team.review2) || 0);
                 const r3 = draftScores[team.id]?.review3 ?? (Number(team.review3) || 0);
                 const b = draftScores[team.id]?.bonusPoints ?? (Number(team.bonusPoints) || 0);
                 const total = r1 + r2 + r3 + b;
                 
                 const hasDraftChanges = draftScores[team.id] && (['review1', 'review2', 'review3', 'bonusPoints'] as const).some(k => draftScores[team.id]![k] !== undefined && draftScores[team.id]![k] !== team[k]);

                 return (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, height: 0 }}
                     key={team.id} 
                     className="grid grid-cols-[minmax(150px,2fr)_repeat(4,1fr)_1.5fr_4fr_1fr] gap-4 items-center p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors border border-zinc-800/50"
                   >
                     {/* Team Name */}
                     <div>
                       <input type="text" defaultValue={team.teamName} disabled={isLocked} onBlur={(e) => handleUpdateName(team.id, team.teamName, e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#39ff14] text-white font-bold py-1 focus:outline-none transition-colors" />
                     </div>
                     
                     {/* Scores */}
                     <div>
                       <input type="number" disabled={isLocked} value={draftScores[team.id]?.review1 ?? team.review1} onChange={(e) => handleDraftChange(team.id, 'review1', Number(e.target.value))} className={`w-full bg-zinc-900 border ${draftScores[team.id]?.review1 !== undefined && draftScores[team.id]?.review1 !== team.review1 ? 'border-[#39ff14] text-[#39ff14]' : 'border-zinc-700 text-white'} text-center rounded py-2 focus:border-[#39ff14] focus:outline-none font-mono`} />
                     </div>
                     <div>
                       <input type="number" disabled={isLocked} value={draftScores[team.id]?.review2 ?? team.review2} onChange={(e) => handleDraftChange(team.id, 'review2', Number(e.target.value))} className={`w-full bg-zinc-900 border ${draftScores[team.id]?.review2 !== undefined && draftScores[team.id]?.review2 !== team.review2 ? 'border-[#39ff14] text-[#39ff14]' : 'border-zinc-700 text-white'} text-center rounded py-2 focus:border-[#39ff14] focus:outline-none font-mono`} />
                     </div>
                     <div>
                       <input type="number" disabled={isLocked} value={draftScores[team.id]?.review3 ?? team.review3} onChange={(e) => handleDraftChange(team.id, 'review3', Number(e.target.value))} className={`w-full bg-zinc-900 border ${draftScores[team.id]?.review3 !== undefined && draftScores[team.id]?.review3 !== team.review3 ? 'border-[#39ff14] text-[#39ff14]' : 'border-zinc-700 text-white'} text-center rounded py-2 focus:border-[#39ff14] focus:outline-none font-mono`} />
                     </div>
                     <div>
                       <input type="number" disabled={isLocked} value={draftScores[team.id]?.bonusPoints ?? team.bonusPoints} onChange={(e) => handleDraftChange(team.id, 'bonusPoints', Number(e.target.value))} className={`w-full bg-zinc-900 border ${draftScores[team.id]?.bonusPoints !== undefined && draftScores[team.id]?.bonusPoints !== team.bonusPoints ? 'border-[#39ff14] text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.3)]' : 'border-yellow-500/50 text-[#39ff14]'} text-center rounded py-2 focus:border-[#39ff14] focus:outline-none font-mono font-bold`} />
                     </div>

                     {/* Total Display */}
                     <div className={`font-black font-mono text-center text-xl bg-black/40 rounded-lg py-1.5 border ${hasDraftChanges ? 'text-zinc-500 border-dashed border-zinc-700' : 'text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] border-[#39ff14]/30 bg-[#39ff14]/5'}`}>
                        {total}
                     </div>

                     {/* Card Actions */}
                     <div className="w-full border-l border-zinc-800 pl-4 space-y-2 flex flex-col justify-center">
                       {/* Available Mini-Cards (Scrollable row) */}
                       <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700 w-full pr-2">
                         {cards.map(c => {
                           const IconComp = CARD_ICONS[c.icon as keyof typeof CARD_ICONS] || CARD_ICONS.Zap;
                           const isSelected = selectedCards[team.id] === c.id;
                           return (
                             <div key={c.id} className="flex-shrink-0 flex flex-row items-center gap-1">
                               <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedCards(prev => ({ ...prev, [team.id]: isSelected ? '' : c.id }))} 
                                  disabled={isLocked}
                                  className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors border ${isSelected ? 'bg-blue-900/60 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-blue-500/50 text-zinc-400'}`}
                                  title={`Select ${c.name}`}
                               >
                                 <IconComp className="w-4 h-4" />
                                 <span className={`text-[10px] uppercase font-bold max-w-[60px] truncate ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{c.name}</span>
                               </motion.button>
                               <AnimatePresence>
                                 {isSelected && (
                                   <motion.button
                                      initial={{ opacity: 0, scale: 0.5, width: 0 }}
                                      animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                      exit={{ opacity: 0, scale: 0.5, width: 0 }}
                                      onClick={() => {
                                        handleAssignCard(team.id, team.teamName, c.id);
                                        setSelectedCards(prev => {
                                          const next = {...prev};
                                          delete next[team.id];
                                          return next;
                                        });
                                      }}
                                      className="bg-blue-500 hover:bg-blue-400 text-white text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                                   >
                                     GIVE
                                   </motion.button>
                                 )}
                               </AnimatePresence>
                             </div>
                           );
                         })}
                         {cards.length === 0 && <span className="text-[10px] text-zinc-600 italic">No cards inside Deck Builder</span>}
                       </div>
                       
                       {/* Owned Cards (Click to Execute) */}
                       <div className="flex flex-wrap gap-1.5 mt-1 border-t border-zinc-800/50 pt-1">
                         {(team.cardsOwned || []).length === 0 && <span className="text-[10px] text-zinc-600 italic">Holding zero cards</span>}
                         {(team.cardsOwned || []).map((cardId, i) => {
                           const c = cards.find(ca => ca.id === cardId);
                           if(!c) return null;
                           return (
                             <button key={`${cardId}-${i}`} disabled={isLocked} onClick={() => handleUseCard(team.id, team.teamName, cardId)} className="flex items-center gap-1 bg-zinc-800 border border-zinc-600 hover:border-red-500 hover:bg-red-500/20 px-2 py-0.5 rounded text-[10px] text-white group transition-colors">
                               {c.icon} <span className="group-hover:hidden">{c.name}</span>
                               <span className="hidden group-hover:inline text-red-400 font-bold tracking-widest">EXECUTE</span>
                             </button>
                           );
                         })}
                       </div>
                     </div>

                     {/* Delete & Apply */}
                     <div className="text-right flex flex-col justify-center items-end gap-2 pr-2">
                       {hasDraftChanges && (
                         <button onClick={() => handleApplyScore(team.id, team.teamName)} className="text-[#39ff14] hover:text-white font-black uppercase text-xs tracking-widest bg-[#39ff14]/20 hover:bg-[#39ff14]/40 border border-[#39ff14] px-3 py-1.5 rounded w-full whitespace-nowrap shadow-[0_0_10px_rgba(57,255,20,0.3)] animate-pulse">Apply</button>
                       )}
                       <button disabled={isLocked} onClick={() => handleDeleteTeam(team.id, team.teamName)} className="text-red-500 hover:text-red-400 font-bold uppercase text-[10px] tracking-widest bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded w-full disabled:opacity-50 transition-colors">Del</button>
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Bounty Completion Modal */}
      {completingBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-purple-500/50 p-6 rounded-2xl w-full max-w-md shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <h3 className="text-xl font-black text-purple-400 uppercase mb-2 flex items-center gap-2">Complete Bounty</h3>
            <p className="text-sm text-zinc-400 mb-6 font-mono">"{completingBounty.title}" (+{completingBounty.rewardPoints} PTS)</p>
            
            <div className="space-y-4">
              <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Select Team Who Completed This Bounty</label>
              <select 
                value={selectedTeamForBounty} 
                onChange={(e) => setSelectedTeamForBounty(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl p-3 focus:outline-none focus:border-purple-500"
              >
                <option value="" disabled>Select a team...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.teamName}</option>)}
              </select>
            </div>
            
            <div className="mt-8 flex gap-3 justify-end">
              <button 
                onClick={() => { setCompletingBounty(null); setSelectedTeamForBounty(''); }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                disabled={!selectedTeamForBounty}
                onClick={handleCompleteBounty}
                className="px-6 py-2 rounded-lg text-sm font-black bg-purple-500 text-white hover:bg-purple-400 focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transition-all"
              >
                Award Points
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
