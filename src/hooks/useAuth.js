import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import useStore from '../stores/useStore';

export const useAuth = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { setUser, setUserRole, setAllowedBases, logout } = useStore();

    useEffect(() => {
        // Observer de autenticação
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Buscar dados estendidos do usuário no Firestore
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();

                        // Atualizar store com dados do usuário
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName || userData.name,
                            photoURL: firebaseUser.photoURL || userData.photoURL,
                            ...userData,
                        });

                        setUserRole(userData.role || 'user');
                        setAllowedBases(userData.allowedBases || []);
                    } else {
                        // Usuário autenticado mas sem documento no Firestore
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                        });
                        setUserRole('user');
                        setAllowedBases([]);
                    }
                } else {
                    // Usuário não autenticado
                    logout();
                }
            } catch (err) {
                console.error('Erro ao buscar dados do usuário:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [setUser, setUserRole, setAllowedBases, logout]);

    // Login
    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (err) {
            console.error('Erro no login:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const handleLogout = async () => {
        try {
            setLoading(true);
            setError(null);
            await signOut(auth);
            logout();
            return { success: true };
        } catch (err) {
            console.error('Erro no logout:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        login,
        logout: handleLogout,
    };
};
