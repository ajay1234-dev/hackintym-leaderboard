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
  type: 'common' | 'rare' | 'legendary';
  description: string;
  effect: string;
  icon: string;
}

export interface Injection {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'active' | 'resolved';
  type?: 'global' | 'selective';
  targetTeamId?: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  status: 'active' | 'completed';
}
