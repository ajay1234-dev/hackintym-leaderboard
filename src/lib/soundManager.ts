let audioEnabled = false;
let lastPlayed = 0;

export const enableAudio = () => {
  audioEnabled = true;
};

const play = (src: string, volume = 0.5) => {
  if (!audioEnabled || typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastPlayed < 200) return; // micro anti-spam

  lastPlayed = now;

  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => {});
};

export const playCelebrationSound = () => {
  play("/sounds/celebration.mp3", 0.6);
};

export const playRankChangeSound = () => {
  play("/sounds/rank-up.mp3", 0.7);
};

export const playScoreSound = () => {
  play("/sounds/score.mp3", 0.4);
};

export const playCardSound = () => {
  play("/sounds/card.mp3", 0.6);
};

export const playBountySound = () => {
  play("/sounds/bounty.mp3", 0.7);
};

export const playInjectionSound = () => {
  play("/sounds/alert.mp3", 0.65);
};

export const playActivitySound = () => {
  play("/sounds/activity.mp3", 0.3);
};
