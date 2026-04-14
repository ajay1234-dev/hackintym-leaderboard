"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArenaBox, ArenaSelection, ArenaState, Team, Card } from "@/types";
import { Lock, ShieldAlert, Cpu, Orbit, GripHorizontal } from "lucide-react";

export default function SelectionZone() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [boxes, setBoxes] = useState<ArenaBox[]>([]);
  const [selections, setSelections] = useState<ArenaSelection[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [arenaState, setArenaState] = useState<ArenaState>({ isRevealed: false });
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Drag & Drop State
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [invalidDropBoxId, setInvalidDropBoxId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load identity from JS localStorage
  useEffect(() => {
    const savedTeamId = localStorage.getItem("arenaSelectedTeamId");
    if (savedTeamId) {
      setSelectedTeamId(savedTeamId);
    }
  }, []);

  const handleTeamChange = (val: string) => {
    setSelectedTeamId(val);
    localStorage.setItem("arenaSelectedTeamId", val);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const mySelection = selections.find((s) => s.teamId === selectedTeamId);
  const isInputLocked = mySelection !== undefined || arenaState.isRevealed || arenaState.isRevealing || timeLeft === 0;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isInputLocked || !selectedTeamId) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", selectedTeamId);
    e.dataTransfer.effectAllowed = "copyMove";
    // We can't safely use setDraggedTeamId if we don't want state updates interfering with drag visually.
    // But it's fine for simple flags.
    setDraggedTeamId(selectedTeamId);
  };

  const handleDragEnd = () => {
    setDraggedTeamId(null);
    setHoveredBoxId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, boxId: string) => {
    // Check if drop is realistically allowed on UI side first to set dropEffect
    const isBoxSelected = selections.some((s) => s.selectedBoxId === boxId);
    if (!isBoxSelected && !isInputLocked) {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = "copy";
      if (hoveredBoxId !== boxId) {
        setHoveredBoxId(boxId);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, boxId: string) => {
    if (hoveredBoxId === boxId) {
      setHoveredBoxId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, boxId: string) => {
    e.preventDefault();
    setHoveredBoxId(null);
    setDraggedTeamId(null);

    const teamId = e.dataTransfer.getData("text/plain");

    if (!teamId) return;

    if (arenaState.isRevealed || arenaState.isRevealing || timeLeft === 0) {
      showToast("Selection period has ended.");
      setInvalidDropBoxId(boxId);
      setTimeout(() => setInvalidDropBoxId(null), 500);
      return;
    }

    if (teamId !== selectedTeamId) {
       showToast("Identity mismatch. Please reload.");
       return;
    }

    // Validation: Has this team already selected?
    const hasSelected = selections.some((s) => s.teamId === teamId);
    if (hasSelected) {
      showToast("Your team has already secured an Energy Node.");
      setInvalidDropBoxId(boxId);
      setTimeout(() => setInvalidDropBoxId(null), 500);
      return;
    }

    // Validation: Is this box already selected?
    const isBoxSelected = selections.some((s) => s.selectedBoxId === boxId);
    if (isBoxSelected) {
      showToast("This Energy Node has already been secured by another team.");
      setInvalidDropBoxId(boxId);
      setTimeout(() => setInvalidDropBoxId(null), 500);
      return;
    }

    try {
      // Safe write pattern using transaction to prevent double booking for the same team AND the same box
      const selectionRef = doc(db, "teamSelections", teamId);
      const lockRef = doc(db, "teamSelections", `lock_${boxId}`);
      
      await runTransaction(db, async (transaction) => {
        // Read locks
        const teamSelectionSnap = await transaction.get(selectionRef);
        const lockSnap = await transaction.get(lockRef);
        
        if (teamSelectionSnap.exists()) {
          throw new Error("ALREADY_SELECTED");
        }
        if (lockSnap.exists()) {
          throw new Error("BOX_TAKEN");
        }
        
        // Write locks
        transaction.set(lockRef, { 
          type: "lock", 
          lockedBy: teamId, 
          lockedAt: Date.now() 
        });
        
        transaction.set(selectionRef, {
          id: teamId,
          teamId: teamId,
          selectedBoxId: boxId,
          isLocked: true,
          lockedAt: Date.now()
        });
      });
      // Snap animation handles via standard f-motion on presence
    } catch (err: any) {
      console.error("Lock failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      
      if (msg.includes("ALREADY_SELECTED")) {
        showToast("Your team has already secured a Node!");
      } else if (msg.includes("BOX_TAKEN")) {
        showToast("Node grabbed by another team just now!");
      } else {
        // Use generic error message if it's a firebase permission failure, but log it locally
        showToast(`Sync failure: ${msg.slice(0, 30)}...`);
      }
      setInvalidDropBoxId(boxId);
      setTimeout(() => setInvalidDropBoxId(null), 500);
    }
  };

  const selectedTeamData = teams.find(t => t.id === selectedTeamId);

  return (
    <main className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col items-center p-4 sm:p-8 relative overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.5)] font-bold tracking-wider text-sm flex items-center gap-2"
          >
            <ShieldAlert className="w-5 h-5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.02] pointer-events-none"></div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="z-10 w-full max-w-6xl mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <Orbit className="w-10 h-10 animate-[spin_10s_linear_infinite] text-[#39ff14]" />
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
              Selection Zone
            </h1>
            <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] sm:text-xs mt-2">
              Secure your Energy Node
            </p>
            {timeLeft !== null && !arenaState.isRevealed && !arenaState.isRevealing && (
              <div className="mt-4 flex">
                <div className="inline-block bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm font-black tracking-widest animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  TIME REMAINING: {formatTime(timeLeft)}
                </div>
              </div>
            )}
            {arenaState.isRevealing && (
              <div className="mt-4 flex">
                <div className="inline-block bg-purple-500/20 border border-purple-500/50 text-purple-400 px-4 py-2 rounded-lg text-sm font-black tracking-widest animate-[pulse_0.4s_ease-in-out_infinite] shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  SYNCHRONIZING REVEAL...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top-Right Team Identity System */}
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl backdrop-blur-md w-full sm:w-72">
            <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Select Your Team
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={mySelection !== undefined}
              className="w-full bg-black border border-zinc-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-[#39ff14] transition-colors disabled:opacity-50"
            >
              <option value="">-- NO IDENTITY --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teamName}
                </option>
              ))}
            </select>
          </div>

          {/* Draggable Team Badge */}
          <AnimatePresence>
            {selectedTeamId && selectedTeamData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="w-full sm:w-72 relative origin-right"
              >
                <div
                  className={`w-full p-3 rounded-lg border ${
                    mySelection
                      ? "bg-[#39ff14]/10 border-[#39ff14]/50 shadow-[0_0_15px_rgba(57,255,20,0.2)]"
                      : "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-grab active:cursor-grabbing hover:bg-cyan-500/20"
                  } transition-colors overflow-hidden flex items-center justify-between`}
                  draggable={!mySelection && !isInputLocked}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div>
                    <div className="text-[#39ff14] font-black uppercase text-sm truncate max-w-[160px]">
                      {selectedTeamData.teamName}
                    </div>
                    <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${mySelection ? 'text-zinc-400' : 'text-cyan-400'}`}>
                      {mySelection ? "STATUS: LOCKED 🔒" : "DRAG ME TO A NODE"}
                    </div>
                  </div>
                  {!mySelection && !isInputLocked && (
                    <GripHorizontal className="w-5 h-5 text-cyan-400/50" />
                  )}
                  {mySelection && (
                    <Lock className="w-5 h-5 text-[#39ff14]/70" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Nodes Grid (Drop Zones) */}
      <div className="z-10 w-full max-w-6xl grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-4">
        <AnimatePresence>
          {boxes.map((box, idx) => {
            const thisSelection = selections.find((s) => s.selectedBoxId === box.id);
            const isLocked = !!thisSelection;
            const isMyLock = thisSelection?.teamId === selectedTeamId;
            const lockedTeam = teams.find((t) => t.id === thisSelection?.teamId);
            
            const isHovered = hoveredBoxId === box.id;
            const isInvalidDrop = invalidDropBoxId === box.id;

            // Revealed state mappings
            const boxCards = arenaState.isRevealed 
              ? cards.filter(c => box.cards?.includes(c.id))
              : [];

            return (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  isInvalidDrop 
                    ? { x: [-5, 5, -5, 5, 0], scale: 1 } 
                    : arenaState.isRevealing 
                      ? { x: [-3, 3, -3, 3, 0], y: [3, -3, -3, 3, 0], scale: 1.05 } 
                      : { opacity: 1, scale: isHovered && !isLocked ? 1.05 : 1 }
                }
                transition={
                  isInvalidDrop 
                    ? { duration: 0.4 } 
                    : arenaState.isRevealing 
                      ? { repeat: Infinity, duration: 0.3 } 
                      : { delay: idx * 0.05, type: "spring" }
                }
                onDragOver={(e) => handleDragOver(e, box.id)}
                onDragLeave={(e) => handleDragLeave(e, box.id)}
                onDrop={(e) => handleDrop(e, box.id)}
                className={`
                  relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 transition-colors duration-300 overflow-hidden
                  ${arenaState.isRevealing
                    ? "bg-purple-900/20 border-2 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    : arenaState.isRevealed 
                    ? "bg-zinc-900 border-2 border-zinc-700"
                    : isLocked 
                      ? isMyLock 
                        ? "bg-[#39ff14]/5 border-2 border-[#39ff14]/50 shadow-[0_0_30px_rgba(57,255,20,0.2)]" 
                        : "bg-red-500/5 border-2 border-red-500/30 opacity-70" 
                      : isHovered
                        ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                        : "bg-zinc-900/50 border border-zinc-800 border-dashed"
                  }
                `}
              >
                {/* ID Tag */}
                <span className="absolute top-2 sm:top-3 left-2 sm:left-3 text-[10px] font-bold tracking-widest opacity-40">
                  NODE-{idx + 1}
                </span>

                {!arenaState.isRevealed ? (
                  <>
                    <Cpu className={`w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-4 transition-all duration-500 ${arenaState.isRevealing ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse' : isMyLock ? 'text-[#39ff14] animate-pulse drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]' : isLocked ? 'text-red-500' : isHovered ? 'text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-110' : 'text-zinc-600'}`} />
                    
                    <div className="text-[10px] sm:text-xs uppercase tracking-widest text-center font-bold px-2">
                      {isLocked ? (
                        <div className="flex flex-col items-center gap-1">
                          <Lock className="w-3 h-3 sm:w-4 sm:h-4 mb-0.5" />
                          <span className={isMyLock ? 'text-[#39ff14]' : 'text-red-500'}>
                            LOCKED 🔒
                          </span>
                          {lockedTeam && <span className="text-[10px] text-white mt-1 border-t border-zinc-700 pt-1 w-full truncate">{lockedTeam.teamName}</span>}
                        </div>
                      ) : isHovered ? (
                        <span className="text-cyan-300">DROP HERE / /</span>
                      ) : (
                        <span className="opacity-50 tracking-[0.2em]">AVAILABLE</span>
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
                    <h3 className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2">Payload</h3>
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
                      <div className="absolute bottom-2 left-0 right-0 text-[9px] text-[#39ff14] uppercase tracking-widest opacity-80 px-2 truncate">
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
