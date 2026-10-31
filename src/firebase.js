import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Public Firebase web-app configuration supplied for Foundation app.
// Access is protected by Firebase Authentication and Firestore Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyB4yO6RPwjArSSgG2ndmcnLCPvAsUiK9Tc",
  authDomain: "foundation-app-84579.firebaseapp.com",
  projectId: "foundation-app-84579",
  storageBucket: "foundation-app-84579.firebasestorage.app",
  messagingSenderId: "118247207640",
  appId: "1:118247207640:web:1662e7d86331845caa9dad",
  measurementId: "G-P6VPZC23HG",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is optional and only initializes in supported browser environments.
export const analyticsReady = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);

export const firebaseConfigured = true;
