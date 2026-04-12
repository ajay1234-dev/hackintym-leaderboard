const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/Leaderboard.tsx', 'utf8');

// 1. Add CooldownBadge Component
const cooldownBadgeComp = 
const CooldownBadge = ({ cooldownMs }: { cooldownMs: number }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!cooldownMs) return;
    const updateTime = () => {
       setTimeLeft(Math.max(0, Math.ceil((cooldownMs - Date.now()) / 1000)));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [cooldownMs]);

  if (timeLeft === 0) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const splitSecs = secs % 60;
    return \\:\\;
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-zinc-900 border-yellow-500/30 text-yellow-500/80 cursor-default select-none group relative">
      <span className="text-[10px] drop-shadow-sm pointer-events-none select-none">⏳</span>
      <span className="text-[10px] font-bold">
        Cooldown (\)
      </span>
    </div>
  );
};
;

if (!content.includes('const CooldownBadge')) {
  // insert right after ActiveEffectBadge
  content = content.replace(
    /(const ActiveEffectBadge = [\s\S]*?<\/div>\n  );\n};\n)/,
    $1\n
  );
}

// 2. ActiveEffectBadge modifications
// Update the format text blocks based on the exact user specification
content = content.replace(
  /if \(effect\.effect === 'multiply_score'\) \{\s*textToDisplay = \\$\{effect\.value\}x Next Score\;\s*\} else if \(effect\.effect === 'block'\) \{\s*textToDisplay = 'Shield';\s*\} else if \(effect\.effect === 'freeze'\) \{\s*textToDisplay = 'Freeze';\s*\}/,
  if (effect.effect === 'multiply_score') {
     textToDisplay = \\x Next Score\;
  } else if (effect.effect === 'block') {
     textToDisplay = 'Shield';
  } else if (effect.effect === 'freeze') {
     textToDisplay = 'Freeze';
  }
); // The text replacement logic was largely correct, but we should make sure the emoji is inside the span for Freeze string.
// Let's modify ActiveEffectBadge emoji render to enforce ❄ and 🛡 natively.
content = content.replace(
  /const hasLucideIcon = effect\.icon \&\& effect\.icon in CARD_ICONS;[\s\S]*?const renderEmoji = isLegacyString \? '✨' : \(effect\.icon \|\| '✨'\);/,
  const hasLucideIcon = effect.icon && effect.icon in CARD_ICONS;
  const IconComp = hasLucideIcon ? CARD_ICONS[effect.icon as keyof typeof CARD_ICONS] : null;
  let renderEmoji = (effect.icon || '✨');
  if (effect.effect === 'freeze') renderEmoji = '❄';
  else if (effect.effect === 'block') renderEmoji = '🛡';
  else if (effect.effect === 'multiply_score') renderEmoji = '⚡';
);


// 3. Fix renderCard used styles
content = content.replace(
  /finalStyle = 'opacity-15 grayscale filter border-dashed border-zinc-700 bg-zinc-800\/10 blur-\[1px\] mix-blend-luminosity hover:opacity-30';/,
  inalStyle = 'opacity-60 grayscale filter border border-zinc-700 bg-zinc-800/40';
);
content = content.replace(
  /className={\w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 \$\{isUsed \? 'opacity-40' : ''\}\}/g,
  className={\w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5\}
);
content = content.replace(
  /className={\	ext-\[12px\] sm:text-\[16px\] md:text-\[18px\] leading-none drop-shadow-md select-none pointer-events-none scale-110 \$\{isUsed \? 'opacity-40 grayscale blur-\[0\.5px\]' : ''\}\}/g,
  className={\	ext-[12px] sm:text-[16px] md:text-[18px] leading-none drop-shadow-md select-none pointer-events-none scale-110\}
);


// 4. Freeze/Shield Glow row logic
content = content.replace(
  /const glowClass = \(revealPhase === 'POST_REVEAL' && index < 3\)/,
  const isFrozen = team.activeEffects?.some(e => e.effect === 'freeze');
  const isShielded = team.activeEffects?.some(e => e.effect === 'block');

  const glowClass = isFrozen 
    ? 'bg-[rgba(239,68,68,0.2)] border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]'
    : isShielded
    ? 'bg-[rgba(59,130,246,0.2)] border-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]'
    : (revealPhase === 'POST_REVEAL' && index < 3)
);

// 5. Append Cooldown badges inside Active Effects Container
content = content.replace(
  /\{\(team\.activeEffects \|\| \[\]\)\.map\(\(effect\) => \(\s*<ActiveEffectBadge key=\{effect\.id\} effect=\{effect\} \/>\s*\)\)\}/,
  {(team.activeEffects || []).map((effect) => (
             <ActiveEffectBadge key={effect.id} effect={effect} />
           ))}
           {Object.entries(team.cardCooldowns || {}).map(([cId, timestamp]) => (
             <CooldownBadge key={\cd-\\} cooldownMs={timestamp as number} />
           ))}
);

fs.writeFileSync('src/components/dashboard/Leaderboard.tsx', content);
console.log('Done Leaderboard patches!');
