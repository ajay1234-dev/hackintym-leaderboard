export interface Team {
  id: string;
  teamName: string;
  review1: number;
  review2: number;
  review3: number;
  bonusPoints: number;
  cardsOwned?: string[];
  cardsUsed?: string[];
}

export interface ActivityLog {
  id: string;
  action?: string; // Legacy
  teamName?: string;
  actionType?: 'score' | 'card' | 'bounty' | 'injection' | 'system';
  message?: string;
  points?: number;
  timestamp: number;
}

export interface Card {
  id: string;
  name: string;
  type: 'COMMON' | 'RARE' | 'LEGENDARY';
  description: string;
  effect: string;
  icon: string;
}

export interface Injection {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'active' | 'resolved' | 'staged';
  type?: 'global' | 'selective';
  targetTeamId?: string;
  rewardCardId?: string;
  eventType?: 'POINTS' | 'MULTIPLIER' | 'FREEZE' | 'CARD_DROP' | 'SPECIAL_RULE';
  multiplier?: number;
  duration?: number;
  expiresAt?: number;
  triggerAtRemainingTime?: number; // Automatic deployment hook relative to remaining seconds
  isTriggered?: boolean;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  status: 'active' | 'completed';
  rewardCardId?: string;
}
