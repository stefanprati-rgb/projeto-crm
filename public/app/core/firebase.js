// firebase.js

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

// Configuração do Firebase (AGORA IMPORTADA CORRETAMENTE)
import { firebaseConfig } from "../config/firebaseConfig.js";

import { CRMApp } from "./crmApp.js";
import { showToast } from "../ui/toast.js";

// --- 1. INICIALIZAÇÃO COM TRATATIVA DE ERRO ---
let app = null;
let auth = null;
let db = null;
let crmAppInstance = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase inicializado com sucesso.");
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
  if (typeof showToast === "function") {
    showToast("Erro ao inicializar Firebase. Verifique firebaseConfig.", "error");
  }
}

// --- 2. ELEMENTOS UI ---
const loginSection = document.getElementById("login-section");
const mainNav = document.getElementById("mainNavApp");
const mainContent = document.getElementById("mainContentApp");
const loadingSpinner = document.getElementById("loading-spinner");

const loginForm = document.getElementById("loginForm");
const createAccountForm = document.getElementById("createAccountForm");
const logoutButton = document.getElementById("logoutButton");

const showCreateLink = document.getElementById("showCreateAccountLink");
const showLoginLink = document.getElementById("showLoginLink");
const loginAuthAlert = document.getElementById("login-auth-alert");

// Helpers de UI para evitar erro se algum elemento não existir
function hideElement(el) {
  if (el) el.classList.add("hidden");
}
function showElement(el) {
  if (el) el.classList.remove("hidden");
}

// --- 3. LISTENER DE AUTENTICAÇÃO (só se auth existir) ---
if (auth && db) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Usuário logado:", user.email);

      // Perfil padrão
      let userData = {
        role: "visualizador",
        allowedBases: ["CGB"]
      };

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          userData = userDoc.data();
        }
      } catch (e) {
        console.error("Erro ao buscar perfil:", e);
      }

      const navbarUserEmail = document.getElementById("navbarUserEmail");
      const navbarUserBases = document.getElementById("navbarUserBases");

      if (navbarUserEmail) {
        navbarUserEmail.textContent = user.email;
      }

      if (navbarUserBases) {
        const bases = userData.allowedBases?.join(", ") || "CGB";
        navbarUserBases.textContent = `Acesso: ${bases}`;
      }

      // Esconde Login / Mostra App
      hideElement(loadingSpinner);
      hideElement(loginSection);
      showElement(mainNav);
      showElement(mainContent);

      // Inicia o App passando os dados do usuário
      if (!crmAppInstance) {
        crmAppInstance = new CRMApp(db, auth, userData);
      }
    } else {
      // Usuário deslogado
      if (crmAppInstance) {
        if (typeof crmAppInstance.destroy === "function") {
          crmAppInstance.destroy();
        }
        crmAppInstance = null;
      }

      hideElement(loadingSpinner);
      showElement(loginSection);
      hideElement(mainNav);
      hideElement(mainContent);

      if (loginForm) loginForm.reset();
    }
  });
} else {
  console.error("Auth ou Firestore não inicializados. Verifique firebaseConfig.");
}

// --- 4. EVENTOS DE FORMULÁRIO ---

// Alternar entre Login e Criar Conta
if (showCreateLink && loginForm && createAccountForm) {
  showCreateLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideElement(loginForm);
    showElement(createAccountForm);
  });
}

if (showLoginLink && loginForm && createAccountForm) {
  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideElement(createAccountForm);
    showElement(loginForm);
  });
}

// Login
if (loginForm && auth) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (loginAuthAlert) {
      hideElement(loginAuthAlert);
      loginAuthAlert.textContent = "";
    }

    const emailInput = document.getElementById("loginEmail");
    const passInput = document.getElementById("loginPassword");
    const email = emailInput?.value || "";
    const pass = passInput?.value || "";

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged vai cuidar do resto
    } catch (err) {
      console.error("Erro no login:", err);
      if (loginAuthAlert) {
        loginAuthAlert.textContent = "Login falhou. Verifique as credenciais.";
        showElement(loginAuthAlert);
      }
      if (typeof showToast === "function") {
        showToast("Falha no login. Verifique e-mail e senha.", "error");
      }
    }
  });
}

// Criar Conta
if (createAccountForm && auth && db) {
  createAccountForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("createEmail");
    const passInput = document.getElementById("createPassword");
    const email = emailInput?.value || "";
    const pass = passInput?.value || "";

    try {
      // 1. Cria Auth
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // 2. Cria Perfil no Firestore com permissões padrão
      await setDoc(doc(db, "users", cred.user.uid), {
        email: email,
        role: "editor",
        allowedBases: ["CGB", "EGS"],
        createdAt: new Date().toISOString()
      });

      if (typeof showToast === "function") {
        showToast("Conta criada com sucesso!", "success");
      } else {
        alert("Conta criada com sucesso!");
      }

      // Volta para o formulário de login
      if (loginForm && createAccountForm) {
        hideElement(createAccountForm);
        showElement(loginForm);
      }
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      const msg = err?.message || "Erro ao criar conta.";
      if (typeof showToast === "function") {
        showToast(msg, "error");
      } else {
        alert("Erro ao criar conta: " + msg);
      }
    }
  });
}

// Logout
if (logoutButton && auth) {
  logoutButton.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro ao sair:", err);
      if (typeof showToast === "function") {
        showToast("Erro ao sair da conta.", "error");
      } else {
        alert("Erro ao sair da conta.");
      }
    }
  });
}

// Exportações
export { app, db, auth };