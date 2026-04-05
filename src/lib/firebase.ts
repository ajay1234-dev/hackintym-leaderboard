import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Validate required environment variables statically (Next.js requires explicit literal access)
const missingEnvVars: string[] = [];
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('Missing required Firebase environment variables:', missingEnvVars.join(', '));
  // In Vercel, throw to halt if strictly missing
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
} else if (missingEnvVars.length === 0) {
  console.log('✅ Firebase Environment Variables Loaded:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "demo-sender",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if config is valid or in development
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use experimentalAutoDetectLongPolling to explicitly prevent WebChannel 'Listen' stream transport errors in Next.js dev environment
const db = !getApps().length 
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }) 
  : getFirestore(app);
const auth = getAuth(app);

// Export configuration status
export const isFirebaseConfigured = missingEnvVars.length === 0;

export { app, db, auth };
