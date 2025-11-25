// Importações do SDK (Versão 10.12.2 para manter padrão)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configurações e Módulos
import { firebaseConfig } from "../config/firebaseConfig.js";
import { CRMApp } from "./crmApp.js";
import { showToast } from "../ui/toast.js";

// --- 1. INICIALIZAÇÃO DO FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let crmAppInstance = null; // Guarda a instância do sistema

// --- 2. ELEMENTOS DA INTERFACE (DOM) ---
const loginSection = document.getElementById('login-section');
const mainNav = document.getElementById('mainNavApp');
const mainContent = document.getElementById('mainContentApp');
const loadingSpinner = document.getElementById('loading-spinner');

// Formulários
const loginForm = document.getElementById('loginForm');
const createAccountForm = document.getElementById('createAccountForm');
const logoutButton = document.getElementById('logoutButton');

// Links de alternância (Login <-> Criar Conta)
const showCreateLink = document.getElementById('showCreateAccountLink');
const showLoginLink = document.getElementById('showLoginLink');

// Alertas
const loginAuthAlert = document.getElementById('login-auth-alert');
const createAuthAlert = document.getElementById('create-auth-alert');
const navbarUserEmail = document.getElementById('navbarUserEmail');

// --- 3. CONTROLE DE ESTADO (Auth Listener) ---
// Este é o "porteiro" do sistema. Ele vigia se alguém entrou ou saiu.
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // === USUÁRIO LOGADO ===
    console.log("Usuário conectado:", user.email);

    // 1. Buscar a função do usuário no Firestore (editor ou visualizador)
    let userRole = 'visualizador'; // Padrão seguro
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userRole = userDoc.data().role || 'visualizador';
      }
    } catch (e) {
      console.error("Erro ao buscar role:", e);
    }

    // 2. Atualizar UI
    navbarUserEmail.textContent = user.email + ` (${userRole})`;
    loadingSpinner.classList.add('d-none');
    loginSection.classList.add('d-none');

    // Mostra o App
    mainNav.classList.remove('d-none');
    mainContent.classList.remove('d-none');

    // 3. Iniciar o CRM (passando o db, auth e a role)
    if (!crmAppInstance) {
      crmAppInstance = new CRMApp(db, auth, userRole);
    }

  } else {
    // === USUÁRIO DESLOGADO ===
    console.log("Usuário desconectado");

    // 1. Destruir instância antiga para limpar memória
    if (crmAppInstance) {
      crmAppInstance.destroy();
      crmAppInstance = null;
    }

    // 2. Atualizar UI
    loadingSpinner.classList.add('d-none');
    mainNav.classList.add('d-none');
    mainContent.classList.add('d-none');

    // Mostra Login
    loginSection.classList.remove('d-none');

    // Reset de formulários
    loginForm.reset();
    createAccountForm.reset();
    createAccountForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
  }
});

// --- 4. EVENTOS DE LOGIN E CADASTRO ---

// Alternar entre Login e Criar Conta
showCreateLink?.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.add('d-none');
  createAccountForm.classList.remove('d-none');
  hideAlerts();
});

showLoginLink?.addEventListener('click', (e) => {
  e.preventDefault();
  createAccountForm.classList.add('d-none');
  loginForm.classList.remove('d-none');
  hideAlerts();
});

// Submissão do LOGIN
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlerts();

  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    // O onAuthStateChanged vai lidar com o resto
  } catch (err) {
    console.error(err.code);
    let msg = 'Erro ao fazer login.';
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') msg = 'E-mail ou senha incorretos.';
    if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
    if (err.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Tente mais tarde.';
    showAlert(loginAuthAlert, msg);
  }
});

// Submissão de CRIAR CONTA
createAccountForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlerts();

  const email = document.getElementById('createEmail').value;
  const pass = document.getElementById('createPassword').value;

  if (pass.length < 6) {
    showAlert(createAuthAlert, "A senha deve ter no mínimo 6 caracteres.");
    return;
  }

  try {
    // 1. Criar Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. Criar perfil no Firestore (Padrão: visualizador)
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "visualizador", // Segurança: começa restrito
      createdAt: new Date().toISOString()
    });

    showToast('Conta criada com sucesso!', 'success');
    // Login é automático após criar
  } catch (err) {
    console.error(err.code);
    let msg = 'Erro ao criar conta.';
    if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso.';
    if (err.code === 'auth/weak-password') msg = 'Senha muito fraca.';
    showAlert(createAuthAlert, msg);
  }
});

// Logout
logoutButton?.addEventListener('click', (e) => {
  e.preventDefault();
  signOut(auth).catch(err => console.error(err));
});

// --- 5. UTILITÁRIOS ---
function showAlert(el, msg) {
  if (el) {
    el.textContent = msg;
    el.classList.remove('d-none');
  }
}

function hideAlerts() {
  loginAuthAlert?.classList.add('d-none');
  createAuthAlert?.classList.add('d-none');
}

// --- 6. EXPORTAÇÃO (CORREÇÃO DO ERRO) ---
// Isso permite que o importExport.js consiga importar o { db }
export { app, db, auth };