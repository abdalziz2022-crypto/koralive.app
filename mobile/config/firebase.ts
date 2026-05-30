import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, doc, collection, getDocs, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same client credential definitions as your Vercel web application
const firebaseConfig = {
  projectId: "gen-lang-client-0959045190",
  appId: "1:958469007898:web:7c9a852967b8c2b5b97fa3",
  apiKey: "AIzaSyB4asms_LyYqluR9v9EZrKohsvNF7Xqwbo",
  authDomain: "gen-lang-client-0959045190.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-8063f3e8-1dda-4447-afcd-1abf0dc4041d",
  storageBucket: "gen-lang-client-0959045190.firebasestorage.app",
  messagingSenderId: "958469007898"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure type-safe Native Authentication persistence using react-native-async-storage
export const auth = (() => {
  try {
    const getReactNativePersistence = (FirebaseAuth as any).getReactNativePersistence;
    if (getReactNativePersistence) {
      return (FirebaseAuth as any).initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
    return FirebaseAuth.getAuth(app);
  } catch (e) {
    return FirebaseAuth.getAuth(app);
  }
})();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Email Authenticators Core Methods
export const registerWithEmail = (email: string, pass: string) => FirebaseAuth.createUserWithEmailAndPassword(auth, email, pass);
export const loginWithEmail = (email: string, pass: string) => FirebaseAuth.signInWithEmailAndPassword(auth, email, pass);

// Helper helper functions to sync favorites and historical "Continue Watching" streams with Firestore
export async function toggleFavoriteTeam(userId: string, teamId: string, currentFavorites: string[] = []): Promise<string[]> {
  const userRef = doc(db, 'users', userId);
  let updated: string[];
  
  if (currentFavorites.includes(teamId)) {
    updated = currentFavorites.filter(id => id !== teamId);
  } else {
    updated = [...currentFavorites, teamId];
  }
  
  await setDoc(userRef, { favoriteTeams: updated }, { merge: true });
  return updated;
}

export async function toggleFavoriteLeague(userId: string, leagueId: string, currentFavorites: string[] = []): Promise<string[]> {
  const userRef = doc(db, 'users', userId);
  let updated: string[];
  
  if (currentFavorites.includes(leagueId)) {
    updated = currentFavorites.filter(id => id !== leagueId);
  } else {
    updated = [...currentFavorites, leagueId];
  }
  
  await setDoc(userRef, { favoriteLeagues: updated }, { merge: true });
  return updated;
}

export async function saveContinueWatching(userId: string, matchId: string, streamUrl: string, title: string) {
  const historyRef = doc(db, 'users', userId, 'continue_watching', matchId);
  await setDoc(historyRef, {
    matchId,
    streamUrl,
    title,
    timestamp: new Date().toISOString()
  });
}
