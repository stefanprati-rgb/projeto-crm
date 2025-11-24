import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { firebaseConfig } from "../config/firebaseConfig.js";
import { CRMApp } from "./crmApp.js"; // Importamos a classe do CRM
import { showToast } from "../ui/toast.js";

// --- INICIALIZAÇÃO DO FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let crmAppInstance = null; // Vamos guardar a instância do app aqui

// --- ELEMENTOS DA UI ---
const loginSection = document.getElementById('login-section');
const mainNav = document.getElementById('mainNavApp');
const mainContent = document.getElementById('mainContentApp');
const loadingSpinner = document.getElementById('loading-spinner');

const loginForm = document.getElementById('loginForm');
const createAccountForm = document.getElementById('createAccountForm');
const logoutButton = document.getElementById('logoutButton');

const loginAuthAlert = document.getElementById('login-auth-alert');
const createAuthAlert = document.getElementById('create-auth-alert');

const showLoginLink = document.getElementById('showLoginLink');
const showCreateAccountLink = document.getElementById('showCreateAccountLink');

// --- FUNÇÕES AUXILIARES DE UI ---

// **FIX**: Adicionado "?." (optional chaining) para evitar erros
// se os elementos de alerta não existirem no DOM (ex: cache)
const showAlert = (alertEl, message) => {
  alertEl?.classList.remove('d-none');
  if (alertEl) {
    alertEl.textContent = message;
  }
};
const hideAlerts = () => {
  loginAuthAlert?.classList.add('d-none');
  createAuthAlert?.classList.add('d-none');
};
const showUI = (state) => {
  // **FIX**: Adicionado "?." (optional chaining) para evitar "crash"
  loadingSpinner?.classList.add('d-none'); 
  if (state === 'login') {
    loginSection?.classList.remove('d-none');
    mainNav?.classList.add('d-none');
    mainContent?.classList.add('d-none');
  } else if (state === 'app') {
    loginSection?.classList.add('d-none');
    mainNav?.classList.remove('d-none');
    mainContent?.classList.remove('d-none');
  }
};
const showForm = (form) => {
  hideAlerts();
  if (form === 'login') {
    loginForm?.classList.remove('d-none');
    createAccountForm?.classList.add('d-none');
  } else if (form === 'create') {
    loginForm?.classList.add('d-none');
    createAccountForm?.classList.remove('d-none');
  }
};

// --- CONTROLO DE AUTENTICAÇÃO PRINCIPAL ---
// **(A SUA MELHORIA FOI APLICADA AQUI)**
onAuthStateChanged(auth, async (user) => {
  if (user && user.email) {
    // UTILIZADOR ESTÁ LOGADO E TEM E-MAIL
    
    // **MELHORIA**: SEMPRE buscar o role atualizado do Firestore
    const userRole = await getUserRole(user.uid);
    
    // Se já existe uma instância do app, destrua-a primeiro
    if (crmAppInstance) {
      crmAppInstance.destroy();
      crmAppInstance = null;
    }
    
    // Crie uma NOVA instância com o role atualizado
    crmAppInstance = new CRMApp(db, auth, userRole);
    
    // Preenche o e-mail do utilizador na navbar
    const userEmailEl = document.getElementById('navbarUserEmail');
    if(userEmailEl) userEmailEl.textContent = user.email;

    showUI('app');
  } else {
    // UTILIZADOR NÃO ESTÁ LOGADO
    showUI('login');
    showForm('login');
    // Se a instância do app existe (utilizador fez logout), destrua-a
    if (crmAppInstance) {
      crmAppInstance.destroy();
      crmAppInstance = null;
    }
  }
});


// **NOVO (A SUA CORREÇÃO):** Função para buscar a função do utilizador
const getUserRole = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return userDocSnap.data().role; // Retorna 'editor' ou 'visualizador'
    } else {
      // **CORREÇÃO**: Se o documento não existir, CRIA ele automaticamente
      console.warn("Documento de utilizador não encontrado, criando como visualizador.");
      await setDoc(userDocRef, {
        email: auth.currentUser.email, // Pega o email do utilizador logado
        role: 'visualizador',
        createdAt: new Date().toISOString() // Adiciona data de criação
      });
      return 'visualizador'; // Retorna o novo role
    }
  } catch (err) {
    console.error("Erro ao buscar/criar função do utilizador:", err);
    showToast("Erro ao verificar permissões.", "danger");
    return 'visualizador'; // Segurança em primeiro lugar
  }
};

// --- EVENTOS DOS FORMULÁRIOS ---

// Login (Entrar)
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlerts();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    // O onAuthStateChanged vai tratar de mostrar o app
  } catch (err) {
    console.error(err.code, err.message);
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      showAlert(loginAuthAlert, 'E-mail ou senha inválidos.');
    } else {
      showAlert(loginAuthAlert, 'Erro ao fazer login.');
    }
  }
});

// Criar Conta
createAccountForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlerts();
  const email = document.getElementById('createEmail').value;
  const pass = document.getElementById('createPassword').value;
  
  if (pass.length < 6) {
    showAlert(createAuthAlert, 'A senha deve ter no mínimo 6 caracteres.');
    return;
  }

  try {
    // 1. Criar o utilizador no Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. **NOVO**: Criar o documento de função no Firestore
    // O novo utilizador começa SEMPRE como 'visualizador'
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      role: "visualizador",
      createdAt: new Date().toISOString() // Adiciona data de criação
    });

    // O onAuthStateChanged vai tratar de mostrar o app
    showToast('Conta criada com sucesso!', 'success');
  } catch (err) {
    console.error(err.code, err.message);
    if (err.code === 'auth/email-already-in-use') {
      showAlert(createAuthAlert, 'Este e-mail já está em uso.');
    } else if (err.code === 'auth/weak-password') {
      showAlert(createAuthAlert, 'A senha é muito fraca.');
    } else if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
      showAlert(createAuthAlert, 'Erro de configuração (API Key). Contacte o admin.');
    } else {
      showAlert(createAuthAlert, 'Erro ao criar conta.');
    }
  }
});

// Logout (Sair)
logoutButton?.addEventListener('click', () => {
  signOut(auth).catch((err) => {
    console.error("Erro ao sair:", err);
    showToast("Erro ao sair.", "danger");
  });
});

// Links de navegação do formulário
showCreateAccountLink?.addEventListener('click', (e) => {
  e.preventDefault();
  showForm('create');
});
showLoginLink?.addEventListener('click', (e) => {
  e.preventDefault();
  showForm('login');
});

