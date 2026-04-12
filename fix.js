const fs = require('fs');
let content = fs.readFileSync('src/app/control-room/page.tsx', 'utf8');

// 1. Add isPending logic
content = content.replace(
  /const remainingCD = isCoolingDown \? Math\.ceil\(\(cooldownTimestamp - uiClock\) \/ 1000\) : 0;[\s\S]*?const isDisabled = isLocked \|\| isCoolingDown;/,
  const remainingCD = isCoolingDown ? Math.ceil((cooldownTimestamp - uiClock) / 1000) : 0;\n                           const minutes = Math.floor(remainingCD / 60);\n                           const seconds = remainingCD % 60;\n                           const formattedCD = \\:\\;\n                           \n                           const isPending = team.activeEffects?.some(e => e.sourceCardId === cardId && e.isPending);\n                           const isDisabled = isLocked || isCoolingDown || isPending;
);

// 2. Change the button classes
content = content.replace(
  /className={\lex items-center gap-1 bg-zinc-800 border \ px-2 py-0\.5 rounded text-\[10px\] text-white flex-1 transition-colors\}/g,
  "className={lex items-center gap-1 bg-zinc-800 border  px-2 py-0.5 rounded text-[10px] text-white flex-1 transition-colors}"
);

// 3. Change button text to show PENDING
content = content.replace(
  /\{isCoolingDown \? \([\s\S]*?<span className="ml-auto text-cyan-400 font-bold tracking-widest text-\[9px\] uppercase">⏳ \{formattedCD\}<\/span>[\s\S]*?\) : \([\s\S]*?<span className="ml-auto text-red-400 font-bold tracking-widest text-\[9px\] uppercase">EXECUTE<\/span>[\s\S]*?\)\}/,
  {isPending ? (
                                   <span className="ml-auto text-amber-400 font-bold tracking-widest text-[9px] uppercase">PENDING</span>
                                 ) : isCoolingDown ? (
                                   <span className="ml-auto text-cyan-400 font-bold tracking-widest text-[9px] uppercase">⏳ {formattedCD}</span>
                                 ) : (
                                   <span className="ml-auto text-red-400 font-bold tracking-widest text-[9px] uppercase">EXECUTE</span>
                                 )}
);

// 4. Add the cardsUsed loop right after cardsOwned loop
content = content.replace(
  / \}\)\}\s*<\/div>\s*<\/div>\s*\{\/\* Delete & Apply \*\/\}/,
   })}\n                         \n                         {/* Used Cards (Dimmed) */}\n                         {(team.cardsUsed || []).map((cardId, i) => {\n                           const c = cards.find(ca => ca.id === cardId);\n                           if(!c) return null;\n                           return (\n                             <div key={\used-\-\\} className="flex items-center gap-1 opacity-40 grayscale pointer-events-none">\n                               <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-500 flex-1">\n                                 {c.icon} <span className="truncate max-w-[80px] line-through">{c.name}</span>\n                                 <span className="ml-auto text-zinc-600 font-bold tracking-widest text-[9px] uppercase">USED</span>\n                               </div>\n                             </div>\n                           );\n                         })}\n                       </div>\n                     </div>\n\n                     {/* Delete & Apply */}
);

fs.writeFileSync('src/app/control-room/page.tsx', content);
console.log('Successfully patched page.tsx');
