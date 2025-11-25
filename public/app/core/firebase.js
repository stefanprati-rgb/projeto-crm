import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

import { firebaseConfig } from "../config/firebaseConfig.js";
import { CRMApp } from "./crmApp.js";
import { showToast } from "../ui/toast.js";

// --- 1. INICIALIZAÇÃO ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let crmAppInstance = null;

// --- 2. ELEMENTOS UI ---
const loginSection = document.getElementById('login-section');
const mainNav = document.getElementById('mainNavApp');
const mainContent = document.getElementById('mainContentApp');
const loadingSpinner = document.getElementById('loading-spinner');

const loginForm = document.getElementById('loginForm');
const createAccountForm = document.getElementById('createAccountForm');
const logoutButton = document.getElementById('logoutButton');

const showCreateLink = document.getElementById('showCreateAccountLink');
const showLoginLink = document.getElementById('showLoginLink');
const loginAuthAlert = document.getElementById('login-auth-alert');

// --- 3. LISTENER DE AUTENTICAÇÃO ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Usuário logado:", user.email);

    // Buscar perfil do usuário no Firestore para saber permissões
    let userData = {
      role: 'visualizador',
      allowedBases: ['CGB'] // Base padrão se não tiver perfil
    };

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userData = userDoc.data();
      }
    } catch (e) {
      console.error("Erro ao buscar perfil:", e);
    }

    // Atualiza UI do Menu Lateral
    if (document.getElementById('navbarUserEmail'))
      document.getElementById('navbarUserEmail').textContent = user.email;

    if (document.getElementById('navbarUserBases'))
      document.getElementById('navbarUserBases').textContent = `Acesso: ${userData.allowedBases?.join(', ') || 'CGB'}`;

    // Esconde Login / Mostra App
    loadingSpinner.classList.add('d-none');
    loginSection.classList.add('d-none');
    mainNav.classList.remove('d-none');
    mainContent.classList.remove('d-none');

    // Inicia o App passando os dados do usuário (incluindo as bases permitidas)
    if (!crmAppInstance) {
      crmAppInstance = new CRMApp(db, auth, userData);
    }

  } else {
    // Logout
    if (crmAppInstance) {
      crmAppInstance.destroy();
      crmAppInstance = null;
    }
    loadingSpinner.classList.add('d-none');
    mainNav.classList.add('d-none');
    mainContent.classList.add('d-none');
    loginSection.classList.remove('d-none');
    if (loginForm) loginForm.reset();
  }
});

// --- 4. EVENTOS DE FORMULÁRIO ---

showCreateLink?.addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('d-none'); createAccountForm.classList.remove('d-none'); });
showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); createAccountForm.classList.add('d-none'); loginForm.classList.remove('d-none'); });

// Login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginAuthAlert.classList.add('d-none');
  try {
    await signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
  } catch (err) {
    console.error(err);
    loginAuthAlert.textContent = "Login falhou. Verifique as credenciais.";
    loginAuthAlert.classList.remove('d-none');
  }
});

// Criar Conta
createAccountForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById('createEmail').value;
    const pass = document.getElementById('createPassword').value;

    // 1. Cria Auth
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // 2. Cria Perfil no Firestore com permissões padrão
    // MVP: Damos permissão às duas bases para facilitar o teste
    await setDoc(doc(db, "users", cred.user.uid), {
      email: email,
      role: "editor",
      allowedBases: ["CGB", "EGS"],
      createdAt: new Date().toISOString()
    });

    showToast('Conta criada com sucesso!', 'success');
  } catch (err) {
    alert("Erro ao criar conta: " + err.message);
  }
});

logoutButton?.addEventListener('click', (e) => {
  e.preventDefault();
  signOut(auth);
});

// Exportações
export { app, db, auth };