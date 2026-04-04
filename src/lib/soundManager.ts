let audioEnabled = false;
let lastPlayed = 0;
let currentSoundPriority = 0;

export const enableAudio = () => {
  audioEnabled = true;
};

const playWithPriority = (src: string, volume = 0.5, priority = 1) => {
  if (!audioEnabled || typeof window === 'undefined') return;

  const now = Date.now();
  if (priority === currentSoundPriority && now - lastPlayed < 200) return; // micro anti-spam for same priority

  if (priority >= currentSoundPriority) {
    currentSoundPriority = priority;
    lastPlayed = now;

    setTimeout(() => {
      if (currentSoundPriority === priority) currentSoundPriority = 0;
    }, 1500);

    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  }
};

export const playCelebrationSound = () => playWithPriority("/sounds/celebration.mp3", 0.6, 2);
export const playRankChangeSound = () => playWithPriority("/sounds/rank-up.mp3", 0.7, 2);
export const playScoreSound = () => playWithPriority("/sounds/score.mp3", 0.4, 1);
export const playCardSound = () => playWithPriority("/sounds/card.mp3", 0.6, 2);
export const playBountySound = () => playWithPriority("/sounds/bounty.mp3", 0.7, 2);
export const playInjectionSound = () => playWithPriority("/sounds/injection-alert.mp3", 0.65, 3);
export const playResolveSound = () => playWithPriority("/sounds/resolve.mp3", 0.65, 3);
export const playActivitySound = () => playWithPriority("/sounds/activity.mp3", 0.3, 1);
export const playHourAlertSound = () => playWithPriority("/sounds/hour-alert.mp3", 0.6, 3);
export const playTickingSound = () => playWithPriority("/sounds/ticking.mp3", 0.5, 1);
export const playTimeUpSound = () => playWithPriority("/sounds/time-up.mp3", 0.8, 3);
