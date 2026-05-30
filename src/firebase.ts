import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  setPersistence, 
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
console.log(`DEBUG: Initializing Firestore on client. Project: ${firebaseConfig.projectId}, DB: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// تأمين بقاء المستخدم مسجلاً دخوله
setPersistence(auth, browserLocalPersistence);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// وظائف البريد الإلكتروني
export const registerWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const resetPasswordWithEmail = (email: string) => sendPasswordResetEmail(auth, email);

// محاولة تسجيل الدخول عبر النافذة المنبثقة
export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    if (window !== window.top) {
      throw new Error("IFRAME_BLOCKED");
    }
    
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      throw new Error("CAPACITOR_BLOCKED");
    }

    // Check if the error is popup-blocked or popup-closed-by-user
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      throw error; // Let UI handle it with a friendly fallback recommendation
    }

    // Try redirect ONLY as a clean fallback if not blocked
    try {
      console.warn("Popup failed, trying redirect...");
      return await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      console.error("Redirect Auth Error:", redirectError);
      throw redirectError;
    }
  }
};

export const signInWithFacebook = async () => {
  try {
    return await signInWithPopup(auth, facebookProvider);
  } catch (error: any) {
    console.error("Facebook Auth Error:", error);
    if (window !== window.top) {
      throw new Error("IFRAME_BLOCKED");
    }

    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      throw new Error("CAPACITOR_BLOCKED");
    }

    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      throw error;
    }

    try {
      console.warn("Facebook Popup failed, trying redirect...");
      return await signInWithRedirect(auth, facebookProvider);
    } catch (redirectError) {
      console.error("Facebook Redirect Auth Error:", redirectError);
      throw redirectError;
    }
  }
};

// معالجة نتيجة تسجيل الدخول بعد العودة من Redirect
export const handleRedirectResult = () => getRedirectResult(auth);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.warn('[Firestore Graceful Recovery] Firestore Error Occurred:', JSON.stringify(errInfo));
  
  // Only throw synchronous exceptions for mutative/write operations where callers need to catch/display state.
  // Querying/Snapshot listening (GET/LIST) should fall back cleanly rather than crashing the React cycle.
  if (
    operationType === OperationType.CREATE || 
    operationType === OperationType.UPDATE || 
    operationType === OperationType.DELETE || 
    operationType === OperationType.WRITE
  ) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Gracefully catch and silent all errors (including Quota exceeded) on initial ping
  }
}
testConnection();

// FCM Registration
export const registerForPushNotifications = async (userId: string) => {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BPHr1zPz1...' // Note: User needs to provide their VAPID key in the console
      });
      
      if (token) {
        // Store or update token in Firestore
        const tokensRef = collection(db, 'fcm_tokens');
        const q = query(tokensRef, where('token', '==', token), where('userId', '==', userId));
        const existing = await getDocs(q);
        
        if (existing.empty) {
          await addDoc(tokensRef, {
            token,
            userId,
            device: navigator.userAgent,
            createdAt: new Date().toISOString()
          });
        }
        return token;
      }
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
};
