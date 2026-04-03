'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ParticleBurstProps {
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
}

export function ParticleBurst({ rarity }: ParticleBurstProps) {
  // Performance-optimized particle configuration based on rarity
  const getParticleConfig = (type: string) => {
    switch (type) {
      case 'LEGENDARY':
        return {
          count: 8, // Reduced from 12 for performance
          colors: ['rgba(234, 179, 8, 0.8)', 'rgba(251, 191, 36, 0.6)', 'rgba(250, 204, 21, 0.4)'],
          size: { min: 3, max: 6 }, // Reduced sizes
          duration: { min: 1.2, max: 2.0 }, // Shorter duration
          distance: { min: 60, max: 120 } // Reduced distance
        };
      case 'RARE':
        return {
          count: 6, // Reduced from 8
          colors: ['rgba(168, 85, 247, 0.8)', 'rgba(196, 181, 253, 0.6)', 'rgba(167, 139, 250, 0.4)'],
          size: { min: 2, max: 4 },
          duration: { min: 1.0, max: 1.6 },
          distance: { min: 50, max: 100 }
        };
      default: // COMMON
        return {
          count: 4, // Reduced from 6
          colors: ['rgba(34, 211, 238, 0.8)', 'rgba(103, 232, 249, 0.6)', 'rgba(165, 243, 252, 0.4)'],
          size: { min: 2, max: 3 },
          duration: { min: 0.8, max: 1.4 },
          distance: { min: 40, max: 80 }
        };
    }
  };

  const config = getParticleConfig(rarity);

  // Generate particles with performance optimizations
  const particles = Array.from({ length: config.count }, (_, i) => {
    const angle = (360 / config.count) * i + (Math.random() * 20 - 10); // Add slight randomness
    const distance = config.distance.min + Math.random() * (config.distance.max - config.distance.min);
    const duration = config.duration.min + Math.random() * (config.duration.max - config.duration.min);
    const size = config.size.min + Math.random() * (config.size.max - config.size.min);
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    
    return {
      id: i,
      angle,
      distance,
      duration,
      size,
      color
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            opacity: 0, 
            scale: 0,
            x: 0, 
            y: 0 
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.3],
            x: Math.cos(particle.angle * Math.PI / 180) * particle.distance,
            y: Math.sin(particle.angle * Math.PI / 180) * particle.distance
          }}
          transition={{
            duration: particle.duration,
            ease: 'easeOut',
            times: [0, 0.2, 1]
          }}
          className="absolute top-1/2 left-1/2 origin-center"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: '50%',
            boxShadow: `0 0 ${particle.size * 1.5}px ${particle.color}`, // Reduced shadow size
            filter: 'blur(0.5px)',
            willChange: 'transform, opacity' // Performance optimization
          }}
        />
      ))}
      
      {/* Reduced sparkle effects for legendary cards */}
      {rarity === 'LEGENDARY' && (
        <>
          {particles.slice(0, 2).map((particle, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{ 
                opacity: 0, 
                scale: 0,
                rotate: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
                rotate: 360
              }}
              transition={{
                duration: 1.2 + i * 0.15, // Shorter duration
                ease: 'easeOut',
                delay: i * 0.08 // Shorter delay
              }}
              className="absolute top-1/2 left-1/2 origin-center"
              style={{
                width: '2px',
                height: '10px', // Reduced size
                background: `linear-gradient(to bottom, transparent, rgba(234, 179, 8, 0.8), transparent)`,
                transform: `translate(-50%, -50%) rotate(${particle.angle}deg) translateY(-15px)`, // Reduced distance
                willChange: 'transform, opacity, rotate' // Performance optimization
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
