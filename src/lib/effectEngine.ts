import { Injection } from '@/types';

// Returns whether an injection is currently considered strictly active based on time.
export const isInjectionActive = (inj: Injection) => {
  if (inj.status !== 'active') return false;
  if (inj.expiresAt && Date.now() > inj.expiresAt) return false;
  return true;
};

// Gets all genuinely active global phenomena.
export const getActiveGlobalPhenomena = (injections: Injection[]) => {
  return injections.filter(inj => inj.type === 'global' && isInjectionActive(inj));
};

// Returns the effective scalar for points. 1 means no active multipliers.
export const getActiveMultiplier = (injections: Injection[]): number => {
  const globalEvents = getActiveGlobalPhenomena(injections);
  const activeMultiplierEvent = globalEvents.find(inj => inj.eventType === 'MULTIPLIER');
  
  if (activeMultiplierEvent && activeMultiplierEvent.multiplier) {
    return activeMultiplierEvent.multiplier;
  }
  return 1;
};

// Returns true if manual score injections are currently disabled globally.
export const isFrozen = (injections: Injection[]): boolean => {
  const globalEvents = getActiveGlobalPhenomena(injections);
  return globalEvents.some(inj => inj.eventType === 'FREEZE');
};
