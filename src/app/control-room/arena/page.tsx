"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  arrayUnion,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArenaBox, ArenaSelection, ArenaState, Team, Card } from "@/types";
import { 
  ShieldCheck, 
  Cpu, 
  RefreshCw, 
  Zap, 
  Eye, 
  Trash2, 
  AlertTriangle,
  Lock,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ArenaAdmin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [boxes, setBoxes] = useState<ArenaBox[]>([]);
  const [selections, setSelections] = useState<ArenaSelection[]>([]);
  const [arenaState, setArenaState] = useState<ArenaState>({ isRevealed: false });
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Pod Creator State
  const [newPodCard1, setNewPodCard1] = useState<string>("");
  const [newPodCard2, setNewPodCard2] = useState<string>("");

  // Route Protection
  useEffect(() => {
    const isAuth = typeof window !== 'undefined' ? sessionStorage.getItem('adminAuth') : null;
    if (!isAuth) {
      router.replace('/control-room/login');
    } else {
      setIsAdminAuthenticated(true);
    }
  }, [router]);

  // Firestore Listeners
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
    });
    const unsubCards = onSnapshot(collection(db, "cards"), (snap) => {
      setCards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Card)));
    });
    const unsubBoxes = onSnapshot(collection(db, "cardBoxes"), (snap) => {
      setBoxes(snap.docs.map(d => ({ id: d.id, ...d.data() } as ArenaBox)));
    });
    const unsubSelections = onSnapshot(collection(db, "teamSelections"), (snap) => {
      setSelections(snap.docs.map(d => ({ id: d.id, ...d.data() } as ArenaSelection)));
    });
    const unsubState = onSnapshot(doc(db, "arenaState", "global"), (doc) => {
      if (doc.exists()) setArenaState(doc.data() as ArenaState);
    });

    return () => {
      unsubTeams();
      unsubCards();
      unsubBoxes();
      unsubSelections();
      unsubState();
    };
  }, [isAdminAuthenticated]);

  // Background loop for deadline timeout
  useEffect(() => {
    if (!arenaState.selectionDeadline || arenaState.isRevealed || arenaState.isRevealing || isProcessing) return;

    const interval = setInterval(() => {
      if (Date.now() >= arenaState.selectionDeadline!) {
        console.log("Deadline reached! Auto-triggering reveal sequence...");
        triggerRevealProcess();
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaState, teams, boxes, selections, isProcessing]);

  // --- Actions ---

  const handleAddPod = async () => {
    if (!newPodCard1 || !newPodCard2) {
      return alert("🛑 You must select exactly 2 cards to create a pod.");
    }
    
    setIsProcessing(true);
    try {
      const colors = ["#3b82f6", "#eab308", "#a855f7", "#06b6d4", "#22c55e"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const boxId = `pod-${boxes.length + 1}-${Math.random().toString(36).substring(2, 7)}`;
      
      const boxRef = doc(db, "cardBoxes", boxId);
      await setDoc(boxRef, {
        id: boxId,
        cards: [newPodCard1, newPodCard2],
        color: randomColor
      });

      setNewPodCard1("");
      setNewPodCard2("");
    } catch (e) {
      console.error(e);
      alert("Failed to generate pod.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTimer = async () => {
    if (arenaState.isRevealed || isProcessing || boxes.length === 0) return;
    if (!confirm("Start 2-minute selection countdown?")) return;
    try {
      await updateDoc(doc(db, "arenaState", "global"), {
        selectionDeadline: Date.now() + 120000 // 2 mins
      });
    } catch (e) {
      console.error(e);
    }
  };

  const autoAssignMissingSelections = async (batch: any, currentSelections: ArenaSelection[]) => {
    const unselectedTeams = teams.filter(t => !currentSelections.some(s => s.teamId === t.id));
    if (unselectedTeams.length === 0) return currentSelections;

    const usedBoxIds = new Set(currentSelections.map(s => s.selectedBoxId));
    let availableBoxes = boxes.filter(b => !usedBoxIds.has(b.id));
    const newSelections = [...currentSelections];

    for (const team of unselectedTeams) {
      if (availableBoxes.length === 0) {
        console.warn(`No more boxes available for team ${team.teamName}`);
        break; 
      }
      const randomIdx = Math.floor(Math.random() * availableBoxes.length);
      const chosenBox = availableBoxes.splice(randomIdx, 1)[0];

      const newSelectionRef = doc(db, "teamSelections", team.id);
      batch.set(newSelectionRef, {
        id: team.id,
        teamId: team.id,
        selectedBoxId: chosenBox.id,
        isLocked: true,
      });

      newSelections.push({
        id: team.id,
        teamId: team.id,
        selectedBoxId: chosenBox.id,
        isLocked: true,
      });
    }
    return newSelections;
  };

  const triggerRevealProcess = async () => {
    if (arenaState.isRevealed || isProcessing) return;
    setIsProcessing(true);

    try {
      const batch1 = writeBatch(db);
      
      // 1. Auto-assign missing & clear deadline & trigger animation
      const finalSelections = await autoAssignMissingSelections(batch1, selections);
      const stateRef = doc(db, "arenaState", "global");
      batch1.set(stateRef, { isRevealing: true, isRevealed: false, selectionDeadline: null }, { merge: true });
      await batch1.commit();

      // 2. Cinematic Delay Wait (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. Fulfillment Loop
      const batch2 = writeBatch(db);
      let assignedCount = 0;

      for (const selection of finalSelections) {
        const team = teams.find(t => t.id === selection.teamId);
        const box = boxes.find(b => b.id === selection.selectedBoxId);

        if (team && box) {
          const teamRef = doc(db, "teams", team.id);
          
          // Use arrayUnion to safely add multiple cards
          batch2.update(teamRef, { 
            cardsOwned: arrayUnion(...box.cards)
          });

          const logRef = doc(collection(db, "activityLogs"));
          batch2.set(logRef, {
            actionType: "system",
            message: `Arena Payload Delivered: 2 Cards assigned to ${team.teamName}`,
            teamName: team.teamName,
            timestamp: Date.now()
          });

          assignedCount++;
        }
      }

      // 4. Finalize Reveal
      batch2.update(stateRef, { isRevealing: false, isRevealed: true });
      await batch2.commit();

      alert(`✅ Reveal complete. Distributed cards to ${assignedCount} teams.`);
    } catch (e) {
      console.error(e);
      alert("Reveal Protocol failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevealAll = async () => {
    if (boxes.length === 0) return alert("System Error: No pods generated to reveal.");
    if (arenaState.isRevealed) return;
    
    if (!confirm("🚨 REVEAL PROTOCOL: This will lock missing teams, run cinematic delay, and permanently assign cards. Proceed?")) return;
    await triggerRevealProcess();
  };

  const handleResetArena = async () => {
    if (!confirm("⚠️ RESET ARENA: This will clear all pods and selections. Already assigned cards in team inventories will NOT be removed. Continue?")) return;

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      const boxesSnap = await getDocs(collection(db, "cardBoxes"));
      boxesSnap.docs.forEach(d => batch.delete(d.ref));
      
      const selectsSnap = await getDocs(collection(db, "teamSelections"));
      selectsSnap.docs.forEach(d => batch.delete(d.ref));

      const stateRef = doc(db, "arenaState", "global");
      batch.set(stateRef, { isRevealed: false }, { merge: true });

      await batch.commit();
      alert("Arena system reset.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAdminAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-mono p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <Link href="/control-room" className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 mb-1 transition-colors uppercase tracking-widest">
              <ChevronLeft className="w-3 h-3" /> Back to Bridge
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
              Arena <span className="text-red-500">Command</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!arenaState.selectionDeadline && !arenaState.isRevealed && (
            <button
              onClick={handleStartTimer}
              disabled={isProcessing || boxes.length === 0}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
            >
              <Timer className="w-4 h-4" /> Start Timer
            </button>
          )}

          <button
            onClick={handleRevealAll}
            disabled={isProcessing || arenaState.isRevealed || arenaState.isRevealing || boxes.length === 0}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-[0_4px_20px_rgba(220,38,38,0.3)]"
          >
             {(isProcessing || arenaState.isRevealing) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Reveal All
          </button>

          <button
            onClick={handleResetArena}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-4 py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-widest border border-zinc-700 hover:border-zinc-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Connection Stats */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Manual Pod Creator */}
          {!arenaState.isRevealed && !arenaState.isRevealing && (
            <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6 font-bold flex items-center gap-2">
                <RefreshCw className="w-3 h-3 text-[#39ff14]" /> Deploy Mystery Pod
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Card 1</label>
                  <select
                    value={newPodCard1}
                    onChange={(e) => setNewPodCard1(e.target.value)}
                    className="w-full bg-black border border-zinc-700 text-white p-2 rounded-lg text-sm outline-none focus:border-[#39ff14]"
                  >
                    <option value="">-- SELECT CARD --</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.icon || '🃏'} {c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Card 2</label>
                  <select
                    value={newPodCard2}
                    onChange={(e) => setNewPodCard2(e.target.value)}
                    className="w-full bg-black border border-zinc-700 text-white p-2 rounded-lg text-sm outline-none focus:border-[#39ff14]"
                  >
                    <option value="">-- SELECT CARD --</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.icon || '🃏'} {c.name}</option>)}
                  </select>
                </div>

                <button
                  onClick={handleAddPod}
                  disabled={isProcessing || !newPodCard1 || !newPodCard2}
                  className="w-full bg-zinc-100 hover:bg-white text-black px-4 py-2.5 rounded-lg font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 mt-2"
                >
                  Create & Deploy Pod
                </button>
              </div>
            </div>
          )}

          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6 font-bold flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-400" /> System Integrity
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Team Units</span>
                <span className="text-white font-bold">{teams.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Pods Created</span>
                <span className="text-white font-bold">{boxes.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Teams Locked</span>
                <span className="text-[#39ff14] font-bold">{selections.length} / {teams.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Remaining</span>
                <span className="text-yellow-400 font-bold">{Math.max(0, teams.length - selections.length)}</span>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-zinc-500">Phase</span>
                <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest ${arenaState.isRevealed ? "bg-red-500/20 text-red-500" : arenaState.isRevealing ? "bg-purple-500/20 text-purple-400 animate-pulse" : "bg-cyan-500/20 text-cyan-400"}`}>
                  {arenaState.isRevealed ? "Post-Reveal" : arenaState.isRevealing ? "Revealing..." : "Acquisition"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl overflow-hidden relative">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-6 font-bold flex items-center gap-2">
              <Lock className="w-3 h-3" /> Lock Registry
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {teams.map(team => {
                const selection = selections.find(s => s.teamId === team.id);
                return (
                  <div key={team.id} className="flex items-center justify-between gap-4 p-3 bg-black/40 rounded-lg border border-zinc-800/50">
                    <span className="text-xs font-bold truncate text-zinc-400">{team.teamName}</span>
                    {selection ? (
                      <CheckCircle2 className="w-4 h-4 text-[#39ff14] shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Monitor Node Grid */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl min-h-[600px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs uppercase tracking-widest text-white font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-500" /> Live Node Monitor
              </h2>
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-red-500" />}
            </div>

            {boxes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-600 grayscale">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                <p className="uppercase tracking-[0.2em] text-[10px]">No active deployment detected</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-[#39ff14] opacity-50">Create Pods using the panel above</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {boxes.map((box, idx) => {
                    const selection = selections.find(s => s.selectedBoxId === box.id);
                    const team = selection ? teams.find(t => t.id === selection.teamId) : null;
                    const boxCards = cards.filter(c => box.cards?.includes(c.id));

                    return (
                      <motion.div
                        key={box.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`
                          relative aspect-square rounded-xl p-4 border flex flex-col items-center justify-center text-center transition-all duration-300
                          ${selection 
                            ? "bg-[#39ff14]/5 border-[#39ff14]/20 shadow-[0_0_15px_rgba(57,255,20,0.05)]" 
                            : "bg-zinc-800/20 border-zinc-800"}
                        `}
                      >
                        <span className="absolute top-2 left-2 text-[8px] font-black text-zinc-600 uppercase">NODE-{idx+1}</span>
                        
                        <div className="mb-3">
                          {selection ? (
                            <div className="relative">
                              <Cpu className="w-10 h-10 text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                              <div className="absolute -top-1 -right-1">
                                <CheckCircle2 className="w-4 h-4 text-[#39ff14] fill-black" />
                              </div>
                            </div>
                          ) : (
                            <Cpu className="w-10 h-10 text-zinc-700" />
                          )}
                        </div>

                        <div className="w-full">
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 truncate px-1 ${selection ? "text-[#39ff14]" : "text-zinc-600"}`}>
                            {team ? team.teamName : "WAITING..."}
                          </p>
                          
                          {arenaState.isRevealed && (
                            <div className="mt-2 space-y-1">
                              {boxCards.map(c => (
                                <div key={c.id} className={`text-[7px] font-bold p-0.5 rounded border uppercase ${c.rarity === 'RARE' ? 'bg-purple-900/40 text-purple-400 border-purple-500/30' : 'bg-blue-900/20 text-blue-400 border-blue-500/20'}`}>
                                  {c.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
