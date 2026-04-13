"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArenaBox, ArenaSelection, ArenaState, Team, Card } from "@/types";
import { Zap, Lock, ShieldAlert, Cpu, Orbit } from "lucide-react";

export default function SelectionZone() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [boxes, setBoxes] = useState<ArenaBox[]>([]);
  const [selections, setSelections] = useState<ArenaSelection[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [arenaState, setArenaState] = useState<ArenaState>({ isRevealed: false });
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!arenaState.selectionDeadline || arenaState.isRevealed) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((arenaState.selectionDeadline! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [arenaState.selectionDeadline, arenaState.isRevealed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team)));
    });
    const unsubBoxes = onSnapshot(collection(db, "cardBoxes"), (snap) => {
      setBoxes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArenaBox)));
    });
    const unsubSelections = onSnapshot(collection(db, "teamSelections"), (snap) => {
      setSelections(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArenaSelection)));
    });
    const unsubCards = onSnapshot(collection(db, "cards"), (snap) => {
      setCards(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card)));
    });
    const unsubState = onSnapshot(doc(db, "arenaState", "global"), (doc) => {
      if (doc.exists()) setArenaState(doc.data() as ArenaState);
    });

    return () => {
      unsubTeams();
      unsubBoxes();
      unsubSelections();
      unsubCards();
      unsubState();
    };
  }, []);

  const handleSelectBox = async (boxId: string) => {
    if (arenaState.isRevealed || arenaState.isRevealing || timeLeft === 0) return; // Prevent selection during/after reveal

    if (!selectedTeamId) {
      alert("Please authenticate your team first (Select from dropdown).");
      return;
    }

    // Validation: Has this team already selected?
    const hasSelected = selections.some((s) => s.teamId === selectedTeamId);
    if (hasSelected) {
      alert("Your team has already secured an Energy Node.");
      return;
    }

    // Validation: Is this box already selected?
    const isBoxSelected = selections.some((s) => s.selectedBoxId === boxId);
    if (isBoxSelected) {
      alert("This Energy Node has already been secured by another team.");
      return;
    }

    try {
      // Save selection
      const selectionRef = doc(db, "teamSelections", selectedTeamId);
      await setDoc(selectionRef, {
        id: selectedTeamId,
        teamId: selectedTeamId,
        selectedBoxId: boxId,
        isLocked: true,
      });
    } catch (e) {
      console.error("Lock failed:", e);
      alert("System synchronization failure. Try again.");
    }
  };

  const getTeamSelection = () => {
    if (!selectedTeamId) return null;
    return selections.find((s) => s.teamId === selectedTeamId);
  };

  const mySelection = getTeamSelection();
  const isInputLocked = mySelection !== undefined || arenaState.isRevealed || arenaState.isRevealing || timeLeft === 0;

  return (
    <main className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.02] pointer-events-none"></div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="z-10 w-full max-w-5xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <Orbit className="w-10 h-10 animate-[spin_10s_linear_infinite] text-[#39ff14]" />
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
              Selection Zone
            </h1>
            <p className="text-zinc-500 uppercase tracking-[0.3em] text-xs mt-2">
              Secure your Energy Node
            </p>
            {timeLeft !== null && !arenaState.isRevealed && !arenaState.isRevealing && (
              <div className="mt-4 inline-block bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm font-black tracking-widest animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                TIME REMAINING: {formatTime(timeLeft)}
              </div>
            )}
            {arenaState.isRevealing && (
              <div className="mt-4 inline-block bg-purple-500/20 border border-purple-500/50 text-purple-400 px-4 py-2 rounded-lg text-sm font-black tracking-widest animate-[pulse_0.4s_ease-in-out_infinite] shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                SYNCHRONIZING REVEAL...
              </div>
            )}
          </div>
        </div>

        {/* Team Selector UI */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl backdrop-blur-md w-full md:w-auto">
          <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
            System Identity
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            disabled={isInputLocked}
            className="w-full bg-black border border-zinc-700 text-white p-3 rounded-lg outline-none focus:border-[#39ff14] transition-colors disabled:opacity-50"
          >
            <option value="">-- INITIALIZE LINK --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.teamName}
              </option>
            ))}
          </select>
          {mySelection && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[#39ff14] text-xs uppercase tracking-widest bg-[#39ff14]/10 p-2 rounded">
              <Lock className="w-4 h-4" /> Identity Locked
            </div>
          )}
        </div>
      </motion.div>

      {/* Nodes Grid */}
      <div className="z-10 w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        <AnimatePresence>
          {boxes.map((box, idx) => {
            const thisSelection = selections.find((s) => s.selectedBoxId === box.id);
            const isLocked = !!thisSelection;
            const isMyLock = thisSelection?.teamId === selectedTeamId;
            const lockedTeam = teams.find((t) => t.id === thisSelection?.teamId);

            // Revealed state mappings
            const boxCards = arenaState.isRevealed 
              ? cards.filter(c => box.cards?.includes(c.id))
              : [];

            return (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={arenaState.isRevealing ? { x: [-3, 3, -3, 3, 0], y: [3, -3, -3, 3, 0], scale: 1.05 } : { opacity: 1, scale: 1 }}
                transition={arenaState.isRevealing ? { repeat: Infinity, duration: 0.3 } : { delay: idx * 0.05 }}
                onClick={() => !isLocked && !isInputLocked && handleSelectBox(box.id)}
                className={`
                  relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-500 overflow-hidden group
                  ${arenaState.isRevealing
                    ? "bg-purple-900/20 border-2 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    : arenaState.isRevealed 
                    ? "bg-zinc-900 border-2 border-zinc-700"
                    : isLocked 
                      ? isMyLock 
                        ? "bg-[#39ff14]/5 border-[#39ff14]/50 shadow-[0_0_30px_rgba(57,255,20,0.2)] cursor-not-allowed" 
                        : "bg-red-500/5 border-red-500/30 opacity-50 cursor-not-allowed" 
                      : (isInputLocked ? "bg-zinc-900/50 border border-zinc-800 opacity-50 cursor-not-allowed" : "bg-zinc-900/50 border border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]")}
                `}
              >
                {/* ID Tag */}
                <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest opacity-30">
                  NODE-{idx + 1}
                </span>

                {!arenaState.isRevealed ? (
                  <>
                    <Cpu className={`w-12 h-12 mb-4 transition-all duration-500 ${arenaState.isRevealing ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse' : isMyLock ? 'text-[#39ff14] animate-pulse drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]' : isLocked ? 'text-red-500' : 'text-cyan-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]'}`} />
                    
                    <div className="text-xs uppercase tracking-widest text-center font-bold">
                      {isLocked ? (
                        <div className="flex flex-col items-center gap-1">
                          <Lock className="w-4 h-4 mb-1" />
                          <span className={isMyLock ? 'text-[#39ff14]' : 'text-red-500'}>
                            {isMyLock ? "SECURED" : "LOCKED"}
                          </span>
                          {lockedTeam && !isMyLock && <span className="text-[9px] opacity-70 mt-1">{lockedTeam.teamName}</span>}
                        </div>
                      ) : (
                        <span className="opacity-50 group-hover:opacity-100 transition-opacity">AVAILABLE</span>
                      )}
                    </div>
                  </>
                ) : (
                  // Revealed State
                  <motion.div 
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="flex flex-col items-center justify-center w-full h-full text-center"
                  >
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-3">Payload</h3>
                    {boxCards.map((bc) => (
                      <div 
                        key={bc.id} 
                        className={`mb-2 text-xs font-bold px-2 py-1 rounded w-full truncate border ${
                          bc.rarity === 'RARE' 
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {bc.name}
                      </div>
                    ))}

                    {/* Show who owns it now */}
                    {lockedTeam && (
                      <div className="absolute bottom-2 left-0 right-0 text-[9px] text-[#39ff14] uppercase tracking-widest opacity-80">
                        {lockedTeam.teamName}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {boxes.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50">
            <ShieldAlert className="w-16 h-16 mb-4 animate-pulse" />
            <p className="uppercase tracking-widest">Awaiting Deployment Protocol...</p>
          </div>
        )}
      </div>
    </main>
  );
}
