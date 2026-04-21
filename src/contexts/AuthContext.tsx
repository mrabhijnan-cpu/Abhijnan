import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  mode?: 'education' | 'business' | 'setup';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserMode: (mode: 'education' | 'business') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom profile data
        const docRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const docSnap = await getDoc(docRef);
          
          let profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            mode: 'setup'
          };
          
          if (docSnap.exists()) {
            profile = { ...profile, ...docSnap.data() };
          } else {
            // Create initial user doc
            await setDoc(docRef, {
              uid: profile.uid,
              email: profile.email || '',
              displayName: profile.displayName || '',
              // Firestore rules strictly expect request.time using serverTimestamp()
              createdAt: serverTimestamp() 
            });
          }
          setUser(profile);
        } catch (error) {
           console.error("Error fetching or creating user profile:", error);
           // Fallback to basic profile so the app doesn't crash completely
           setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              mode: 'setup'
           });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  const updateUserMode = async (mode: 'education' | 'business') => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(docRef, { mode, updatedAt: serverTimestamp() }, { merge: true });
      setUser({ ...user, mode });
    } catch (error) {
      console.error("Error setting game mode:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, updateUserMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
