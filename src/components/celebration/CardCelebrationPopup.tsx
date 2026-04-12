"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/types";
import { CARD_ICONS } from "@/lib/icons";
import { GlowEffect } from "./GlowEffect";
import { ParticleBurst } from "./ParticleBurst";
import {
  playCardSound,
  playCelebrationSound,
  playScoreSound,
} from "@/lib/soundManager";

interface CardCelebrationPopupProps {
  celebration: {
    id: string;
    teamName: string;
    card: Card;
  };
  isVisible: boolean;
}

export function CardCelebrationPopup({
  celebration,
  isVisible,
}: CardCelebrationPopupProps) {
  const [lastCelebration, setLastCelebration] = useState(celebration);

  useEffect(() => {
    if (celebration) {
      setLastCelebration(celebration);
    }
  }, [celebration]);

  useEffect(() => {
    if (isVisible && celebration?.card) {
      if (celebration.card.rarity === "LEGENDARY") playCelebrationSound();
      else playCardSound();
    }
  }, [isVisible, celebration]);

  if (!lastCelebration) return null;

  const { teamName, card } = lastCelebration;

  // Rarity-based styling
  const getRarityStyles = (type: string) => {
    switch (type) {
      case "RARE":
        return {
          borderColor: "border-purple-500/50",
          glowColor: "rgba(168, 85, 247, 0.4)",
          textColor: "text-purple-400",
          bgGlow: "bg-purple-500/10",
          particleColor: "purple",
        };
      case "LEGENDARY":
        return {
          borderColor: "border-yellow-500/50",
          glowColor: "rgba(234, 179, 8, 0.6)",
          textColor: "text-yellow-400",
          bgGlow: "bg-yellow-500/10",
          particleColor: "yellow",
        };
      default: // COMMON
        return {
          borderColor: "border-cyan-500/50",
          glowColor: "rgba(34, 211, 238, 0.3)",
          textColor: "text-cyan-400",
          bgGlow: "bg-cyan-500/10",
          particleColor: "cyan",
        };
    }
  };

  const rarityStyles = getRarityStyles(card.rarity);
  const hasLucideIcon = card.icon && card.icon in CARD_ICONS;
  const IconComponent = hasLucideIcon
    ? CARD_ICONS[card.icon as keyof typeof CARD_ICONS]
    : null;
  const isLegacyString =
    !hasLucideIcon &&
    (card.icon || "").length > 2 &&
    /^[a-zA-Z]+$/.test(card.icon || "");
  const renderEmoji = isLegacyString ? "✨" : card.icon || "✨";

  // Animation intensity based on rarity
  const getAnimationIntensity = (type: string) => {
    switch (type) {
      case "LEGENDARY":
        return {
          scale: [0.3, 1.1, 1],
          opacity: [0, 1, 1],
          y: [-100, 0, 0],
          duration: 0.8,
        };
      case "RARE":
        return {
          scale: [0.4, 1.05, 1],
          opacity: [0, 1, 1],
          y: [-80, 0, 0],
          duration: 0.6,
        };
      default: // COMMON
        return {
          scale: [0.5, 1, 1],
          opacity: [0, 1, 1],
          y: [-50, 0, 0],
          duration: 0.5,
        };
    }
  };

  const animationConfig = getAnimationIntensity(card.rarity);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={celebration.id}
          initial={{ opacity: 0, scale: 0.8, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.4 } }}
          className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none px-2 sm:px-4"
        >
          {/* Background Glow Effect */}
          <GlowEffect rarity={card.rarity} />

          {/* Particle Burst */}
          <ParticleBurst rarity={card.rarity} />

          {/* Main Popup Container */}
          <motion.div
            initial={{
              scale: animationConfig.scale[0],
              opacity: animationConfig.opacity[0],
              y: animationConfig.y[0],
            }}
            animate={{
              scale: animationConfig.scale,
              opacity: animationConfig.opacity,
              y: animationConfig.y,
            }}
            exit={{
              scale: 0.8,
              opacity: 0,
              y: -20,
              transition: { duration: 0.3 },
            }}
            transition={{
              duration: animationConfig.duration,
              ease: "easeOut",
              times: [0, 0.6, 1],
            }}
            className={`
              relative backdrop-blur-xl bg-black/80 rounded-2xl border-2 
              ${rarityStyles.borderColor} 
              shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_60px_${rarityStyles.glowColor}]
              p-3 sm:p-4 md:p-6 min-w-[240px] sm:min-w-[280px] md:min-w-[320px] max-w-[85vw] sm:max-w-[90vw] md:max-w-100
              transform-gpu
            `}
            style={{
              boxShadow: `0 0 40px rgba(0,0,0,0.9), 0 0 60px ${rarityStyles.glowColor}, inset 0 0 20px rgba(255,255,255,0.05)`,
            }}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-xs font-black uppercase tracking-widest text-white mb-2"
              >
                🎴 NEW CARD UNLOCKED
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className={`text-lg font-bold ${rarityStyles.textColor} drop-shadow-[0_0_8px_currentColor]`}
              >
                {teamName.toUpperCase()} acquired {card.name.toUpperCase()}
              </motion.div>
            </div>

            {/* Card Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className={`
                relative flex flex-col items-center p-2 sm:p-3 md:p-4 rounded-xl border-2
                ${rarityStyles.borderColor} ${rarityStyles.bgGlow}
                backdrop-blur-sm
              `}
              style={{
                boxShadow: `inset 0 0 20px ${rarityStyles.glowColor}, 0 0 30px ${rarityStyles.glowColor}`,
              }}
            >
              {/* Card Icon */}
              <motion.div
                animate={
                  card.rarity === "LEGENDARY"
                    ? {
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl 
                  flex items-center justify-center
                  ${rarityStyles.borderColor} ${rarityStyles.bgGlow}
                  border-2 backdrop-blur-sm mb-2 sm:mb-3
                `}
                style={{
                  boxShadow: `0 0 20px ${rarityStyles.glowColor}, inset 0 0 10px ${rarityStyles.glowColor}`,
                }}
              >
                {IconComponent ? (
                  <IconComponent
                    className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 ${rarityStyles.textColor} drop-shadow-[0_0_10px_currentColor]`}
                  />
                ) : (
                  <span
                    className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-none drop-shadow-[0_0_15px_currentColor] ${rarityStyles.textColor}`}
                  >
                    {renderEmoji}
                  </span>
                )}
              </motion.div>

              {/* Card Details */}
              <div className="text-center">
                <div
                  className={`text-[10px] sm:text-xs md:text-xs font-black uppercase tracking-widest ${rarityStyles.textColor} mb-1`}
                >
                  {card.type}
                </div>
                <div className="text-xs sm:text-sm md:text-sm font-bold text-white mb-2">
                  {card.name}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-zinc-300 leading-relaxed max-w-[150px] sm:max-w-[180px] md:max-w-45">
                  {card.description}
                </div>
                <div
                  className={`
                  text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold mt-2 p-1 sm:p-1.5 md:p-2 rounded-lg
                  ${rarityStyles.bgGlow} ${rarityStyles.borderColor} border
                  ${rarityStyles.textColor}
                `}
                >
                  {card.effect}
                </div>
              </div>

              {/* Shimmer effect for legendary cards */}
              {card.rarity === "LEGENDARY" && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ borderRadius: "0.75rem" }}
                />
              )}
            </motion.div>

            {/* Rarity-specific decorative elements */}
            {card.rarity === "LEGENDARY" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-transparent to-yellow-500/20 rounded-2xl"
                style={{ filter: "blur(8px)" }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
