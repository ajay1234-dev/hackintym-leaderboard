let lastPlayed: Record<string, number> = {};

let audioCtx: AudioContext | null = null;
const audioBuffers: Record<string, AudioBuffer> = {};
const fallbackPool: Record<string, HTMLAudioElement[]> = {};
const POOL_SIZE = 3; // Number of pre-warmed elements per sound for rapid-fire playback

const initAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

export const enableAudio = () => {
  const ctx = initAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
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
  "/sounds/card-activate.mp3",
  "/sounds/casino-reveal.mp3",
  "/sounds/lock-thud1.mp3",
  "/sounds/final-impact.mp3"
];

let isMutedForBulkReveal = false;

export const setMutedForBulkReveal = (mute: boolean) => {
  isMutedForBulkReveal = mute;
};

if (typeof window !== 'undefined') {
  // Pre-fetch all audio files
  AUDIO_FILES.forEach(async (src) => {
    try {
      // 1. Preload HTMLAudioElements for instant fallback pool
      fallbackPool[src] = Array.from({ length: POOL_SIZE }).map(() => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.load();
        return audio;
      });

      // 2. Preload AudioBuffers for Web Audio API
      const response = await fetch(src, { cache: 'force-cache' });
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const ctx = initAudioContext();
      if (!ctx) return;
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBuffers[src] = audioBuffer;
    } catch (err) {
      console.warn(`Failed to preload ${src}:`, err);
    }
  });
}

const playWithPriority = (src: string, volume = 0.5, priority = 1) => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  // Allow a very small 20ms gap to prevent brutal audio clustering on rapid loops
  if (lastPlayed[src] && now - lastPlayed[src] < 20) return; 
  lastPlayed[src] = now;

  const playFallback = () => {
    const pool = fallbackPool[src];
    if (pool) {
      // Find an element that is NOT currently playing
      const audio = pool.find(a => a.paused);
      if (audio) {
        audio.volume = volume;
        // Safely attempt to rewind; ignores InvalidStateError if metadata isn't loaded
        try { if (audio.currentTime > 0) audio.currentTime = 0; } catch (e) {}
        
        audio.play().catch((err) => {
          console.warn(`Fallback pool play blocked for ${src}:`, err);
          // If the pooled element is dead/blocked, try firing a fresh one
          const backup = new Audio(src);
          backup.volume = volume;
          backup.play().catch(() => {});
        });
      } else {
        // Pool is completely exhausted (all 3 playing at once). Spin up a temporary new instance!
        const overflowAudio = new Audio(src);
        overflowAudio.volume = volume;
        overflowAudio.play().catch(() => {});
      }
    } else {
      // Catches cases where the fetch loop hasn't initialized the pool yet
      const backup = new Audio(src);
      backup.volume = volume;
      backup.play().catch(() => {});
    }
  };

  const ctx = initAudioContext();
  if (!ctx) {
    playFallback();
    return;
  }

  const playBuffer = () => {
    const buffer = audioBuffers[src];
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
      } catch (err) {
        console.warn(`WebAudio buffer start failed for ${src}:`, err);
        playFallback();
      }
    } else {
      playFallback();
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(playBuffer).catch((err) => {
      console.warn("AudioContext resume rejected:", err);
      playFallback();
    });
  } else {
    playBuffer();
  }
};

export const playCelebrationSound = () => playWithPriority("/sounds/celebration.mp3", 0.6, 2);
export const playRankChangeSound = () => !isMutedForBulkReveal && playWithPriority("/sounds/rank-up.mp3", 0.7, 2);
export const playTopThreeSound = () => !isMutedForBulkReveal && playWithPriority("/sounds/top-three.mp3", 0.75, 4);
export const playTopTenSound = () => !isMutedForBulkReveal && playWithPriority("/sounds/top-ten.mp3", 0.7, 3);
export const playScoreSound = () => !isMutedForBulkReveal && playWithPriority("/sounds/score.mp3", 0.4, 1);
export const playScoreDeductSound = () => !isMutedForBulkReveal && playWithPriority("/sounds/score-deduct.mp3", 0.5, 1);
export const playCardSound = () => playWithPriority("/sounds/card.mp3", 0.6, 2);
export const playCardActivateSound = () => playWithPriority("/sounds/card-activate.mp3", 0.65, 3);
export const playBountySound = () => playWithPriority("/sounds/bounty.mp3", 0.7, 2);
export const playInjectionSound = () => playWithPriority("/sounds/injection-alert.mp3", 0.65, 3);
export const playFreezeSound = () => playWithPriority("/sounds/freeze.mp3", 0.7, 3);
export const playSpecialRuleSound = () => playWithPriority("/sounds/special-rule.mp3", 0.65, 3);
export const playResolveSound = () => playWithPriority("/sounds/resolve.mp3", 0.65, 3);
export const playActivitySound = () => !isMutedForBulkReveal && playWithPriority("/sounds/activity.mp3", 0.3, 1);
export const playHourAlertSound = () => playWithPriority("/sounds/hour-alert.mp3", 0.6, 3);
export const playHourPassedSound = () => playWithPriority("/sounds/hour-passed.mp3", 0.7, 4);
export const playTickingSound = () => playWithPriority("/sounds/ticking.mp3", 0.5, 1);
export const playTimeUpSound = () => playWithPriority("/sounds/time-up.mp3", 0.8, 3);
export const playBulkRevealSound = () => playWithPriority("/sounds/casino-reveal.mp3", 0.8, 5);
export const playLockThudSound = () => playWithPriority("/sounds/lock-thud1.mp3", 0.7, 4);
export const playFinalImpactSound = () => playWithPriority("/sounds/final-impact.mp3", 1.0, 6);

export const speakText = (text: string, delayMs = 0) => {
  // Completely disabled as per user request to destroy the robot voice
};


