# 🔥 GUIA DE CONFIGURAÇÃO DO FIREBASE

**Data:** 2025-12-08  
**Prioridade:** 🚨 CRÍTICO - Bloqueador  
**Tempo Estimado:** 5 minutos

---

## ❌ PROBLEMA ATUAL

```
FirebaseError: Firebase: Error (auth/invalid-api-key)
```

**Causa:** Arquivo `.env` não existe ou está com credenciais inválidas.

---

## ✅ SOLUÇÃO RÁPIDA

### Passo 1: Criar Arquivo `.env`

1. **Copie o arquivo de exemplo:**
   ```bash
   cd c:\Projetos\Projeto CRM\hube-crm-react
   copy .env.example .env
   ```

2. **Ou crie manualmente:**
   - Crie um arquivo chamado `.env` na raiz do projeto
   - Copie o conteúdo de `.env.example`

---

### Passo 2: Obter Credenciais do Firebase

#### Opção A: Se Você Já Tem um Projeto Firebase

1. **Acesse o Firebase Console:**
   - Vá para: https://console.firebase.google.com
   - Faça login com sua conta Google

2. **Selecione seu projeto** (ou crie um novo)

3. **Obtenha as credenciais:**
   - Clique no ícone de engrenagem ⚙️ → "Configurações do projeto"
   - Role até "Seus apps"
   - Se não houver app web, clique "Adicionar app" → Web (ícone `</>`)
   - Copie as credenciais que aparecem:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",              // ← Copie isso
     authDomain: "projeto.firebaseapp.com",
     projectId: "projeto-id",
     storageBucket: "projeto.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123:web:abc..."
   };
   ```

4. **Cole no arquivo `.env`:**
   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=projeto-id
   VITE_FIREBASE_STORAGE_BUCKET=projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc...
   ```

---

#### Opção B: Se Você NÃO Tem Projeto Firebase

1. **Crie um novo projeto:**
   - Acesse: https://console.firebase.google.com
   - Clique "Adicionar projeto"
   - Nome do projeto: `hube-crm` (ou outro nome)
   - Aceite os termos
   - Desabilite Google Analytics (opcional)
   - Clique "Criar projeto"

2. **Adicione um app Web:**
   - No projeto criado, clique no ícone `</>` (Web)
   - Nome do app: `Hube CRM`
   - Marque "Firebase Hosting" (opcional)
   - Clique "Registrar app"
   - Copie as credenciais

3. **Ative Authentication:**
   - Menu lateral → "Authentication"
   - Clique "Começar"
   - Aba "Sign-in method"
   - Ative "E-mail/senha"

4. **Ative Firestore:**
   - Menu lateral → "Firestore Database"
   - Clique "Criar banco de dados"
   - Modo: "Produção" (ou "Teste" para desenvolvimento)
   - Localização: `southamerica-east1` (São Paulo)

5. **Crie um usuário de teste:**
   - Menu lateral → "Authentication" → "Users"
   - Clique "Adicionar usuário"
   - Email: `test@example.com`
   - Senha: `test123456`
   - Clique "Adicionar usuário"

---

### Passo 3: Reiniciar Servidor de Desenvolvimento

Após configurar o `.env`:

```bash
# Parar o servidor (Ctrl+C no terminal)
# Depois reiniciar:
npm run dev
```

**IMPORTANTE:** O Vite só carrega variáveis `.env` ao iniciar!

---

## 🧪 TESTAR CONFIGURAÇÃO

Após reiniciar o servidor:

1. **Abra o navegador:** http://localhost:3000
2. **Abra o console:** F12
3. **Verifique:**
   - ✅ Não deve aparecer erro `auth/invalid-api-key`
   - ✅ Deve mostrar tela de login
   - ✅ Deve conseguir fazer login

---

## 🔒 SEGURANÇA

### ⚠️ IMPORTANTE: Não Commitar `.env`

O arquivo `.env` contém credenciais sensíveis!

1. **Verifique `.gitignore`:**
   ```bash
   # Deve conter:
   .env
   .env.local
   .env.*.local
   ```

2. **Confirme que `.env` está ignorado:**
   ```bash
   git status
   # .env NÃO deve aparecer na lista
   ```

---

## 📋 CHECKLIST

- [ ] Criei arquivo `.env` na raiz do projeto
- [ ] Copiei credenciais do Firebase Console
- [ ] Colei todas as 6 variáveis no `.env`
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Erro `auth/invalid-api-key` sumiu
- [ ] Consigo ver tela de login
- [ ] `.env` está no `.gitignore`

---

## 🆘 TROUBLESHOOTING

### Erro Persiste Após Configurar

1. **Verifique se o arquivo se chama exatamente `.env`**
   - Não `.env.txt`
   - Não `env`
   - Deve ser `.env` (com ponto no início)

2. **Verifique se as variáveis começam com `VITE_`**
   - ✅ Correto: `VITE_FIREBASE_API_KEY=...`
   - ❌ Errado: `FIREBASE_API_KEY=...`

3. **Verifique se não há espaços:**
   - ✅ Correto: `VITE_FIREBASE_API_KEY=AIza...`
   - ❌ Errado: `VITE_FIREBASE_API_KEY = AIza...`

4. **Reinicie o servidor:**
   - Pare com Ctrl+C
   - Inicie novamente com `npm run dev`

5. **Limpe o cache do navegador:**
   - Ctrl+Shift+R (hard reload)
   - Ou use modo anônimo

---

## 📞 PRÓXIMOS PASSOS

### Após Configurar Firebase

1. [ ] Fazer login no app
2. [ ] Executar testes manuais (Guia de Teste)
3. [ ] Validar correção de data sync
4. [ ] Fazer commit das mudanças

---

## 🔗 LINKS ÚTEIS

- **Firebase Console:** https://console.firebase.google.com
- **Documentação Firebase:** https://firebase.google.com/docs
- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html

---

**Tempo estimado:** 5 minutos  
**Dificuldade:** Fácil  
**Importância:** CRÍTICA (bloqueador)
