"use client";

import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Team, Card, ActiveEffect } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import AnimatedScore from "./AnimatedScore";
import { useGlobalEffects, useTeamHighlight } from "./GlobalEffectsContext";
import { useCardDetection } from "@/hooks/useCardDetection";
import { CARD_ICONS } from "@/lib/icons";
import { Info } from "lucide-react";
import {
  playRankChangeSound,
  playScoreSound,
  playTopThreeSound,
  playTopTenSound,
  playBulkRevealSound,
  playResolveSound,
  setMutedForBulkReveal,
  playLockThudSound,
  playFinalImpactSound,
  speakText,
  playCelebrationSound,
} from "@/lib/soundManager";

const ActiveEffectBadge = ({
  effect,
  allTeams,
}: {
  effect: ActiveEffect;
  allTeams?: Team[];
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!effect.expiresAt) return;
    const interval = setInterval(() => {
      setTimeLeft(
        Math.max(0, Math.ceil((effect.expiresAt! - Date.now()) / 1000))
      );
    }, 1000);
    setTimeLeft(Math.max(0, Math.ceil((effect.expiresAt - Date.now()) / 1000)));
    return () => clearInterval(interval);
  }, [effect.expiresAt]);

  const hasLucideIcon = effect.icon && effect.icon in CARD_ICONS;
  const IconComp = hasLucideIcon
    ? CARD_ICONS[effect.icon as keyof typeof CARD_ICONS]
    : null;
  let renderEmoji = effect.icon || "✨";
  if (effect.effect === "freeze") renderEmoji = "❄";
  else if (effect.effect === "block") renderEmoji = "🛡";
  else if (effect.effect === "multiply_score") renderEmoji = "⚡";
  else if (effect.effect === "precision_lock") renderEmoji = "🎯";
  else if (effect.effect === "vision") renderEmoji = "👁";
  else if (effect.effect === "override_freeze") renderEmoji = "⚙";
  else if (effect.effect === "predictive_engine") renderEmoji = "🧠";

  if (effect.expiresAt && timeLeft === 0) return null;

  let textToDisplay = effect.effect.replace("_", " ").toUpperCase();
  if (effect.effect === "multiply_score") {
    textToDisplay = `${effect.value}x Next Score`;
  } else if (effect.effect === "block") {
    textToDisplay = "Shield";
  } else if (effect.effect === "freeze") {
    textToDisplay = "Freeze";
  } else if (effect.effect === "precision_lock") {
    textToDisplay = "Precision Lock";
  } else if (effect.effect === "vision") {
    textToDisplay = "Vision Mode";
  } else if (effect.effect === "override_freeze") {
    textToDisplay = "Override Active";
  } else if (effect.effect === "predictive_engine") {
    textToDisplay = "Predictive Active";
  }

  // Format 00:00 for timed countdowns
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const splitSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${splitSecs
      .toString()
      .padStart(2, "0")}`;
  };

  const isPendingClass = effect.isPending
    ? "animate-pulse border-blue-500/50 bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
    : "bg-zinc-900 border-zinc-700/50 hover:bg-zinc-800";

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors cursor-default select-none relative group ${isPendingClass}`}
    >
      {IconComp ? (
        <IconComp
          className={`w-3 h-3 ${
            effect.isPending ? "text-blue-200" : "text-zinc-400"
          }`}
        />
      ) : (
        <span className="text-[10px] drop-shadow-sm pointer-events-none select-none">
          {renderEmoji}
        </span>
      )}
      <span
        className={`text-[10px] font-bold ${
          effect.isPending ? "text-blue-100" : "text-zinc-300"
        }`}
      >
        {effect.isPending
          ? `${textToDisplay} (Ready)`
          : timeLeft !== null
          ? `${textToDisplay} (${formatTime(timeLeft)})`
          : textToDisplay}
      </span>
      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-zinc-800 text-xs px-2 py-1 rounded text-white bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-[100] pointer-events-none">
        {(() => {
          if (effect.sourceTeamId && allTeams) {
            const srcTeam = allTeams.find((t) => t.id === effect.sourceTeamId);
            if (srcTeam) return `${srcTeam.teamName} used ${textToDisplay}`;
          }
          return `${effect.effect
            .replace("_", " ")
            .toUpperCase()} effect active`;
        })()}
      </div>
    </div>
  );
};

const CooldownBadge = ({ cooldownMs }: { cooldownMs: number }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!cooldownMs) return;
    const updateTime = () => {
      setTimeLeft(Math.max(0, Math.ceil((cooldownMs - Date.now()) / 1000)));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [cooldownMs]);

  if (timeLeft === 0) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const splitSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${splitSecs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-zinc-900 border-yellow-500/30 text-yellow-500/80 cursor-default select-none group relative">
      <span className="text-[10px] drop-shadow-sm pointer-events-none select-none">
        ⏳
      </span>
      <span className="text-[10px] font-bold">
        Cooldown ({formatTime(timeLeft)})
      </span>
    </div>
  );
};

export type RevealPhase =
  | "IDLE"
  | "COUNTDOWN"
  | "ROLLING"
  | "WAVE_LOCKING"
  | "POST_REVEAL";

// Extend Team to include totalScore locally for sorting and display
interface TeamWithScore extends Team {
  totalScore: number;
}

// Sub-component for animating review score updates
function AnimatedReviewCell({
  value,
  color,
  prefix = "",
  isRolling = false,
}: {
  value: number;
  color: "blue" | "yellow" | "gray" | "golden";
  prefix?: string;
  isRolling?: boolean;
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsUpdating(true);
      setPrevValue(value);
      setTimeout(() => setIsUpdating(false), 500); // Reset after animation
    }
  }, [value, prevValue]);

  let styles = "";
  switch (color) {
    case "blue": // the user requested cyan glow for R1
      styles =
        "text-cyan-400 [text-shadow:0_0_6px_rgba(34,211,238,0.6)] hover:[text-shadow:0_0_10px_rgba(34,211,238,0.8)]";
      break;
    case "yellow":
      styles =
        "text-yellow-200 [text-shadow:0_0_6px_rgba(254,240,138,0.6)] hover:[text-shadow:0_0_10px_rgba(254,240,138,0.8)]";
      break;
    case "gray":
      styles =
        "text-zinc-200 [text-shadow:0_0_6px_rgba(255,255,255,0.6)] hover:[text-shadow:0_0_10px_rgba(255,255,255,0.8)]";
      break;
    case "golden":
      styles =
        "text-amber-400 [text-shadow:0_0_6px_rgba(245,158,11,0.6)] hover:[text-shadow:0_0_10px_rgba(245,158,11,0.8)]";
      break;
  }

  return (
    <motion.div
      initial={false}
      animate={
        isUpdating
          ? {
              scale: [1, 1.25, 1],
              y: [0, -5, 0],
              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
            }
          : { scale: 1, y: 0 }
      }
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.1 }}
      className={`text-lg md:text-xl font-semibold font-mono transition-all duration-300 cursor-default ${styles}`}
    >
      {prefix}
      <AnimatedScore value={value} isRolling={isRolling} />
    </motion.div>
  );
}

// Sub-component for individual rows to track their own state changes
function LeaderboardRow({
  team,
  allTeams,
  index,
  totalRows,
  renderCard,
  revealPhase,
}: {
  team: TeamWithScore;
  allTeams: TeamWithScore[];
  index: number;
  totalRows: number;
  renderCard: (
    id: string,
    isUsed: boolean,
    i: number,
    isActive?: boolean
  ) => React.ReactNode;
  revealPhase: RevealPhase;
}) {
  const prevScore = useRef(team.totalScore);
  const [delta, setDelta] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const { triggerPoints } = useGlobalEffects();
  const { isHighlighted } = useTeamHighlight(team.id);

  // Stagger calculation for Wave Locking
  const [isRolling, setIsRolling] = useState(false);
  const isRollingRef = useRef(false);

  useEffect(() => {
    if (revealPhase === "ROLLING") {
      if (!isRollingRef.current) {
        setIsRolling(true);
        isRollingRef.current = true;
      }
    } else if (revealPhase === "COUNTDOWN") {
      // Do nothing but wait silently so they can switch tabs
    } else if (revealPhase === "WAVE_LOCKING") {
      if (isRollingRef.current) {
        const lockDelayMs = (totalRows - 1 - index) * 300;
        const extraSilence = index === 0 ? 200 : 0;
        const timeout = setTimeout(() => {
          setIsRolling(false);
          isRollingRef.current = false;
          playLockThudSound();
        }, lockDelayMs + extraSilence);
        return () => clearTimeout(timeout);
      }
    } else if (revealPhase === "IDLE" || revealPhase === "POST_REVEAL") {
      setIsRolling(false);
      isRollingRef.current = false;
    }
  }, [revealPhase, index, totalRows]);

  useEffect(() => {
    if (team.totalScore !== prevScore.current) {
      const d = team.totalScore - prevScore.current;
      setDelta(d);
      prevScore.current = team.totalScore;

      if (d > 0) {
        playScoreSound();
      }

      if (rowRef.current) {
        const rect = rowRef.current.getBoundingClientRect();
        triggerPoints(d, rect.right - 50, rect.top + rect.height / 2);
      }
    }
  }, [team.totalScore, triggerPoints]);

  // Handle the glow timeout cleanly so React StrictMode double-rendering doesn't destroy it
  useEffect(() => {
    if (delta !== null) {
      const timeout = setTimeout(() => setDelta(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [delta]);

  // Determine baseline container styling based on tier
  let defaultBg =
    "bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-800/40 opacity-70 grayscale-[0.3]"; // 11th and below
  if (index < 3) {
    defaultBg =
      "bg-zinc-800/40 border-zinc-600/50 hover:bg-zinc-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-10"; // Top 3
  } else if (index < 10) {
    defaultBg =
      "bg-zinc-800/20 border-cyan-900/30 hover:bg-zinc-800/40 hover:border-cyan-700/50"; // Top 10
  }

  const isFrozen = team.activeEffects?.some((e) => e.effect === "freeze");
  const isShielded = team.activeEffects?.some((e) => e.effect === "block");

  const glowClass = isFrozen
    ? "bg-[rgba(239,68,68,0.2)] border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]"
    : isShielded
    ? "bg-[rgba(59,130,246,0.2)] border-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]"
    : revealPhase === "POST_REVEAL" && index < 3
    ? "bg-[rgba(250,204,21,0.2)] border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] z-30 animate-pulse"
    : delta
    ? delta > 0
      ? "bg-[rgba(57,255,20,0.15)] border-[#39ff14]/50 shadow-[0_0_15px_rgba(57,255,20,0.2)] z-20"
      : "bg-[rgba(239,68,68,0.15)] border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] z-20"
    : isHighlighted
    ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 border-blue-400/60 shadow-[0_0_25px_rgba(59,130,246,0.4),0_0_40px_rgba(168,85,247,0.3)] z-20"
    : defaultBg;

  let rankClass = "text-zinc-500";
  if (index === 0)
    rankClass =
      "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] scale-110";
  else if (index === 1)
    rankClass =
      "text-zinc-200 drop-shadow-[0_0_10px_rgba(228,228,231,0.5)] scale-105";
  else if (index === 2)
    rankClass =
      "text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.4)] scale-105";
  else if (index < 10)
    rankClass = "text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]";

  return (
    <motion.div
      ref={rowRef}
      layout
      initial={false}
      animate={{
        scale: isHighlighted
          ? [1, 1.03, 1.02, 1]
          : delta !== null
          ? [1, 1.02, 1]
          : 1,
        borderColor: isHighlighted
          ? ["#3b82f6", "#a855f7", "#3b82f6"]
          : undefined,
        boxShadow: isHighlighted
          ? [
              "0_0_25px_rgba(59,130,246,0.4)",
              "0_0_40px_rgba(168,85,247,0.6)",
              "0_0_25px_rgba(59,130,246,0.4)",
            ]
          : undefined,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        scale: { duration: isHighlighted ? 2 : 0.5 },
        borderColor: {
          duration: 2,
          repeat: isHighlighted ? Infinity : 0,
          repeatType: "reverse",
        },
        boxShadow: {
          duration: 2,
          repeat: isHighlighted ? Infinity : 0,
          repeatType: "reverse",
        },
      }}
      className={`grid grid-cols-12 md:grid-cols-16 gap-1 md:gap-2 items-center p-2 md:p-3 rounded-xl border transition-all duration-300 relative ${glowClass} hover:bg-zinc-800/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-h-[72px] max-h-[72px] md:min-h-[80px] md:max-h-[80px]`}
    >
      {/* Absolute floating text has been offloaded to GlobalEffectsLayer */}

      {/* Rank */}
      <div className="col-span-1 flex justify-center">
        <span
          className={`text-base sm:text-lg md:text-2xl font-black ${rankClass}`}
        >
          #{index + 1}
        </span>
      </div>

      {/* Team Name */}
      <div className="col-span-4 sm:col-span-3 md:col-span-2 text-left pl-1 pr-2">
        <h3 className="text-[11px] sm:text-[13px] md:text-base font-bold text-white leading-tight break-words whitespace-normal transition-colors drop-shadow-md">
          {team.teamName}
        </h3>
      </div>

      {/* Reviews */}
      <div className="hidden md:flex md:col-span-1 justify-center">
        <AnimatedReviewCell
          value={team.review1}
          color="blue"
          isRolling={isRolling}
        />
      </div>
      <div className="hidden md:flex md:col-span-1 justify-center">
        <AnimatedReviewCell
          value={team.review2}
          color="yellow"
          isRolling={isRolling}
        />
      </div>
      <div className="hidden md:flex md:col-span-1 justify-center">
        <AnimatedReviewCell
          value={team.review3}
          color="gray"
          isRolling={isRolling}
        />
      </div>

      {/* Power Cards */}
      <div className="col-span-3 sm:col-span-2 md:col-span-3 flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-visible text-left pl-1">
        {(() => {
          const owned = team.cardsOwned || [];
          const used = team.cardsUsed || [];
          const allCards = [
            ...owned.map((id, i) => ({ id, isUsed: false, index: i })),
            ...used.map((id, i) => ({ id, isUsed: true, index: i })),
          ].slice(0, 4); // Show maximum 4 cards

          return (
            <>
              {allCards.map((c) => {
                const isActive = allTeams.some((t) =>
                  t.activeEffects?.some(
                    (e) => e.sourceCardId === c.id && e.sourceTeamId === team.id
                  )
                );
                return renderCard(c.id, c.isUsed, c.index, isActive);
              })}
              {Array.from({ length: Math.max(0, 4 - allCards.length) }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-[24px] h-[24px] sm:w-[34px] sm:h-[34px] md:w-[38px] md:h-[38px] shrink-0 rounded-md border border-dashed border-zinc-600/50 bg-zinc-800/40 flex items-center justify-center"
                  >
                    <span className="text-zinc-500 font-bold opacity-60 text-[10px] sm:text-xs">
                      +
                    </span>
                  </div>
                )
              )}
            </>
          );
        })()}
      </div>

      {/* Active Effects (New Feature) */}
      <div className="col-span-2 sm:col-span-4 md:col-span-4 flex flex-wrap items-center gap-1 sm:gap-1.5 overflow-hidden text-left border-l border-zinc-800/50 pl-2">
        <AnimatePresence>
          {(team.activeEffects || []).map((effect) => (
            <ActiveEffectBadge
              key={effect.id}
              effect={effect}
              allTeams={allTeams}
            />
          ))}
          {Object.entries(team.cardCooldowns || {}).map(([cId, timestamp]) => (
            <CooldownBadge key={`cd-${cId}`} cooldownMs={timestamp as number} />
          ))}
        </AnimatePresence>
      </div>

      {/* Bonus Points */}
      <div className="hidden md:flex md:col-span-1 justify-center items-center">
        <AnimatedReviewCell
          value={team.bonusPoints}
          color="golden"
          prefix={team.bonusPoints > 0 ? "+" : ""}
          isRolling={isRolling}
        />
      </div>

      {/* Total Score */}
      <div className="col-span-2 sm:col-span-2 md:col-span-2 text-right pr-2">
        <motion.div
          animate={
            delta !== null
              ? {
                  scale: [1, 1.25, 1],
                  filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
                  color: [
                    "#ffffff",
                    delta > 0 ? "#39ff14" : "#ef4444",
                    "#ffffff",
                  ],
                }
              : {}
          }
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <AnimatedScore
            value={team.totalScore}
            isRolling={isRolling}
            className={`text-lg sm:text-2xl md:text-3xl font-mono font-black block relative z-10 text-[#39ff14] [text-shadow:0_0_15px_rgba(57,255,20,0.8)]`}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [teams, setTeams] = useState<TeamWithScore[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("IDLE");
  const [bulkRevealData, setBulkRevealData] = useState<any>(null);
  const {
    showTooltip,
    hideTooltip,
    showCardCelebration,
    triggerTeamHighlight,
  } = useGlobalEffects();
  const isFirstRender = useRef(true);
  const prevRanks = useRef<Record<string, number>>({});

  // Card detection hook with celebration triggers
  useCardDetection({
    teams,
    cards,
    onNewCardDetected: (result) => {
      // Trigger the celebration popup
      showCardCelebration(result.teamName, result.card);

      // Find the team and trigger row highlighting
      const team = teams.find((t) => t.teamName === result.teamName);
      if (team) {
        triggerTeamHighlight(team.id);
      }
    },
  });

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  useEffect(() => {
    // Listen to teams
    const qTeams = query(collection(db, "teams"));
    const unsubscribeTeams = onSnapshot(
      qTeams,
      (snapshot) => {
        const teamsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const review1 = data.review1 || 0;
          const review2 = data.review2 || 0;
          const review3 = data.review3 || 0;
          const bonusPoints = data.bonusPoints || 0;

          return {
            id: doc.id,
            teamName: data.teamName || "Unnamed Team",
            review1,
            review2,
            review3,
            bonusPoints,
            cardsOwned: data.cardsOwned || [],
            cardsUsed: data.cardsUsed || [],
            activeEffects: data.activeEffects || [],
            cardCooldowns: data.cardCooldowns || {},
            totalScore: review1 + review2 + review3 + bonusPoints,
          } as TeamWithScore;
        });

        const sortedTeams = teamsData.sort(
          (a, b) => b.totalScore - a.totalScore
        );

        // Perform strict rank change checks to play audio
        if (!isFirstRender.current) {
          let playedRankSound = false; // anti-spam for batch changes
          let playedTop3Sound = false; // prioritize top 3 entry
          let playedTop10Sound = false; // prioritize top 10 entry

          sortedTeams.forEach((t, i) => {
            const newRank = i + 1;
            const prevRank = prevRanks.current[t.id];

            if (prevRank && newRank < prevRank) {
              // Did they organically enter the top 3?
              if (prevRank > 3 && newRank <= 3) {
                if (!playedTop3Sound) {
                  playTopThreeSound();
                  playedTop3Sound = true;
                }
              }
              // Did they organically enter the top 10?
              else if (prevRank > 10 && newRank <= 10) {
                if (!playedTop10Sound) {
                  playTopTenSound();
                  playedTop10Sound = true;
                }
              }
              // Otherwise standard climb
              else if (
                !playedRankSound &&
                !playedTop3Sound &&
                !playedTop10Sound &&
                (newRank <= 3 || prevRank - newRank >= 3)
              ) {
                playRankChangeSound();
                playedRankSound = true;
              }
            }
            prevRanks.current[t.id] = newRank;
          });
        } else {
          sortedTeams.forEach((t, i) => {
            prevRanks.current[t.id] = i + 1;
          });
        }

        setTeams(sortedTeams);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching teams:", error);
        setLoading(false);
      }
    );

    // Listen to cards
    const unsubscribeCards = onSnapshot(collection(db, "cards"), (snapshot) => {
      const cardsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          type: (data.type || "COMMON").toUpperCase(),
        } as Card;
      });
      setCards(cardsData);
    });

    // Listen to bulk reveal events
    const unsubscribeReveal = onSnapshot(
      doc(db, "globalState", "bulkReveal"),
      (snapshot) => {
        if (!isFirstRender.current) {
          setBulkRevealData(snapshot.data());
        }
      }
    );

    return () => {
      unsubscribeTeams();
      unsubscribeCards();
      unsubscribeReveal();
    };
  }, []);

  useEffect(() => {
    if (!bulkRevealData?.isActive) return;

    const timeSinceTrigger = Date.now() - (bulkRevealData.triggerTime || 0);
    const rollDurationMs = bulkRevealData.rollDurationMs || 4000;
    const staggerDelayMs = bulkRevealData.staggerDelayMs || 300;

    // Fallback if teams aren't loaded yet
    const totalRowsLocal = teams.length || 10;
    const totalWaveTime = totalRowsLocal * staggerDelayMs + 200;

    const timeouts: NodeJS.Timeout[] = [];

    // Jump straight into the rolling phase so that isRolling=true hides the raw score updates
    if (timeSinceTrigger < rollDurationMs) {
      if (timeSinceTrigger < 200) {
        playBulkRevealSound();
      }
      setRevealPhase("ROLLING");
      setMutedForBulkReveal(true);

      timeouts.push(
        setTimeout(() => {
          setRevealPhase("WAVE_LOCKING");
        }, rollDurationMs - timeSinceTrigger)
      );
    }

    if (
      timeSinceTrigger >= rollDurationMs &&
      timeSinceTrigger < rollDurationMs + totalWaveTime
    ) {
      setRevealPhase("WAVE_LOCKING");
      setMutedForBulkReveal(true);

      timeouts.push(
        setTimeout(() => {
          setRevealPhase("POST_REVEAL");
          playFinalImpactSound();
        }, rollDurationMs + totalWaveTime - timeSinceTrigger)
      );
    } else if (timeSinceTrigger < rollDurationMs) {
      timeouts.push(
        setTimeout(() => {
          setRevealPhase("POST_REVEAL");
          playFinalImpactSound();
        }, rollDurationMs + totalWaveTime - timeSinceTrigger)
      );
    }

    timeouts.push(
      setTimeout(() => {
        setRevealPhase("IDLE");
        setMutedForBulkReveal(false);
      }, rollDurationMs + totalWaveTime + 5000 - timeSinceTrigger)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [bulkRevealData?.triggerTime, teams.length]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl h-96 flex items-center justify-center neon-border">
        <div className="w-8 h-8 rounded-full border-4 border-t-[var(--color-neon-green)] border-zinc-800 animate-spin"></div>
      </div>
    );
  }

  // Helper to render a card icon with tooltip
  const renderCard = (
    cardId: string,
    isUsed: boolean,
    i: number,
    isActive: boolean = false
  ) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      return (
        <div
          key={`unknown-${cardId}-${i}`}
          className="w-[24px] h-[24px] sm:w-[34px] sm:h-[34px] md:w-[38px] md:h-[38px] shrink-0 rounded-md border border-red-500/50 bg-red-900/20 flex items-center justify-center cursor-help"
          title="Unknown or Deleted Card"
        >
          <span className="text-red-500 text-xs">?</span>
        </div>
      );
    }

    let typeColor =
      "text-cyan-400 border-cyan-500/20 bg-cyan-500/10 shadow-[inset_0_0_6px_rgba(34,211,238,0.1),_0_0_6px_rgba(34,211,238,0.2)]"; // common
    if (card.type === "RARE")
      typeColor =
        "text-purple-400 border-purple-500/20 bg-purple-500/10 shadow-[inset_0_0_6px_rgba(168,85,247,0.1),_0_0_8px_rgba(168,85,247,0.3)]";
    else if (card.type === "LEGENDARY")
      typeColor =
        "text-yellow-400 border-yellow-500/20 bg-yellow-500/10 shadow-[inset_0_0_8px_rgba(234,179,8,0.2),_0_0_12px_rgba(234,179,8,0.4)] animate-[pulse_2s_ease-in-out_infinite]";

    let finalStyle = typeColor;
    if (isActive) {
      finalStyle =
        typeColor +
        " animate-pulse ring-2 ring-white/50 scale-[1.05] shadow-[0_0_15px_currentColor]";
    } else if (isUsed) {
      finalStyle =
        "opacity-60 grayscale filter border border-zinc-700 bg-zinc-800/40";
    }

    const hasLucideIcon = card.icon && card.icon in CARD_ICONS;
    const IconComponent = hasLucideIcon
      ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS]
      : null;
    const isLegacyString =
      !hasLucideIcon &&
      (card.icon || "").length > 2 &&
      /^[a-zA-Z]+$/.test(card.icon || "");
    const renderEmoji = isLegacyString ? "✨" : card.icon || "✨";

    return (
      <motion.div
        key={`${isUsed ? "used" : "owned"}-${card.id}-${i}`}
        className={`relative flex items-center justify-center w-[24px] h-[24px] sm:w-[34px] sm:h-[34px] md:w-[38px] md:h-[38px] shrink-0 rounded-[0.4rem] sm:rounded-xl border shadow-sm cursor-help transition-all duration-300 overflow-hidden ${finalStyle} hover:scale-[1.08] hover:z-50 hover:shadow-[0_0_15px_currentColor]`}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          showTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top,
            name: card.name,
            type: (card as any).rarity || "COMMON",
            description: card.description,
            effect: card.effect,
            isUsed,
          });
        }}
        onMouseLeave={hideTooltip}
      >
        {/* Inner glow mask to ensure emojis pop natively within squircle */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-[inherit]"></div>
        {IconComponent ? (
          <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5`} />
        ) : (
          <span
            className={`text-[12px] sm:text-[16px] md:text-[18px] leading-none drop-shadow-md select-none pointer-events-none scale-110`}
          >
            {renderEmoji}
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel border border-zinc-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-zinc-950/90">
      {/* UI Interaction Lock Overlay */}
      {revealPhase !== "IDLE" && revealPhase !== "POST_REVEAL" && (
        <div className="fixed inset-0 z-[100] cursor-not-allowed"></div>
      )}

      {/* Cinematic Phase Glow Overlays */}
      <AnimatePresence>{/* COUNTDOWN phase removed */}</AnimatePresence>

      <motion.div
        animate={{
          scale:
            revealPhase !== "IDLE" && revealPhase !== "POST_REVEAL" ? 1.02 : 1,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="flex flex-col h-full w-full"
      >
        {/* Real-time Card Status Note */}
        <div className="bg-blue-900/20 border-b border-blue-500/20 px-3 sm:px-4 py-2 flex items-center justify-center gap-2">
          <Info size={12} className="sm:w-3.5 sm:h-3.5 text-blue-400" />
          <span className="text-[10px] sm:text-[11px] text-blue-200/80 font-mono uppercase tracking-widest leading-tight">
            Cards shown = available usable cards
          </span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 md:grid-cols-16 gap-1 md:gap-2 p-2 sm:p-4 border-b border-zinc-800 bg-zinc-900/80 text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wider text-zinc-400">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4 sm:col-span-3 md:col-span-2 text-left pl-1">
            Team
          </div>
          <div className="hidden md:block col-span-1 text-center">R1</div>
          <div className="hidden md:block col-span-1 text-center">R2</div>
          <div className="hidden md:block col-span-1 text-center">R3</div>
          <div className="col-span-3 sm:col-span-2 md:col-span-3 text-left pl-1">
            Cards
          </div>
          <div className="col-span-2 sm:col-span-4 md:col-span-4 text-left pl-2">
            Effects
          </div>
          <div className="hidden md:block col-span-1 text-center">Bonus</div>
          <div className="col-span-2 sm:col-span-2 md:col-span-2 text-right pr-2">
            Score
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          <AnimatePresence>
            {teams.map((team, index) => (
              <LeaderboardRow
                key={team.id}
                team={team}
                allTeams={teams}
                index={index}
                totalRows={teams.length}
                renderCard={renderCard}
                revealPhase={revealPhase}
              />
            ))}
          </AnimatePresence>

          {teams.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest bg-zinc-900/50 rounded-xl backdrop-blur-sm border border-zinc-800/50 m-4">
              No Teams Found
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
