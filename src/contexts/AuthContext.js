import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                /* Build a local fallback from the Auth token — works even
                   if Firestore rules block reads ("Missing or insufficient permissions"). */
                const localFallback = {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName || '',
                    email: firebaseUser.email || '',
                    photoURL: firebaseUser.photoURL || null,
                    provider: firebaseUser.providerData[0]?.providerId || 'unknown',
                    connectedAccounts: {
                        whatsapp: { connected: false, connectedAt: null },
                        twitter: { connected: false, connectedAt: null },
                        instagram: { connected: false, connectedAt: null },
                        telegram: { connected: false, connectedAt: null }
                    }
                };

                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const snap = await getDoc(userRef);
                    if (snap.exists()) {
                        setUserData(snap.data());
                    } else {
                        // Auto-create doc; if Firestore rules block write, fall back silently
                        const newDoc = {
                            ...localFallback,
                            createdAt: serverTimestamp(),
                            lastLoginAt: serverTimestamp(),
                        };
                        try {
                            await setDoc(userRef, newDoc);
                        } catch (writeErr) {
                            console.warn('Firestore write blocked (rules). Using local Auth data.', writeErr.code);
                        }
                        setUserData(newDoc);
                    }
                } catch (err) {
                    // Permissions error or offline — use local Auth data so the app works
                    console.warn('Firestore read blocked (rules). Using local Auth data.', err.code);
                    setUserData(localFallback);
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateUserData = useCallback(async (updates) => {
        if (!user) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, updates, { merge: true });
            setUserData(prev => ({ ...prev, ...updates }));
        } catch (err) {
            console.error('Error updating user data:', err);
        }
    }, [user]);

    const logout = async () => {
        await signOut(auth);
    };

    const value = { user, userData, loading, logout, updateUserData };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
