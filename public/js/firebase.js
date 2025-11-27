// public/js/firebase.js
// Responsável por inicializar o Firebase e expor funções reutilizáveis

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// 🔧 Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBCjdBJnthqQDLRQl2jKU6MbBzxt",
    authDomain: "crm-energia-solar.firebaseapp.com",
    projectId: "crm-energia-solar",
    storageBucket: "crm-energia-solar.firebasestorage.app",
    messagingSenderId: "83187644189",
    appId: "1:83187644189:web:d3cf98a894e87c2c8093f4",
    measurementId: "G-QC5dRD90W"
};

let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase inicializado com sucesso.");
} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
}

// ------- Funções auxiliares de autenticação -------

export async function signInWithEmailPassword(email, password) {
    if (!auth) throw new Error("Firebase Auth não inicializado.");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
}

export async function signOutUser() {
    if (!auth) return;
    await signOut(auth);
}

export function onAuthChange(callback) {
    if (!auth) {
        console.error("Auth não inicializado.");
        callback(null);
        return () => { };
    }

    return onAuthStateChanged(auth, user => {
        if (user) {
            console.log("Usuário logado:", user.email);
        } else {
            console.log("Nenhum usuário logado.");
        }
        callback(user);
    });
}

// ------- Firestore: exporta helpers -------

export {
    app,
    auth,
    db,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp
};
