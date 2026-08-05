import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, updateProfile, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, setDoc, getDoc, query, where, onSnapshot, orderBy, Timestamp, doc, getDocFromServer, updateDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export { signInWithPopup, signInAnonymously, updateProfile, signOut, onAuthStateChanged, collection, addDoc, setDoc, getDoc, query, where, onSnapshot, orderBy, Timestamp, updateDoc, deleteDoc, doc };
export type { User };
