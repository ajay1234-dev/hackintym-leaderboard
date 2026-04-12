const fs = require('fs');

// 1. RE-ADD THE GLOW IN control-room/page.tsx
let controlRoom = fs.readFileSync('src/app/control-room/page.tsx', 'utf8');

const crOriginal1 = 'className="w-10 h-10"';
const crReplace1 = 'className="w-10 h-10 drop-shadow-[0_0_15px_currentColor]"';
controlRoom = controlRoom.replace(crOriginal1, crReplace1);

const crOriginal2 = 'className="text-4xl leading-none inline-block scale-110"';
const crReplace2 = 'className="text-4xl leading-none inline-block drop-shadow-[0_0_15px_currentColor] scale-110"';
controlRoom = controlRoom.replace(crOriginal2, crReplace2);

fs.writeFileSync('src/app/control-room/page.tsx', controlRoom);
console.log('Restored glow in control-room');

// 2. REMOVE THE GLOW IN cards/page.tsx
let cardsPage = fs.readFileSync('src/app/cards/page.tsx', 'utf8');

const cardsOriginal1 = 'className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_15px_currentColor]"';
const cardsReplace1 = 'className="w-10 h-10 sm:w-12 sm:h-12"';
cardsPage = cardsPage.replace(cardsOriginal1, cardsReplace1);

// We need to escape the regex correctly to match inline-block drop-shadow-[...] transition-transform...
cardsPage = cardsPage.replace(/className="text-4xl sm:text-5xl leading-none inline-block drop-shadow-\\[0_0_15px_currentColor\\] transition-transform duration-300"/, 'className="text-4xl sm:text-5xl leading-none inline-block transition-transform duration-300"');

fs.writeFileSync('src/app/cards/page.tsx', cardsPage);
console.log('Removed glow in cards library');
