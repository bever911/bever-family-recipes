// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA0ZCgyjVAqKBDbR9-iiUb8bVyH7UijiDo",
  authDomain: "bever-family-recipes.firebaseapp.com",
  projectId: "bever-family-recipes",
  storageBucket: "bever-family-recipes.firebasestorage.app",
  messagingSenderId: "609429863508",
  appId: "1:609429863508:web:aee0811bd4c8757d2501c1"
};

const firebaseApp = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export default firebaseApp;
