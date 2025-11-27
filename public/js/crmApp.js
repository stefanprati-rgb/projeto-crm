// public/js/crmApp.js
// Lógica principal do CRM (UI + Firestore)

import {
    db,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    onAuthChange,
    signInWithEmailPassword,
    signOutUser
} from "./firebase.js";

// 👉 Referências de DOM
const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");

const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("btn-login");
const loginLoadingSpan = document.getElementById("login-loading");

const btnSair = document.getElementById("btn-sair");
const userEmailSpan = document.getElementById("user-email");

const filtroTipoSelect = document.getElementById("filtro-tipo");
const btnRecarregar = document.getElementById("btn-recarregar");
const listaLoading = document.getElementById("lista-loading");
const crmTbody = document.getElementById("crm-tbody");
const semRegistrosDiv = document.getElementById("sem-registros");

const alertContainer = document.getElementById("alert-container");
const alertBox = document.getElementById("alert-box");

// ------- Funções de UI -------

function showAlert(message, type = "info") {
    if (!alertContainer || !alertBox) return;

    alertContainer.classList.remove("hidden");

    let classes =
        "rounded border px-4 py-3 text-sm ";

    if (type === "success") {
        classes += "bg-emerald-50 border-emerald-200 text-emerald-800";
    } else if (type === "error") {
        classes += "bg-red-50 border-red-200 text-red-800";
    } else {
        classes += "bg-slate-50 border-slate-200 text-slate-800";
    }

    alertBox.className = classes;
    alertBox.textContent = message;

    // some timeout
    setTimeout(() => {
        alertContainer.classList.add("hidden");
    }, 5000);
}

function setLoadingLogin(isLoading) {
    if (!loginBtn || !loginLoadingSpan) return;
    loginBtn.disabled = isLoading;
    loginLoadingSpan.classList.toggle("hidden", !isLoading);
}

function setListaLoading(isLoading) {
    if (!listaLoading) return;
    listaLoading.classList.toggle("hidden", !isLoading);
}

function setLoggedInUI(user) {
    if (user) {
        loginSection.classList.add("hidden");
        appSection.classList.remove("hidden");

        userEmailSpan.textContent = user.email || "";
        userEmailSpan.classList.remove("hidden");
        btnSair.classList.remove("hidden");
    } else {
        appSection.classList.add("hidden");
        loginSection.classList.remove("hidden");

        userEmailSpan.textContent = "";
        userEmailSpan.classList.add("hidden");
        btnSair.classList.add("hidden");
    }
}

// ------- Lógica de Login -------

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        if (!email || !password) {
            showAlert("Preencha e-mail e senha.", "error");
            return;
        }

        try {
            setLoadingLogin(true);
            const user = await signInWithEmailPassword(email, password);
            showAlert(`Bem-vindo, ${user.email}!`, "success");
        } catch (err) {
            console.error("Erro no login:", err);
            showAlert("Falha ao entrar. Verifique e-mail/senha.", "error");
        } finally {
            setLoadingLogin(false);
        }
    });
}

// ------- Logout -------

if (btnSair) {
    btnSair.addEventListener("click", async () => {
        try {
            await signOutUser();
            showAlert("Você saiu do sistema.", "info");
        } catch (err) {
            console.error("Erro ao sair:", err);
            showAlert("Erro ao sair da conta.", "error");
        }
    });
}

// ------- Carregamento de dados do CRM -------

async function carregarRegistros(filtro = "TODOS") {
    if (!db) {
        console.error("Firestore não inicializado.");
        showAlert("Erro interno: Firestore não inicializado.", "error");
        return;
    }

    console.log("Iniciando carregamento para:", filtro);

    setListaLoading(true);
    crmTbody.innerHTML = "";
    semRegistrosDiv.classList.add("hidden");

    try {
        const colRef = collection(db, "negocios"); // 👉 ajuste o nome da collection se necessário

        let q = query(colRef, orderBy("updatedAt", "desc"));

        if (filtro === "ABERTO") {
            q = query(colRef, where("status", "==", "ABERTO"), orderBy("updatedAt", "desc"));
        } else if (filtro === "FECHADO") {
            q = query(colRef, where("status", "==", "FECHADO"), orderBy("updatedAt", "desc"));
        }

        const snap = await getDocs(q);

        if (snap.empty) {
            semRegistrosDiv.classList.remove("hidden");
            return;
        }

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const tr = document.createElement("tr");

            const cliente = data.cliente || "—";
            const status = data.status || "—";
            const valor = data.valor ? `R$ ${Number(data.valor).toLocaleString("pt-BR")}` : "—";
            const updatedAt = data.updatedAt?.toDate
                ? data.updatedAt.toDate().toLocaleString("pt-BR")
                : "—";

            tr.innerHTML = `
        <td class="px-4 py-2 align-top">${cliente}</td>
        <td class="px-4 py-2 align-top">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium 
            ${status === "FECHADO" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}">
            ${status}
          </span>
        </td>
        <td class="px-4 py-2 align-top">${valor}</td>
        <td class="px-4 py-2 align-top text-slate-500 text-xs">${updatedAt}</td>
      `;

            crmTbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erro ao carregar registros:", err);
        showAlert("Erro ao carregar registros do CRM.", "error");
    } finally {
        setListaLoading(false);
    }
}

// Botão "Recarregar"
if (btnRecarregar) {
    btnRecarregar.addEventListener("click", () => {
        const filtro = filtroTipoSelect.value || "TODOS";
        carregarRegistros(filtro);
    });
}

// Alteração do filtro
if (filtroTipoSelect) {
    filtroTipoSelect.addEventListener("change", () => {
        const filtro = filtroTipoSelect.value || "TODOS";
        carregarRegistros(filtro);
    });
}

// ------- Observa mudança de autenticação -------

onAuthChange(user => {
    setLoggedInUI(user);

    if (user) {
        // Usuário logado -> carrega dados
        const filtro = filtroTipoSelect.value || "TODOS";
        carregarRegistros(filtro);
    } else {
        // Usuário deslogado -> limpa tabela
        crmTbody.innerHTML = "";
        semRegistrosDiv.classList.add("hidden");
    }
});
