"use client";

import { useState, useRef } from "react";
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
  Zap,
  Shield,
  RefreshCw,
} from "lucide-react";

interface CardRequestsAdminPanelProps {
  cardRequests: CardRequest[];
  requestWindow: CardRequestWindow;
  timeRemaining: number;
  teams: Team[];
  cards: Card[];
  onApprove: (request: CardRequest) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onOpenWindow: (seconds: number) => Promise<void>;
  onCloseWindow: () => Promise<void>;
}

export function CardRequestsAdminPanel({
  cardRequests,
  requestWindow,
  timeRemaining,
  teams,
  cards,
  onApprove,
  onReject,
  onOpenWindow,
  onCloseWindow,
}: CardRequestsAdminPanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "history">("pending");

  // Track which request IDs have already been seen so we only animate NEW ones
  const seenIds = useRef<Set<string>>(new Set());

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const pendingRequests = cardRequests.filter((r) => r.status === "pending");
  const historyRequests = cardRequests.filter((r) => r.status !== "pending");

  const handleApprove = async (request: CardRequest) => {
    setProcessingId(request.id);
    await onApprove(request);
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    await onReject(requestId);
    setProcessingId(null);
  };

  const getRarityStyle = (rarity?: string) => {
    switch (rarity) {
      case "LEGENDARY":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "RARE":
        return "bg-purple-500/10 border-purple-500/30 text-purple-400";
      default:
        return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
    }
  };

  // Stable row — only entrance animation on truly new IDs, zero re-animation on re-renders
  const RequestRow = ({
    request,
    showActions,
  }: {
    request: CardRequest;
    showActions: boolean;
  }) => {
    const card = cards.find((c) => c.id === request.cardId);
    const submittingTeam = teams.find((t) => t.id === request.teamId);
    const targetTeam = teams.find((t) => t.id === request.targetTeamId);
    const IconComponent = card?.icon
      ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS]
      : null;
    const isProcessing = processingId === request.id;

    // Only animate if this ID hasn't been seen before
    const isNew = !seenIds.current.has(request.id);
    if (isNew) seenIds.current.add(request.id);

    return (
      <motion.div
        key={request.id}
        initial={isNew ? { opacity: 0, y: -8 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`rounded-xl border p-3 ${
          request.status === "approved"
            ? "bg-green-500/5 border-green-500/20"
            : request.status === "rejected"
            ? "bg-red-500/5 border-red-500/20 opacity-60"
            : "bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-600"
        } transition-colors`}
      >
        <div className="flex items-center gap-3">
          {/* Card Icon */}
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getRarityStyle(card?.rarity)}`}
          >
            {IconComponent ? (
              <IconComponent className="w-5 h-5" />
            ) : (
              <span className="text-xl">{card?.icon || "✨"}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-black text-white truncate">
                {submittingTeam?.teamName || request.teamName}
              </span>
              <span className="text-[10px] text-zinc-500">→</span>
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
            {targetTeam && (
              <div className="flex items-center gap-1 text-[10px] text-red-400">
                <Target className="w-2.5 h-2.5" />
                <span>Target: {targetTeam.teamName}</span>
              </div>
            )}
            <div className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              {new Date(request.createdAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Actions / Status */}
          <div className="shrink-0 flex items-center gap-1.5">
            {showActions ? (
              <>
                <button
                  onClick={() => handleApprove(request)}
                  disabled={isProcessing}
                  id={`approve-request-${request.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/30 disabled:opacity-50 transition-colors active:scale-95"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing}
                  id={`reject-request-${request.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 disabled:opacity-50 transition-colors active:scale-95"
                >
                  <X className="w-3 h-3" />
                  Reject
                </button>
              </>
            ) : (
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  request.status === "approved"
                    ? "text-green-400 bg-green-500/10 border border-green-500/20"
                    : "text-red-400 bg-red-500/10 border border-red-500/20"
                }`}
              >
                {request.status === "approved" ? "✅ Approved" : "❌ Rejected"}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl border border-zinc-800 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-white">
              ⚡ Card Requests
            </h2>
            <p className="text-xs text-zinc-400">
              {pendingRequests.length} pending &bull; {historyRequests.length} processed
            </p>
          </div>
        </div>

        {/* Live Status — static dot, no pulse */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black uppercase ${
            requestWindow.isOpen
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-zinc-800/60 border-zinc-700 text-zinc-500"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              requestWindow.isOpen ? "bg-green-400" : "bg-zinc-600"
            }`}
          />
          {requestWindow.isOpen ? `OPEN • ${formatTime(timeRemaining)}` : "CLOSED"}
        </div>
      </div>

      {/* Window Controls */}
      <div className="mb-5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-700/50">
        <div className="flex items-center gap-2 mb-2.5">
          <Timer className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">
            Card Request Window
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!requestWindow.isOpen ? (
            <>
              {[
                { label: "1 min", seconds: 60 },
                { label: "2 min", seconds: 120 },
                { label: "5 min", seconds: 300 },
              ].map(({ label, seconds }) => (
                <button
                  key={label}
                  id={`open-window-${label.replace(" ", "")}`}
                  onClick={() => onOpenWindow(seconds)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-black hover:bg-green-500/20 transition-colors uppercase tracking-widest active:scale-95"
                >
                  Open {label}
                </button>
              ))}
            </>
          ) : (
            <button
              onClick={onCloseWindow}
              id="close-card-window"
              className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
            >
              <X className="w-4 h-4" />
              Close Window Early
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
        {(["pending", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${
              tab === t
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "pending"
              ? `Pending (${pendingRequests.length})`
              : `History (${historyRequests.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "pending" ? (
        pendingRequests.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No pending requests</p>
            <p className="text-xs text-zinc-600 mt-1">
              {requestWindow.isOpen
                ? "Waiting for teams to submit card requests..."
                : "Open a window to allow card requests"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {pendingRequests.map((request) => (
                <RequestRow key={request.id} request={request} showActions={true} />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : historyRequests.length === 0 ? (
        <div className="py-8 text-center">
          <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No processed requests yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {historyRequests.map((request) => (
              <RequestRow key={request.id} request={request} showActions={false} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
