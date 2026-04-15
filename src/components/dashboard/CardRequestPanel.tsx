"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Team } from "@/types";
import { CardRequest, CardRequestWindow } from "@/hooks/useCardRequests";
import { CARD_ICONS } from "@/lib/icons";
import {
  Clock,
  Target,
  X,
  CheckCircle2,
  AlertCircle,
  Timer,
  Hourglass,
  Send,
} from "lucide-react";

interface CardRequestPanelProps {
  team: Team;
  allTeams: Team[];
  cards: Card[];
  requestWindow: CardRequestWindow;
  timeRemaining: number;
  teamRequests: CardRequest[];
  getCardRequestStatus: (teamId: string, cardId: string) => "none" | "pending" | "approved" | "rejected";
  onSubmitRequest: (
    teamId: string,
    teamName: string,
    cardId: string,
    targetTeamId?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function CardRequestPanel({
  team,
  allTeams,
  cards,
  requestWindow,
  timeRemaining,
  teamRequests,
  getCardRequestStatus,
  onSubmitRequest,
}: CardRequestPanelProps) {
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [recentSuccess, setRecentSuccess] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const ownedCards = (team.cardsOwned || [])
    .map((id) => cards.find((c) => c.id === id))
    .filter(Boolean) as Card[];

  const requiresTarget = (card: Card) =>
    card.type === "ATTACK" ||
    card.effect === "deduct_points" ||
    card.effect === "freeze" ||
    (card.effect === "utility" && ["REVEAL_PULSE", "LOCK_BREAKER", "REALITY_REWRITE"].includes(card.utilityType || ''));

  const handleOpenModal = (card: Card) => {
    if (!requestWindow.isOpen) return;
    const status = getCardRequestStatus(team.id, card.id);
    if (status === "pending" || status === "approved") return;
    setModalCard(card);
    setSelectedTarget("");
    setSubmitError("");
  };

  const handleConfirm = async () => {
    if (!modalCard) return;

    const needsTarget = requiresTarget(modalCard);
    if (needsTarget && !selectedTarget) {
      setSubmitError("Please select a target team");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const result = await onSubmitRequest(
      team.id,
      team.teamName,
      modalCard.id,
      needsTarget ? selectedTarget : undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      setRecentSuccess(modalCard.id);
      setTimeout(() => setRecentSuccess(null), 3000);
      setModalCard(null);
    } else {
      setSubmitError(result.error || "Failed to submit request");
    }
  };

  const getStatusBadge = (cardId: string) => {
    const status = getCardRequestStatus(team.id, cardId);
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <Hourglass className="w-2.5 h-2.5 animate-pulse" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Approved ✅
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
            <X className="w-2.5 h-2.5" />
            Rejected ❌
          </span>
        );
      default:
        return null;
    }
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case "LEGENDARY":
        return {
          border: "border-yellow-500/40",
          bg: "bg-yellow-500/10",
          icon: "text-yellow-400",
          shadow: "shadow-[0_0_15px_rgba(234,179,8,0.15)]",
          glow: "rgba(234,179,8,0.4)",
          name: "text-yellow-400",
        };
      case "RARE":
        return {
          border: "border-purple-500/40",
          bg: "bg-purple-500/10",
          icon: "text-purple-400",
          shadow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
          glow: "rgba(168,85,247,0.4)",
          name: "text-purple-400",
        };
      default:
        return {
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/10",
          icon: "text-cyan-400",
          shadow: "shadow-[0_0_10px_rgba(6,182,212,0.1)]",
          glow: "rgba(6,182,212,0.3)",
          name: "text-cyan-400",
        };
    }
  };

  if (ownedCards.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-zinc-600" />
        </div>
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No Cards in Inventory</p>
        <p className="text-xs text-zinc-600 mt-1">Your team hasn&apos;t received any power cards yet</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 w-full max-w-6xl"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-xl">🎴</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-widest">
                Use Your Cards
              </h2>
              <p className="text-xs text-zinc-500 tracking-wider">
                {team.teamName} &bull; {ownedCards.length} card{ownedCards.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {/* Window Status */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
              requestWindow.isOpen
                ? "bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                : "bg-zinc-800/60 border-zinc-700 text-zinc-500"
            }`}
          >
            {requestWindow.isOpen ? (
              <>
                <Timer className="w-3.5 h-3.5 animate-pulse" />
                Card Window: {formatTime(timeRemaining)}
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                Window Closed
              </>
            )}
          </div>
        </div>

        {/* Window Closed Notice */}
        <AnimatePresence>
          {!requestWindow.isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
              <p className="text-xs text-zinc-500">
                Card submission window is <span className="text-red-400 font-bold">closed</span>. Wait for admin to open the next window to submit card requests.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <AnimatePresence>
            {ownedCards.map((card, idx) => {
              const IconComponent = card.icon
                ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS]
                : null;
              const style = getRarityStyle(card.rarity);
              const status = getCardRequestStatus(team.id, card.id);
              const isDisabled =
                !requestWindow.isOpen ||
                status === "pending" ||
                status === "approved";

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, type: "spring" }}
                  className={`relative group rounded-2xl border p-4 flex flex-col items-center text-center transition-all duration-300 ${style.border} ${style.bg} ${style.shadow} ${
                    isDisabled
                      ? "opacity-70 cursor-not-allowed"
                      : "cursor-pointer hover:scale-[1.04] hover:shadow-[0_0_25px_var(--glow)] active:scale-[0.98]"
                  }`}
                  style={
                    !isDisabled
                      ? ({ "--glow": style.glow } as React.CSSProperties)
                      : {}
                  }
                  onClick={() => !isDisabled && handleOpenModal(card)}
                >
                  {/* Rarity label */}
                  <div className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest opacity-60 ${style.name}`}>
                    {card.rarity}
                  </div>

                  {/* Card Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl border flex items-center justify-center mb-3 mt-3 transition-all ${style.border} ${style.bg} ${style.icon}`}
                  >
                    {IconComponent ? (
                      <IconComponent className="w-7 h-7" />
                    ) : (
                      <span className="text-3xl">{card.icon || "✨"}</span>
                    )}
                  </div>

                  {/* Name */}
                  <p className={`text-xs font-black uppercase tracking-wide mb-1 ${style.name} leading-tight`}>
                    {card.name}
                  </p>

                  {/* Type */}
                  <div className="flex flex-col gap-1 items-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      {card.type}
                    </p>
                    <p className="text-[9px] text-zinc-400 leading-tight italic line-clamp-2 px-1">
                      {card.description || (() => {
                        if (card.effect === "add_points") return `+${card.value || 0} pts`;
                        if (card.effect === "deduct_points") return `${Math.abs(card.value || 0)} pts ded.`;
                        if (card.effect === "multiply_score") return `${card.value || 0}x Mult.`;
                        if (card.effect === "block") return "Shield Block";
                        if (card.effect === "freeze") return `Freeze (${card.durationValue || 0}s)`;
                        if (card.effect === "utility") return card.utilityType?.replace(/_/g, " ");
                        return "";
                      })()}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-auto w-full flex justify-center">
                    {getStatusBadge(card.id) || (
                      <button
                        disabled={isDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(card);
                        }}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          isDisabled
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 active:scale-95"
                        }`}
                      >
                        {requestWindow.isOpen ? "Request Use" : "Locked"}
                      </button>
                    )}
                  </div>

                  {/* Success flash */}
                  <AnimatePresence>
                    {recentSuccess === card.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl flex items-center justify-center bg-green-500/20 border-2 border-green-500/60 backdrop-blur-sm"
                      >
                        <div className="text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-1" />
                          <p className="text-xs font-black text-green-400">SUBMITTED!</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Recent Requests Status */}
        {teamRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5" />
              My Card Requests
            </h3>
            <div className="space-y-2">
              {teamRequests.map((req) => {
                const card = cards.find((c) => c.id === req.cardId);
                const target = allTeams.find((t) => t.id === req.targetTeamId);
                const IconComp = card?.icon
                  ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS]
                  : null;

                return (
                  <div
                    key={req.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      req.status === "approved"
                        ? "bg-green-500/10 border-green-500/30"
                        : req.status === "rejected"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-amber-500/5 border-amber-500/20"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        card?.rarity === "LEGENDARY"
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                          : card?.rarity === "RARE"
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      }`}
                    >
                      {IconComp ? (
                        <IconComp className="w-4 h-4" />
                      ) : (
                        <span>{card?.icon || "✨"}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {card?.name || "Unknown Card"}
                      </p>
                      {target && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                          <Target className="w-2.5 h-2.5" />
                          {target.teamName}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {req.status === "pending" && (
                        <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                          <Hourglass className="w-3 h-3 animate-pulse" /> Pending ⏳
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="text-[10px] font-black text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved ✅
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="text-[10px] font-black text-red-400 flex items-center gap-1">
                          <X className="w-3 h-3" /> Rejected ❌
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Request Modal */}
      <AnimatePresence>
        {modalCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setModalCard(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 300 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden"
            >
              {/* Grid bg */}
              <div className="absolute inset-0 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.03] text-cyan-500 pointer-events-none" />

              {/* Close */}
              <button
                onClick={() => setModalCard(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Card Preview */}
              <div className="relative z-10 flex flex-col items-center text-center mb-6">
                {(() => {
                  const style = getRarityStyle(modalCard.rarity);
                  const IconComp = modalCard.icon
                    ? CARD_ICONS[modalCard.icon as keyof typeof CARD_ICONS]
                    : null;
                  return (
                    <>
                      <div
                        className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center mb-4 ${style.border} ${style.bg} ${style.icon} ${style.shadow}`}
                      >
                        {IconComp ? (
                          <IconComp className="w-10 h-10" />
                        ) : (
                          <span className="text-4xl">{modalCard.icon || "✨"}</span>
                        )}
                      </div>
                      <h3 className={`text-xl font-black uppercase tracking-widest ${style.name}`}>
                        {modalCard.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
                        {modalCard.rarity} &bull; {modalCard.type}
                      </p>
                      <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                        {modalCard.description}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Target Selection for ATTACK cards */}
              {requiresTarget(modalCard) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4"
                >
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-red-400" />
                    Select Target Team *
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => {
                      setSelectedTarget(e.target.value);
                      setSubmitError("");
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-red-500/30 text-white text-sm outline-none focus:border-red-500/60 transition-colors"
                  >
                    <option value="">Choose target team...</option>
                    {allTeams
                      .filter((t) => t.id !== team.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.teamName}
                        </option>
                      ))}
                  </select>
                </motion.div>
              )}

              {/* Error */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {submitError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                disabled={
                  isSubmitting ||
                  (requiresTarget(modalCard) && !selectedTarget)
                }
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black uppercase tracking-widest text-sm hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
              <p className="text-[10px] text-zinc-600 text-center mt-3">
                Admin will review and approve your request
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
