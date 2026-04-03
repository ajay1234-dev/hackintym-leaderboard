'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowEffectProps {
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
}

export function GlowEffect({ rarity }: GlowEffectProps) {
  // Glow configuration based on rarity
  const getGlowConfig = (type: string) => {
    switch (type) {
      case 'LEGENDARY':
        return {
          color: 'rgba(234, 179, 8, 0.4)',
          secondaryColor: 'rgba(251, 191, 36, 0.2)',
          size: 400,
          intensity: 0.8,
          pulseScale: [1, 1.2, 1],
          shimmer: true
        };
      case 'RARE':
        return {
          color: 'rgba(168, 85, 247, 0.3)',
          secondaryColor: 'rgba(196, 181, 253, 0.15)',
          size: 350,
          intensity: 0.6,
          pulseScale: [1, 1.15, 1],
          shimmer: false
        };
      default: // COMMON
        return {
          color: 'rgba(34, 211, 238, 0.25)',
          secondaryColor: 'rgba(103, 232, 249, 0.1)',
          size: 300,
          intensity: 0.4,
          pulseScale: [1, 1.1, 1],
          shimmer: false
        };
    }
  };

  const config = getGlowConfig(rarity);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {/* Primary radial glow */}
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: 0.5 
        }}
        animate={{
          opacity: [0, config.intensity, config.intensity * 0.5],
          scale: config.pulseScale
        }}
        transition={{
          duration: 2.5,
          ease: 'easeOut',
          times: [0, 0.3, 1]
        }}
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: `${config.size}px`,
          height: `${config.size}px`,
          background: `radial-gradient(circle, ${config.color} 0%, ${config.secondaryColor} 40%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(20px)'
        }}
      />

      {/* Secondary glow layer for depth */}
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: 0.3,
          rotate: 0
        }}
        animate={{
          opacity: [0, config.intensity * 0.6, 0],
          scale: [0.3, 1.3, 1.5],
          rotate: 360
        }}
        transition={{
          duration: 3,
          ease: 'easeOut',
          times: [0, 0.4, 1]
        }}
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: `${config.size * 1.2}px`,
          height: `${config.size * 1.2}px`,
          background: `radial-gradient(circle, ${config.color} 0%, transparent 50%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(30px)'
        }}
      />

      {/* Shimmer effect for legendary cards */}
      {rarity === 'LEGENDARY' && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 2]
            }}
            transition={{
              duration: 2,
              ease: 'easeOut',
              delay: 0.5
            }}
            className="absolute top-1/2 left-1/2 origin-center"
            style={{
              width: `${config.size * 0.8}px`,
              height: `${config.size * 0.8}px`,
              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(10px)'
            }}
          />
          
          {/* Rotating shimmer ring */}
          <motion.div
            initial={{ rotate: 0, opacity: 0 }}
            animate={{
              rotate: 360,
              opacity: [0, 0.6, 0.6, 0]
            }}
            transition={{
              duration: 4,
              ease: 'linear',
              repeat: Infinity,
              times: [0, 0.1, 0.8, 1]
            }}
            className="absolute top-1/2 left-1/2 origin-center"
            style={{
              width: `${config.size * 1.1}px`,
              height: `${config.size * 1.1}px`,
              border: '2px solid transparent',
              borderTopColor: 'rgba(234, 179, 8, 0.4)',
              borderRightColor: 'rgba(234, 179, 8, 0.2)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(2px)'
            }}
          />
        </>
      )}

      {/* Ambient glow particles */}
      {rarity === 'LEGENDARY' && (
        Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={`ambient-${i}`}
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: 0, 
              y: 0 
            }}
            animate={{
              opacity: [0, 0.4, 0],
              scale: [0, 1, 0.5],
              x: Math.cos((i * 60) * Math.PI / 180) * (config.size * 0.6),
              y: Math.sin((i * 60) * Math.PI / 180) * (config.size * 0.6)
            }}
            transition={{
              duration: 2.5,
              ease: 'easeOut',
              delay: i * 0.1
            }}
            className="absolute top-1/2 left-1/2 origin-center"
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: config.color,
              borderRadius: '50%',
              filter: 'blur(4px)'
            }}
          />
        ))
      )}
    </div>
  );
}
