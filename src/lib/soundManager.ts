let lastPlayed = 0;
let currentSoundPriority = 0;

let audioCtx: AudioContext | null = null;
const audioBuffers: Record<string, AudioBuffer> = {};

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
  "/sounds/lock-thud.mp3",
  "/sounds/final-impact.mp3"
];

let isMutedForBulkReveal = false;

export const setMutedForBulkReveal = (mute: boolean) => {
  isMutedForBulkReveal = mute;
};

if (typeof window !== 'undefined') {
  // Pre-fetch all audio files as ArrayBuffers into memory for instant, network-free playback later
  AUDIO_FILES.forEach(async (src) => {
    try {
      const response = await fetch(src, { cache: 'force-cache' });
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      // Decode using the shared context to avoid creating too many contexts
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
  const ctx = initAudioContext();
  if (!ctx || typeof window === 'undefined') return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = Date.now();
  if (priority === currentSoundPriority && now - lastPlayed < 200) return; // micro anti-spam for same priority

  if (priority >= currentSoundPriority) {
    currentSoundPriority = priority;
    lastPlayed = now;

    setTimeout(() => {
      if (currentSoundPriority === priority) currentSoundPriority = 0;
    }, 1500);

    const buffer = audioBuffers[src];
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(0);
    }
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
export const playLockThudSound = () => playWithPriority("/sounds/lock-thud.mp3", 0.7, 4);
export const playFinalImpactSound = () => playWithPriority("/sounds/final-impact.mp3", 1.0, 6);

export const speakText = (text: string, delayMs = 0) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  setTimeout(() => {
    window.speechSynthesis.cancel(); // kill existing speech
    const msg = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prefer English digital/robotic voices
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft Mark') || v.name.includes('Zira')));
    if (preferredVoice) msg.voice = preferredVoice;
    msg.pitch = 0.85; // slightly deeper, authoritative
    msg.rate = 1.05; // slightly faster
    window.speechSynthesis.speak(msg);
  }, delayMs);
};
