let audioEnabled = true;
let lastPlayed = 0;
let currentSoundPriority = 0;

export const enableAudio = () => {
  audioEnabled = true;
};

const AUDIO_FILES = [
  "/sounds/celebration.mp3",
  "/sounds/rank-up.mp3",
  "/sounds/top-three.mp3",
  "/sounds/top-ten.mp3",
  "/sounds/score.mp3",
  "/sounds/score-deduct.mp3",
  "/sounds/card.mp3",
  "/sounds/bounty.mp3",
  "/sounds/injection-alert.mp3",
  "/sounds/freeze.mp3",
  "/sounds/special-rule.mp3",
  "/sounds/resolve.mp3",
  "/sounds/activity.mp3",
  "/sounds/hour-alert.mp3",
  "/sounds/ticking.mp3",
  "/sounds/hour-passed.mp3",
  "/sounds/time-up.mp3",
  "/sounds/card-activate.mp3"
];

const audioCache: Record<string, HTMLAudioElement> = {};

if (typeof window !== 'undefined') {
  // Ultra-aggressive background preloading to eliminate 1st-play lag
  AUDIO_FILES.forEach(src => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioCache[src] = audio;
  });
}

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

    // Fast-clone from memory cache prevents network/parsing stutters
    let audio: HTMLAudioElement;
    if (audioCache[src]) {
       audio = audioCache[src].cloneNode(true) as HTMLAudioElement;
    } else {
       audio = new Audio(src);
    }
    
    audio.volume = volume;
    audio.play().catch(() => {});
  }
};

export const playCelebrationSound = () => playWithPriority("/sounds/celebration.mp3", 0.6, 2);
export const playRankChangeSound = () => playWithPriority("/sounds/rank-up.mp3", 0.7, 2);
export const playTopThreeSound = () => playWithPriority("/sounds/top-three.mp3", 0.75, 4);
export const playTopTenSound = () => playWithPriority("/sounds/top-ten.mp3", 0.7, 3);
export const playScoreSound = () => playWithPriority("/sounds/score.mp3", 0.4, 1);
export const playScoreDeductSound = () => playWithPriority("/sounds/score-deduct.mp3", 0.5, 1);
export const playCardSound = () => playWithPriority("/sounds/card.mp3", 0.6, 2);
export const playCardActivateSound = () => playWithPriority("/sounds/card-activate.mp3", 0.65, 3);
export const playBountySound = () => playWithPriority("/sounds/bounty.mp3", 0.7, 2);
export const playInjectionSound = () => playWithPriority("/sounds/injection-alert.mp3", 0.65, 3);
export const playFreezeSound = () => playWithPriority("/sounds/freeze.mp3", 0.7, 3);
export const playSpecialRuleSound = () => playWithPriority("/sounds/special-rule.mp3", 0.65, 3);
export const playResolveSound = () => playWithPriority("/sounds/resolve.mp3", 0.65, 3);
export const playActivitySound = () => playWithPriority("/sounds/activity.mp3", 0.3, 1);
export const playHourAlertSound = () => playWithPriority("/sounds/hour-alert.mp3", 0.6, 3);
export const playHourPassedSound = () => playWithPriority("/sounds/hour-passed.mp3", 0.7, 4);
export const playTickingSound = () => playWithPriority("/sounds/ticking.mp3", 0.5, 1);
export const playTimeUpSound = () => playWithPriority("/sounds/time-up.mp3", 0.8, 3);
