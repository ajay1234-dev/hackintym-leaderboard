const { db } = require('./src/lib/firebase');
const { collection, getDocs } = require('firebase/firestore');

async function test() {
  const teamsSnap = await getDocs(collection(db, 'teams'));
  const cardsSnap = await getDocs(collection(db, 'cards'));
  
  const cards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("CARDS IN DB:", cards.map(c => ({ id: c.id, name: c.name })));
  
  teamsSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Team: ${data.teamName}`);
    console.log(`  Owned:`, data.cardsOwned);
    console.log(`  Used:`, data.cardsUsed);
    console.log(`  Active:`, data.activeEffects);
  });
  
  process.exit(0);
}
test();
