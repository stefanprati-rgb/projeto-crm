import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
export const auth = getAuth(app);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Functions
export const functions = getFunctions(app, 'southamerica-east1'); // Ou sua região padrão

// Ativar persistência offline (CRÍTICO para funcionamento offline)
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistência offline: Múltiplas abas abertas. Apenas a primeira aba terá persistência.');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistência offline: Navegador não suporta IndexedDB.');
        } else {
            console.error('Erro ao ativar persistência offline:', err);
        }
    });
}

// Conectar aos emuladores em desenvolvimento (opcional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Conectado aos emuladores Firebase (Auth, Firestore, Functions)');
}

export default app;
