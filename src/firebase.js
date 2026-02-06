import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// YOUR EXACT CONFIGURATION FROM THE SCREENSHOT
const firebaseConfig = {
  apiKey: "AIzaSyB-j2PlwHFzwKWHRNyIFR1aNZqdVRHS_l4",
  authDomain: "stable-talk.firebaseapp.com",
  projectId: "stable-talk",
  storageBucket: "stable-talk.firebasestorage.app",
  messagingSenderId: "261641732141",
  appId: "1:261641732141:web:8d30751226507e179cb8a4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);