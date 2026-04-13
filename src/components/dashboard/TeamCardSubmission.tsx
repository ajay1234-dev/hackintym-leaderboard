"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Team, CardWindowState, PendingCardSubmission } from "@/types";
import { CARD_ICONS } from "@/lib/icons";
import {
  Send,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  Timer,
  X,
} from "lucide-react";

interface TeamCardSubmissionProps {
  team: Team;
  cards: Card[];
  allTeams: Team[];
  cardWindow: CardWindowState;
  timeRemaining: number;
  userSubmission: PendingCardSubmission | null;
  hasTeamSubmitted: (teamId: string) => boolean;
  onSubmitCard: (
    teamId: string,
    teamName: string,
    cardId: string,
    targetTeamId?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function TeamCardSubmission({
  team,
  cards,
  allTeams,
  cardWindow,
  timeRemaining,
  userSubmission,
  hasTeamSubmitted,
  onSubmitCard,
}: TeamCardSubmissionProps) {
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedCardData = cards.find((c) => c.id === selectedCard);
  const requiresTarget =
    selectedCardData?.type === "ATTACK" ||
    selectedCardData?.effect === "deduct_points" ||
    selectedCardData?.effect === "freeze";

  const handleSubmit = async () => {
    if (!selectedCard) {
      setError("Please select a card");
      return;
    }

    if (requiresTarget && !selectedTarget) {
      setError("This card requires a target team");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await onSubmitCard(
      team.id,
      team.teamName,
      selectedCard,
      requiresTarget ? selectedTarget : undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setSelectedCard("");
      setSelectedTarget("");
    } else {
      setError(result.error || "Failed to submit card");
    }
  };

  const ownedCards = team.cardsOwned || [];

  if (ownedCards.length === 0) {
    return (
      <div className="glass-panel rounded-xl border border-zinc-700/50 p-4 text-center">
        <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Your team has no cards</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl border neon-border p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-cyan-400" />
          Submit Card
        </h3>

        {/* Window Status */}
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
            cardWindow.isOpen
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {cardWindow.isOpen ? (
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3 animate-pulse" />
              {formatTime(timeRemaining)}
            </div>
          ) : (
            "Window Closed"
          )}
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-400">
                Card Submitted ✅
              </p>
              <p className="text-xs text-green-300/80">
                Waiting for admin execution...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Already Submitted */}
      {hasTeamSubmitted(team.id) && !showSuccess ? (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
          <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-blue-400">
            Card Already Submitted
          </p>
          <p className="text-xs text-blue-300/80 mt-1">
            You can only submit one card per window
          </p>
        </div>
      ) : !cardWindow.isOpen ? (
        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
          <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Submission Window Closed</p>
          <p className="text-xs text-zinc-600 mt-1">
            Wait for admin to open the next window
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              Select Card *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ownedCards.map((cardId) => {
                const card = cards.find((c) => c.id === cardId);
                if (!card) return null;

                const IconComponent = card.icon
                  ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS]
                  : null;

                return (
                  <button
                    key={cardId}
                    onClick={() => {
                      setSelectedCard(cardId);
                      setSelectedTarget("");
                      setError("");
                    }}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedCard === cardId
                        ? "bg-cyan-500/20 border-cyan-500/50 ring-2 ring-cyan-500/30"
                        : "bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mx-auto mb-2 rounded-lg border flex items-center justify-center ${
                        card.rarity === "LEGENDARY"
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                          : card.rarity === "RARE"
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      }`}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-4 h-4" />
                      ) : (
                        <span className="text-lg">{card.icon || "✨"}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {card.name}
                    </p>
                    <p className="text-[10px] text-zinc-400">{card.type}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Selection (if required) */}
          <AnimatePresence>
            {requiresTarget && selectedCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1">
                  <Target className="w-3 h-3 text-red-400" />
                  Select Target Team *
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-700 text-white text-sm outline-none focus:border-cyan-500/50"
                >
                  <option value="">Choose target...</option>
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
          </AnimatePresence>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={
              !selectedCard ||
              (requiresTarget && !selectedTarget) ||
              isSubmitting
            }
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Card
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
