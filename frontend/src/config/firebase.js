// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDi37qSw7GTKdqRY84nxkwq9jFy_E_k0Rs",
  authDomain: "tunedrop-c775f.firebaseapp.com",
  projectId: "tunedrop-c775f",
  storageBucket: "tunedrop-c775f.firebasestorage.app",
  messagingSenderId: "585362856728",
  appId: "1:585362856728:web:3b9b66b2f33bf73e019c6d",
  measurementId: "G-CCFPH184W8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 