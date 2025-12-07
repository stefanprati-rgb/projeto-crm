import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Inicializa App Check (Chame no entry point do app, ex: index.js)
export function initSecurity(app, siteKey) {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
    });
}

const auth = getAuth();
const db = getFirestore();

// Helper de Log
async function logAudit(userId, action, details) {
    try {
        const ip = await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip);
        await addDoc(collection(db, 'audit_logs'), {
            userId,
            action,
            details,
            timestamp: serverTimestamp(),
            ip
        });
    } catch (e) {
        console.error("Falha ao criar log de auditoria", e);
    }
}

export async function secureLogin(email, password) {
    try {
        // App Check valida o token reCAPTCHA automaticamente nos bastidores
        const credential = await signInWithEmailAndPassword(auth, email, password);

        await logAudit(credential.user.uid, 'LOGIN_SUCCESS', { email });
        return credential.user;

    } catch (error) {
        if (error.code === 'auth/app-check-token-invalid') {
            throw new Error('Verificação de segurança (Bot) falhou.');
        }
        throw error;
    }
}
