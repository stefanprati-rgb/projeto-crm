# Security & Compliance - Guia de Implementação

## ✅ Arquivos Criados/Atualizados

### 1. **firebase.json** - Hardening de Hosting (CSP)
- ✅ Headers de segurança adicionados
- ✅ Content-Security-Policy configurado
- ✅ X-Frame-Options, X-Content-Type-Options, HSTS implementados

### 2. **firestore.rules** - RBAC & Validação
- ✅ Regras de controle de acesso baseadas em papéis
- ✅ Validação de schema para clientes
- ✅ Soft delete obrigatório (delete direto bloqueado)
- ✅ Audit logs append-only

### 3. **public/app/utils/encryption.js** - Criptografia Client-Side
- ✅ Classe DataEncryption com Web Crypto API
- ✅ Criptografia AES-GCM para dados sensíveis

### 4. **public/app/utils/rateLimiter.js** - Proteção contra Spam
- ✅ Rate limiter configurável
- ✅ Instância singleton (20 req/min)

### 5. **public/app/services/secureAuth.js** - Auth Seguro
- ✅ Integração com Firebase App Check
- ✅ reCAPTCHA v3 automático
- ✅ Audit logging de login

---

## 🔧 Próximos Passos Obrigatórios

### Passo 1: Configurar Firebase App Check no Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Build** → **App Check**
4. Clique em **Get Started**
5. Registre seu app web:
   - Selecione **reCAPTCHA v3**
   - Registre seu domínio (ex: `seu-app.firebaseapp.com`)
   - Copie a **Site Key** gerada

### Passo 2: Inicializar App Check no Entry Point

No arquivo principal da aplicação (ex: `public/app/config/firebase.js` ou `index.html`), adicione:

```javascript
import { initializeApp } from 'firebase/app';
import { initSecurity } from './app/services/secureAuth.js';

const app = initializeApp(firebaseConfig);

// IMPORTANTE: Substitua 'SUA_RECAPTCHA_SITE_KEY' pela chave do Console
initSecurity(app, 'SUA_RECAPTCHA_SITE_KEY');
```

### Passo 3: Atualizar Estrutura de Usuários no Firestore

Certifique-se de que cada documento em `users/{userId}` tenha o campo `role`:

```javascript
{
  uid: "user123",
  email: "user@example.com",
  role: "editor", // ou "viewer"
  allowedBases: ["TODOS"], // ou ["BASE1", "BASE2"]
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Passo 4: Implementar Criptografia em Formulários

Exemplo de uso da criptografia para CPF/CNPJ:

```javascript
import { DataEncryption } from './app/utils/encryption.js';

const crypto = new DataEncryption();

// Ao salvar cliente
async function saveClient(clientData) {
  const key = await crypto.generateKey();
  
  // Criptografa CPF/CNPJ
  const encryptedDoc = await crypto.encrypt(clientData.cpfCnpj, key);
  
  // Salva no Firestore
  await setDoc(doc(db, 'clients', clientId), {
    ...clientData,
    cpfCnpj: encryptedDoc, // { ciphertext, iv }
    // IMPORTANTE: Armazene a chave de forma segura (ex: Firebase Auth Custom Claims)
  });
}

// Ao ler cliente
async function getClient(clientId, key) {
  const docSnap = await getDoc(doc(db, 'clients', clientId));
  const data = docSnap.data();
  
  // Descriptografa CPF/CNPJ
  data.cpfCnpj = await crypto.decrypt(data.cpfCnpj, key);
  return data;
}
```

### Passo 5: Integrar Rate Limiter nos Serviços

Exemplo em `clientService.js`:

```javascript
import { dbRateLimiter } from '../utils/rateLimiter.js';
import { getAuth } from 'firebase/auth';

export async function saveClient(clientData) {
  const userId = getAuth().currentUser.uid;
  
  return await dbRateLimiter.throttle(userId, async () => {
    // Lógica original de salvar cliente
    return await setDoc(doc(db, 'clients', clientId), clientData);
  });
}
```

### Passo 6: Substituir Login Atual por secureLogin

No componente de login, substitua:

```javascript
// ANTES
import { signInWithEmailAndPassword } from 'firebase/auth';
const user = await signInWithEmailAndPassword(auth, email, password);

// DEPOIS
import { secureLogin } from './app/services/secureAuth.js';
const user = await secureLogin(email, password);
```

### Passo 7: Deploy das Regras de Segurança

Execute no terminal:

```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

---

## 🔐 Gerenciamento de Chaves de Criptografia

**CRÍTICO**: A chave de criptografia deve ser armazenada de forma segura. Opções:

### Opção 1: Firebase Auth Custom Claims (Recomendado)
```javascript
// Backend (Cloud Function)
admin.auth().setCustomUserClaims(uid, { encryptionKey: keyBase64 });

// Frontend
const token = await user.getIdTokenResult();
const key = await importKey(token.claims.encryptionKey);
```

### Opção 2: Firestore (com regras restritas)
```javascript
// Salvar em users/{uid}/private/encryption
// Regra: allow read: if request.auth.uid == userId;
```

### Opção 3: IndexedDB Local (menos seguro)
```javascript
// Armazena chave localmente (vulnerável a XSS)
import { saveToIndexedDB } from './app/utils/indexedDB.js';
await saveToIndexedDB('encryptionKey', key);
```

---

## 📊 Monitoramento de Segurança

### Visualizar Audit Logs

```javascript
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

async function getAuditLogs(userId) {
  const q = query(
    collection(db, 'audit_logs'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
```

### Dashboard de Segurança (Sugestão)

Crie uma página administrativa para:
- Visualizar logs de auditoria
- Monitorar tentativas de login falhadas
- Rastrear IPs suspeitos
- Verificar rate limiting em tempo real

---

## ⚠️ Avisos Importantes

1. **CSP pode quebrar scripts inline**: Se houver erros de CSP, ajuste a política em `firebase.json`
2. **App Check requer domínio registrado**: Teste local pode falhar sem configuração adequada
3. **Criptografia client-side**: Chaves perdidas = dados irrecuperáveis
4. **Rate Limiter é client-side**: Para proteção real, implemente também no backend (Cloud Functions)
5. **LGPD**: Implemente também direito ao esquecimento (anonimização de dados)

---

## 🧪 Testes Recomendados

1. **Testar CSP**: Abra DevTools → Console e verifique erros de CSP
2. **Testar RBAC**: Tente acessar recursos com usuário sem permissão
3. **Testar Rate Limiter**: Faça 21 requisições rápidas e verifique bloqueio
4. **Testar Criptografia**: Salve e recupere dados criptografados
5. **Testar App Check**: Verifique logs no Firebase Console → App Check

---

## 📚 Recursos Adicionais

- [Firebase App Check Docs](https://firebase.google.com/docs/app-check)
- [Web Crypto API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

---

**Status**: ✅ Implementação Base Completa  
**Próximo**: Configurar App Check e testar integração
