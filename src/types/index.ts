export interface ActiveEffect {
  id: string;
  effect: string;
  type: string;
  value: number | null;
  expiresAt: number | null;
  isPending: boolean;
  icon: string;
  sourceCardId?: string;
  sourceTeamId?: string;
  targetTeamId?: string;
}

export interface Team {
  id: string;
  teamName: string;
  review1: number;
  review2: number;
  review3: number;
  bonusPoints: number;
  cardsOwned?: string[];
  cardsUsed?: string[];
  activeEffects?: ActiveEffect[];
  cardCooldowns?: Record<string, number>;
}

export interface ActivityLog {
  id: string;
  action?: string; // Legacy
  teamName?: string;
  actionType?: "score" | "card" | "bounty" | "injection" | "system";
  message?: string;
  points?: number;
  timestamp: number;
}

export interface Card {
  id: string;
  name: string;
  rarity: "COMMON" | "RARE" | "LEGENDARY";
  type: "BOOST" | "ATTACK" | "DEFENSE" | "UTILITY" | string;
  description: string;
  effect:
    | "add_points"
    | "multiply_score"
    | "deduct_points"
    | "block"
    | "freeze"
    | "extend_time"
    | string;
  value: number | null;
  durationType: "INSTANT" | "NEXT_ACTION" | "TIMED" | string;
  durationValue: number | null;
  cooldown?: number;
  icon: string;
  color?: string;
  createdAt?: number;
}

export interface Injection {
  id: string;
  title: string;
  description: string;
  points: number;
  status: "active" | "resolved" | "staged";
  type?: "global" | "selective";
  targetTeamId?: string;
  rewardCardId?: string;
  eventType?: "POINTS" | "MULTIPLIER" | "FREEZE" | "CARD_DROP" | "SPECIAL_RULE";
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
  status: "active" | "completed";
  rewardCardId?: string;
}

export interface PendingCardSubmission {
  id: string;
  teamId: string;
  teamName: string;
  cardId: string;
  targetTeamId?: string;
  submittedAt: number;
}

export interface CardWindowState {
  isOpen: boolean;
  endsAt: number | null;
  duration: number; // in seconds
}

export interface ArenaBox {
  id: string;
  cards: string[]; // typically exactly 2 cards: [commonCardId, rareCardId]
}

export interface ArenaSelection {
  id: string;
  teamId: string;
  selectedBoxId: string;
  isLocked: boolean;
}

export interface ArenaState {
  isRevealed: boolean;
  isRevealing?: boolean;
  selectionDeadline?: number | null;
}
