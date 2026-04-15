import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function addTeamCodes() {
  const teamsRef = collection(db, "teams");
  const snap = await getDocs(teamsRef);
  
  console.log("Generating and saving access codes for teams...");
  console.log("-------------------------------------------------");
  
  for (const teamDoc of snap.docs) {
    const data = teamDoc.data();
    if (!data.code) {
      const newCode = generateCode();
      await updateDoc(doc(db, "teams", teamDoc.id), { code: newCode });
      console.log(`Team: ${data.teamName.padEnd(25)} | Code: ${newCode}`);
    } else {
      console.log(`Team: ${data.teamName.padEnd(25)} | Code: ${data.code} (Already Existed)`);
    }
  }
  
  console.log("-------------------------------------------------");
  console.log("Done. You can hand out these codes to the teams.");
  process.exit(0);
}

addTeamCodes().catch(console.error);
