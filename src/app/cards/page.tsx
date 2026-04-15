"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_ICONS } from "@/lib/icons";

const CATEGORIES = ["COMMON", "RARE", "LEGENDARY"] as const;
type Category = (typeof CATEGORIES)[number];

export default function CardsLibrary() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Category>("COMMON");

  useEffect(() => {
    const q = query(collection(db, "cards"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const rarity = (
          data.rarity ||
          (["COMMON", "RARE", "LEGENDARY"].includes(data.type)
            ? data.type
            : null) ||
          "COMMON"
        ).toUpperCase();
        return {
          id: doc.id,
          ...data,
          rarity,
        } as Card;
      });

      cardsData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setCards(cardsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => c.rarity === activeTab);
  }, [cards, activeTab]);

  const cardsCount = useMemo(() => {
    return {
      COMMON: cards.filter((c) => c.rarity === "COMMON").length,
      RARE: cards.filter((c) => c.rarity === "RARE").length,
      LEGENDARY: cards.filter((c) => c.rarity === "LEGENDARY").length,
    };
  }, [cards]);

  return (
    <main className="min-h-screen py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8 overflow-x-hidden w-full">
      <header className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border neon-border z-10 relative shadow-[0_0_30px_rgba(57,255,20,0.05)]">
        <div>
          <h1 className="text-2xl md:text-5xl font-black uppercase drop-shadow-[0_0_15px_rgba(57,255,20,0.5)] text-[#39ff14]">
            Power Cards
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm tracking-[0.2em] font-bold uppercase mt-1">
            Registry Protocol
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-zinc-400 hover:text-white border border-zinc-700 hover:border-[#39ff14] hover:bg-[#39ff14]/10 transition-all py-2.5 px-4 sm:px-5 rounded-lg text-xs sm:text-sm font-black uppercase tracking-widest shadow-sm w-full md:w-auto h-12 md:h-auto shrink-0"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </header>

      {/* Tabs Layout */}
      <div className="flex gap-2 p-2 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 overflow-x-auto relative z-10 scrollbar-none snap-x w-full">
        {CATEGORIES.map((tab) => {
          const isActive = activeTab === tab;
          let tabColors = "";
          if (tab === "COMMON")
            tabColors = isActive
              ? "text-cyan-400"
              : "text-zinc-500 hover:text-cyan-400/50";
          if (tab === "RARE")
            tabColors = isActive
              ? "text-purple-400"
              : "text-zinc-500 hover:text-purple-400/50";
          if (tab === "LEGENDARY")
            tabColors = isActive
              ? "text-yellow-400"
              : "text-zinc-500 hover:text-yellow-400/50";

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-3 rounded-xl font-black tracking-widest text-sm uppercase transition-all whitespace-nowrap shrink-0 min-w-[120px] sm:flex-1 lg:flex-none snap-center ${tabColors} ${
                isActive
                  ? "scale-[1.02] drop-shadow-[0_0_8px_currentColor]"
                  : ""
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={`absolute inset-0 rounded-xl border z-0 ${
                    tab === "COMMON"
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : tab === "RARE"
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-yellow-500/50 bg-yellow-500/10"
                  }`}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {tab}{" "}
                <span className="opacity-60 text-xs">({cardsCount[tab]})</span>
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass-panel p-16 rounded-2xl flex items-center justify-center neon-border">
          <div className="w-8 h-8 rounded-full border-4 border-t-[#39ff14] border-zinc-800 animate-spin flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-4 border-t-purple-500 border-zinc-800 animate-spin-reverse"></div>
          </div>
        </div>
      ) : (
        <motion.div layout className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full"
            >
              {filteredCards.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
                  <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase">
                    No{" "}
                    <span
                      className={
                        activeTab === "COMMON"
                          ? "text-cyan-400/50"
                          : activeTab === "RARE"
                          ? "text-purple-400/50"
                          : "text-yellow-400/50"
                      }
                    >
                      {activeTab}
                    </span>{" "}
                    anomalies detected.
                  </p>
                </div>
              )}

              {filteredCards.map((card, i) => {
                let borderClass =
                  "border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.05)] hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-gradient-to-br from-zinc-900 to-zinc-900";
                let glowClass = "bg-cyan-500";
                let textClass =
                  "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
                let cardGlowEffect = "";

                if (card.rarity === "RARE") {
                  borderClass =
                    "border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:border-purple-400 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] bg-gradient-to-b from-zinc-900 via-purple-900/10 to-zinc-900";
                  glowClass = "bg-purple-500";
                  textClass =
                    "text-purple-400 border-purple-500/60 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)] filter brightness-110";
                } else if (card.rarity === "LEGENDARY") {
                  borderClass =
                    "border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:border-white hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] bg-gradient-to-br from-zinc-900 via-yellow-900/20 to-amber-950/30 border-b-yellow-500 border-r-yellow-500 drop-shadow-lg scale-[1.01]";
                  glowClass = "bg-yellow-400";
                  textClass =
                    "text-yellow-300 border-yellow-400 bg-yellow-400/20 shadow-[inset_0_0_15px_rgba(234,179,8,0.3),0_0_20px_rgba(234,179,8,0.6)] drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] ring-1 ring-yellow-400/50";
                  cardGlowEffect =
                    "animate-[pulse_3s_ease-in-out_infinite_alternate] z-10";
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
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    key={card.id}
                    className={`w-full min-h-[460px] flex flex-col justify-between glass-panel p-5 sm:p-6 rounded-3xl border relative group hover:-translate-y-2 hover:rotate-[1deg] transition-all duration-300 cursor-default ${borderClass} ${cardGlowEffect}`}
                  >
                    {/* Background Glow */}
                    <div
                      className={`absolute -top-12 -right-12 w-32 h-32 blur-[50px] opacity-20 group-hover:opacity-60 transition-opacity duration-500 ${glowClass}`}
                    ></div>

                    {/* Legendary Shimmer */}
                    {card.rarity === "LEGENDARY" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-20 pointer-events-none"></div>
                    )}

                    <div className="flex flex-col h-full relative z-10 w-full">
                      <div className="flex items-start justify-between mb-4 sm:mb-6 shrink-0">
                        <div
                          className={`w-12 h-12 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform duration-300 shrink-0 flex items-start justify-start ${
                            textClass.split(" ")[0]
                          }`}
                        >
                          {IconComponent ? (
                            <IconComponent className="w-10 h-10 sm:w-12 sm:h-12" />
                          ) : (
                            <span className="text-4xl sm:text-5xl leading-none inline-block transition-transform duration-300">
                              {renderEmoji}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded border shadow-sm shrink-0 whitespace-nowrap ${textClass}`}
                        >
                          {card.type}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3 uppercase tracking-tight leading-tight shrink-0">
                          {card.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed font-medium break-words px-1">
                          {card.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-zinc-800 shrink-0 mt-auto">
                        <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
                          Logic Sequence
                        </div>
                        <div
                          className={`text-[11px] sm:text-xs font-mono font-black tracking-wider px-2.5 sm:px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 w-full ${
                            textClass.split(" ")[0]
                          }`}
                        >
                          {(() => {
                            if (card.effect === "add_points") return `+${card.value || 0} Points`;
                            if (card.effect === "deduct_points") return `${Math.abs(card.value || 0)} Pts Deduction`;
                            if (card.effect === "multiply_score") return `${card.value || 0}x Multiplier`;
                            if (card.effect === "block") return "Defense: Shield Block";
                            if (card.effect === "freeze") return `Effect: Freeze (${card.durationValue || 0}s)`;
                            if (card.effect === "utility") return `Logic: ${card.utilityType?.replace(/_/g, " ")}`;
                            return card.effect;
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}
