# ✅ Checklist de Implementação - Security & Compliance

## 📊 Status Geral

| Componente | Status | Prioridade |
|------------|--------|------------|
| Hardening de Hosting | ✅ Implementado | 🔴 Alta |
| Firestore Rules (RBAC) | ✅ Implementado | 🔴 Alta |
| Criptografia Client-Side | ✅ Implementado | 🟡 Média |
| Rate Limiter | ✅ Implementado | 🟡 Média |
| Auth Seguro | ✅ Implementado | 🔴 Alta |
| Audit Logging | ✅ Implementado | 🟢 Baixa |
| **Firebase App Check** | ⚠️ **Pendente** | 🔴 **Alta** |

---

## 🔧 Passo 1: Arquivos Base (Completo ✅)

- [x] `firebase.json` - Headers de segurança adicionados
- [x] `firestore.rules` - RBAC implementado
- [x] `public/app/utils/encryption.js` - Criado
- [x] `public/app/utils/rateLimiter.js` - Criado
- [x] `public/app/services/secureAuth.js` - Criado
- [x] `public/app/services/secureClientService.js` - Criado
- [x] `public/test_security.html` - Criado
- [x] `docs/SECURITY_*.md` - Documentação criada

---

## 🚀 Passo 2: Configuração Firebase (Pendente ⚠️)

### 2.1 Firebase App Check

- [ ] **Acessar Firebase Console**
  - URL: https://console.firebase.google.com/
  - Selecionar projeto: `[SEU_PROJETO]`

- [ ] **Ativar App Check**
  - Navegar: Build → App Check
  - Clicar: "Get Started"

- [ ] **Registrar App Web**
  - Provider: reCAPTCHA v3
  - Domínio: `seu-app.firebaseapp.com` (ou seu domínio)
  - Copiar: **Site Key** gerada

- [ ] **Atualizar Código**
  ```javascript
  // Em public/index.html ou app/config/firebase.js
  import { initSecurity } from './app/services/secureAuth.js';
  initSecurity(app, 'COLE_SUA_SITE_KEY_AQUI');
  ```

### 2.2 Estrutura de Usuários

- [ ] **Criar/Atualizar Documentos de Usuários**
  
  Para cada usuário em `users/{userId}`, adicionar:
  
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

- [ ] **Verificar Roles Existentes**
  - Listar todos os usuários
  - Garantir que todos têm campo `role`
  - Definir `allowedBases` apropriadamente

---

## 🧪 Passo 3: Testes (Pendente ⚠️)

### 3.1 Testes Locais

- [ ] **Abrir Página de Testes**
  ```bash
  start public/test_security.html
  ```

- [ ] **Executar Testes Individuais**
  - [ ] ✅ Teste de Criptografia
  - [ ] ✅ Teste de Rate Limiter
  - [ ] ✅ Teste de Validação
  - [ ] ⚠️ Teste de Firestore Rules (requer auth)
  - [ ] ⚠️ Teste de Audit Logs (requer auth)
  - [ ] ⚠️ Teste de App Check (requer config)

### 3.2 Testes com Autenticação

- [ ] **Fazer Login na Aplicação**
  - Usar usuário com role `editor`

- [ ] **Testar CRUD Seguro**
  ```javascript
  import { saveClientSecure, getClientSecure, updateClientSecure, deleteClientSecure } from './app/services/secureClientService.js';
  
  // Criar cliente
  const clientId = await saveClientSecure({
    id: 'test-123',
    name: 'Teste',
    email: 'teste@example.com',
    cpfCnpj: '12345678900'
  });
  
  // Ler cliente
  const client = await getClientSecure(clientId);
  console.log(client.cpfCnpj); // Deve estar descriptografado
  
  // Atualizar cliente
  await updateClientSecure(clientId, { name: 'Teste Atualizado' });
  
  // Deletar cliente (soft delete)
  await deleteClientSecure(clientId);
  ```

- [ ] **Verificar Audit Logs**
  - Acessar Firestore Console
  - Coleção: `audit_logs`
  - Verificar logs criados com: `userId`, `action`, `timestamp`, `ip`

### 3.3 Testes de Segurança

- [ ] **Testar Bloqueio de Delete Direto**
  ```javascript
  // Deve falhar com "Missing or insufficient permissions"
  await deleteDoc(doc(db, 'clients', 'test-123'));
  ```

- [ ] **Testar Rate Limiting**
  ```javascript
  // Fazer 25 requisições rápidas
  // Primeiras 20 devem passar, últimas 5 devem falhar
  for (let i = 0; i < 25; i++) {
    try {
      await saveClientSecure({ /* ... */ });
    } catch (error) {
      console.log(`Requisição ${i}: ${error.message}`);
    }
  }
  ```

- [ ] **Testar CSP Headers**
  - Abrir DevTools → Console
  - Verificar se não há erros de CSP
  - Se houver, ajustar `firebase.json`

---

## 🌐 Passo 4: Deploy (Pendente ⚠️)

### 4.1 Deploy de Regras

- [ ] **Deploy Firestore Rules**
  ```bash
  firebase deploy --only firestore:rules
  ```

- [ ] **Verificar Deploy**
  - Acessar Firebase Console
  - Firestore → Rules
  - Confirmar que regras foram atualizadas

### 4.2 Deploy de Hosting

- [ ] **Deploy Hosting (com headers)**
  ```bash
  firebase deploy --only hosting
  ```

- [ ] **Verificar Headers**
  - Abrir site em produção
  - DevTools → Network → Selecionar documento HTML
  - Headers → Response Headers
  - Confirmar presença de:
    - `Content-Security-Policy`
    - `X-Frame-Options`
    - `X-Content-Type-Options`
    - `Strict-Transport-Security`

### 4.3 Verificação Pós-Deploy

- [ ] **Testar Login em Produção**
  - Fazer login
  - Verificar se App Check está funcionando
  - Firebase Console → App Check → Metrics

- [ ] **Testar CRUD em Produção**
  - Criar, ler, atualizar, deletar cliente
  - Verificar audit logs

- [ ] **Monitorar Erros**
  - Firebase Console → Crashlytics (se configurado)
  - Browser Console → Verificar erros

---

## 🔄 Passo 5: Integração com Código Existente (Pendente ⚠️)

### 5.1 Substituir clientService.js

- [ ] **Backup do Arquivo Original**
  ```bash
  cp public/app/services/clientService.js public/app/services/clientService.js.bak
  ```

- [ ] **Atualizar Imports**
  
  Em todos os arquivos que usam `clientService.js`:
  
  ```javascript
  // ANTES
  import { saveClient, getClient, updateClient, deleteClient } from './services/clientService.js';
  
  // DEPOIS
  import { saveClientSecure as saveClient, getClientSecure as getClient, updateClientSecure as updateClient, deleteClientSecure as deleteClient } from './services/secureClientService.js';
  ```

- [ ] **Testar Todas as Funcionalidades**
  - Criar cliente
  - Editar cliente
  - Deletar cliente
  - Listar clientes

### 5.2 Atualizar Sistema de Login

- [ ] **Localizar Código de Login**
  - Arquivo: `[LOCALIZAR]`

- [ ] **Substituir signInWithEmailAndPassword**
  
  ```javascript
  // ANTES
  import { signInWithEmailAndPassword } from 'firebase/auth';
  const user = await signInWithEmailAndPassword(auth, email, password);
  
  // DEPOIS
  import { secureLogin } from './app/services/secureAuth.js';
  const user = await secureLogin(email, password);
  ```

- [ ] **Testar Login**
  - Login com credenciais válidas
  - Login com credenciais inválidas
  - Verificar audit log criado

### 5.3 Adicionar Rate Limiting em Outras Operações

- [ ] **Identificar Operações Críticas**
  - [ ] Criação de tickets
  - [ ] Envio de emails
  - [ ] Upload de arquivos
  - [ ] Outras operações sensíveis

- [ ] **Aplicar Rate Limiting**
  
  ```javascript
  import { dbRateLimiter } from './app/utils/rateLimiter.js';
  
  export async function createTicket(data) {
    const userId = getAuth().currentUser.uid;
    
    return await dbRateLimiter.throttle(userId, async () => {
      // Lógica original
      return await setDoc(doc(db, 'tickets', ticketId), data);
    });
  }
  ```

---

## 📊 Passo 6: Monitoramento (Pendente ⚠️)

### 6.1 Dashboard de Audit Logs

- [ ] **Criar Página de Auditoria**
  - Arquivo: `public/admin/audit-logs.html`

- [ ] **Implementar Queries**
  
  ```javascript
  // Últimos 50 logs
  const recentLogs = await getRecentLogs(null, 50);
  
  // Logs de um usuário específico
  const userLogs = await getRecentLogs(userId, 100);
  
  // Detectar atividade suspeita
  const suspicious = await detectSuspiciousActivity();
  ```

- [ ] **Visualizar Métricas**
  - Total de logins por dia
  - Tentativas de login falhadas
  - IPs suspeitos
  - Ações bloqueadas por rate limiting

### 6.2 Alertas de Segurança

- [ ] **Configurar Cloud Functions para Alertas**
  
  ```javascript
  // functions/index.js
  exports.securityAlert = functions.firestore
    .document('audit_logs/{logId}')
    .onCreate(async (snap, context) => {
      const log = snap.data();
      
      // Detectar múltiplas tentativas de login falhadas
      if (log.action === 'LOGIN_FAILED') {
        // Enviar email de alerta
      }
    });
  ```

---

## 🔐 Passo 7: LGPD Compliance (Pendente ⚠️)

### 7.1 Direito ao Esquecimento

- [ ] **Implementar Anonimização**
  
  ```javascript
  export async function anonymizeClient(clientId) {
    await setDoc(doc(db, 'clients', clientId), {
      name: '[ANONIMIZADO]',
      email: '[ANONIMIZADO]',
      cpfCnpj: '[ANONIMIZADO]',
      phone: '[ANONIMIZADO]',
      address: '[ANONIMIZADO]',
      status: 'ANONYMIZED',
      anonymizedAt: serverTimestamp()
    }, { merge: true });
  }
  ```

- [ ] **Criar Interface de Anonimização**
  - Botão "Anonimizar Dados" no perfil do cliente
  - Confirmação obrigatória
  - Log de auditoria

### 7.2 Exportação de Dados

- [ ] **Implementar Exportação**
  
  ```javascript
  export async function exportClientData(clientId) {
    const client = await getClientSecure(clientId);
    const tickets = await getClientTickets(clientId);
    const invoices = await getClientInvoices(clientId);
    
    return {
      client,
      tickets,
      invoices,
      exportedAt: new Date().toISOString()
    };
  }
  ```

- [ ] **Criar Interface de Exportação**
  - Botão "Exportar Meus Dados"
  - Download em JSON ou PDF

---

## 📈 Resumo de Progresso

### Implementação Base
- ✅ 100% - Todos os arquivos criados
- ✅ 100% - Documentação completa

### Configuração
- ⚠️ 0% - Firebase App Check pendente
- ⚠️ 0% - Estrutura de usuários pendente

### Testes
- ⚠️ 40% - Testes locais (criptografia, rate limiter)
- ⚠️ 0% - Testes com autenticação
- ⚠️ 0% - Testes de segurança

### Deploy
- ⚠️ 0% - Firestore Rules
- ⚠️ 0% - Hosting

### Integração
- ⚠️ 0% - Substituir clientService
- ⚠️ 0% - Atualizar login
- ⚠️ 0% - Rate limiting em outras operações

### Monitoramento
- ⚠️ 0% - Dashboard de audit logs
- ⚠️ 0% - Alertas de segurança

### LGPD
- ⚠️ 0% - Direito ao esquecimento
- ⚠️ 0% - Exportação de dados

---

## 🎯 Próxima Ação Recomendada

**CRÍTICO**: Configurar Firebase App Check

1. Acessar https://console.firebase.google.com/
2. Selecionar projeto
3. Build → App Check → Get Started
4. Registrar app com reCAPTCHA v3
5. Copiar Site Key
6. Atualizar código com a chave

---

**Última atualização**: 2025-12-07  
**Progresso geral**: 14% (1/7 passos completos)
