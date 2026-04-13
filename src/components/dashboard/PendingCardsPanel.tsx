"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PendingCardSubmission, Card, Team, CardWindowState } from "@/types";
import { CARD_ICONS } from "@/lib/icons";
import {
  Play,
  X,
  Clock,
  Target,
  Trash2,
  CheckCircle2,
  Timer,
  AlertCircle,
} from "lucide-react";

interface PendingCardsPanelProps {
  pendingSubmissions: PendingCardSubmission[];
  cardWindow: CardWindowState;
  timeRemaining: number;
  teams: Team[];
  cards: Card[];
  onExecute: (submission: PendingCardSubmission) => Promise<void>;
  onExecuteAll: () => Promise<void>;
  onDelete: (submissionId: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onOpenWindow: (duration: number) => Promise<void>;
  onCloseWindow: () => Promise<void>;
}

export function PendingCardsPanel({
  pendingSubmissions,
  cardWindow,
  timeRemaining,
  teams,
  cards,
  onExecute,
  onExecuteAll,
  onDelete,
  onClearAll,
  onOpenWindow,
  onCloseWindow,
}: PendingCardsPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [executing, setExecuting] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === pendingSubmissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingSubmissions.map((s) => s.id)));
    }
  };

  const handleExecuteSelected = async () => {
    const selected = pendingSubmissions.filter((s) => selectedIds.has(s.id));
    setExecuting("batch");

    for (const submission of selected) {
      await onExecute(submission);
    }

    setExecuting(null);
    setSelectedIds(new Set());
  };

  return (
    <div className="glass-panel rounded-2xl border neon-border p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">
              📥 Pending Card Submissions
            </h2>
            <p className="text-xs text-zinc-400">
              {pendingSubmissions.length} submission
              {pendingSubmissions.length !== 1 ? "s" : ""} waiting
            </p>
          </div>
        </div>

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
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              OPEN • {formatTime(timeRemaining)}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              CLOSED
            </div>
          )}
        </div>
      </div>

      {/* Window Controls */}
      <div className="mb-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Card Submission Window
          </span>
        </div>
        <div className="flex gap-2">
          {!cardWindow.isOpen ? (
            <>
              <button
                onClick={() => onOpenWindow(60)}
                className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
              >
                Open 1 min
              </button>
              <button
                onClick={() => onOpenWindow(120)}
                className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
              >
                Open 2 min
              </button>
              <button
                onClick={() => onOpenWindow(300)}
                className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
              >
                Open 5 min
              </button>
            </>
          ) : (
            <button
              onClick={onCloseWindow}
              className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Close Window Early
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {pendingSubmissions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500">No pending card submissions</p>
          <p className="text-xs text-zinc-600 mt-1">
            {cardWindow.isOpen
              ? "Waiting for teams to submit..."
              : "Open a submission window to allow card usage"}
          </p>
        </div>
      ) : (
        <>
          {/* Batch Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-all"
            >
              {selectedIds.size === pendingSubmissions.length
                ? "Deselect All"
                : "Select All"}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleExecuteSelected}
                disabled={executing === "batch"}
                className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Execute Selected ({selectedIds.size})
              </button>
            )}
            <button
              onClick={onClearAll}
              className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>

          {/* Submissions List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            <AnimatePresence>
              {pendingSubmissions.map((submission, index) => {
                const card = cards.find((c) => c.id === submission.cardId);
                const targetTeam = teams.find(
                  (t) => t.id === submission.targetTeamId
                );
                const IconComponent = card?.icon
                  ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS]
                  : null;

                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedIds.has(submission.id)
                        ? "bg-green-500/10 border-green-500/50"
                        : "bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelection(submission.id)}
                        className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          selectedIds.has(submission.id)
                            ? "bg-green-500 border-green-500"
                            : "bg-zinc-800 border-zinc-600"
                        }`}
                      >
                        {selectedIds.has(submission.id) && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </button>

                      {/* Card Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                          card?.rarity === "LEGENDARY"
                            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                            : card?.rarity === "RARE"
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        }`}
                      >
                        {IconComponent ? (
                          <IconComponent className="w-5 h-5" />
                        ) : (
                          <span className="text-xl">{card?.icon || "✨"}</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white truncate">
                            {submission.teamName}
                          </span>
                          <span className="text-xs text-zinc-500">used</span>
                          <span
                            className={`text-xs font-bold ${
                              card?.rarity === "LEGENDARY"
                                ? "text-yellow-400"
                                : card?.rarity === "RARE"
                                ? "text-purple-400"
                                : "text-cyan-400"
                            }`}
                          >
                            {card?.name || "Unknown Card"}
                          </span>
                        </div>

                        {submission.targetTeamId && targetTeam && (
                          <div className="flex items-center gap-1 text-xs text-red-400 mb-1">
                            <Target className="w-3 h-3" />
                            <span>→ {targetTeam.teamName}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(
                              submission.submittedAt
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => onExecute(submission)}
                          disabled={executing === submission.id}
                          className="px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all disabled:opacity-50"
                          title="Execute"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDelete(submission.id)}
                          className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
