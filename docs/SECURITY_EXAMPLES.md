# 🔐 Exemplos Práticos de Uso - Security & Compliance

## 📖 Índice
1. [Exemplo 1: Login Seguro](#exemplo-1-login-seguro)
2. [Exemplo 2: Criar Cliente com Criptografia](#exemplo-2-criar-cliente-com-criptografia)
3. [Exemplo 3: Atualizar Cliente com Rate Limiting](#exemplo-3-atualizar-cliente-com-rate-limiting)
4. [Exemplo 4: Soft Delete](#exemplo-4-soft-delete)
5. [Exemplo 5: Consultar Audit Logs](#exemplo-5-consultar-audit-logs)
6. [Exemplo 6: Validação de Permissões](#exemplo-6-validação-de-permissões)

---

## Exemplo 1: Login Seguro

### Código Anterior (Inseguro)
```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

async function login(email, password) {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
```

### Código Novo (Seguro)
```javascript
import { secureLogin } from './app/services/secureAuth.js';

async function login(email, password) {
  try {
    const user = await secureLogin(email, password);
    
    // Usuário autenticado com sucesso
    // App Check validou automaticamente
    // Log de auditoria criado
    
    console.log('Login bem-sucedido:', user.email);
    return user;
    
  } catch (error) {
    if (error.message.includes('Bot')) {
      alert('Verificação de segurança falhou. Você é um robô?');
    } else {
      alert('Erro no login: ' + error.message);
    }
    throw error;
  }
}
```

### Benefícios
✅ reCAPTCHA v3 automático (anti-bot)  
✅ Audit log com IP e timestamp  
✅ Proteção contra ataques automatizados

---

## Exemplo 2: Criar Cliente com Criptografia

### Código Anterior (Dados em Texto Plano)
```javascript
import { getFirestore, doc, setDoc } from 'firebase/firestore';

async function createClient(clientData) {
  const db = getFirestore();
  const clientRef = doc(db, 'clients', clientData.id);
  
  await setDoc(clientRef, {
    name: clientData.name,
    email: clientData.email,
    cpfCnpj: clientData.cpfCnpj, // ⚠️ TEXTO PLANO!
    createdAt: new Date()
  });
}
```

### Código Novo (Dados Criptografados)
```javascript
import { saveClientSecure } from './app/services/secureClientService.js';

async function createClient(clientData) {
  try {
    const clientId = await saveClientSecure({
      id: generateId(),
      name: clientData.name,
      email: clientData.email,
      cpfCnpj: clientData.cpfCnpj, // Será criptografado automaticamente
      phone: clientData.phone,
      address: clientData.address,
      status: 'ATIVO'
    });
    
    console.log('Cliente criado com sucesso:', clientId);
    return clientId;
    
  } catch (error) {
    if (error.message.includes('Limite de requisições')) {
      alert('Você está criando clientes muito rápido. Aguarde um momento.');
    } else if (error.message.includes('Email inválido')) {
      alert('Por favor, forneça um email válido.');
    } else {
      alert('Erro ao criar cliente: ' + error.message);
    }
    throw error;
  }
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### O que acontece nos bastidores:
1. ✅ **Rate Limiting**: Verifica se usuário não está fazendo spam
2. ✅ **Validação**: Garante que nome e email são válidos
3. ✅ **Criptografia**: CPF/CNPJ é criptografado com AES-GCM
4. ✅ **Metadata**: Adiciona `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
5. ✅ **Firestore**: Salva dados criptografados
6. ✅ **Audit Log**: Registra ação com IP e timestamp

---

## Exemplo 3: Atualizar Cliente com Rate Limiting

### Código Anterior
```javascript
async function updateClient(clientId, updates) {
  const db = getFirestore();
  const clientRef = doc(db, 'clients', clientId);
  
  await setDoc(clientRef, updates, { merge: true });
}
```

### Código Novo
```javascript
import { updateClientSecure } from './app/services/secureClientService.js';

async function updateClient(clientId, updates) {
  try {
    // Apenas campos permitidos podem ser atualizados
    const allowedUpdates = {
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      status: updates.status
    };
    
    await updateClientSecure(clientId, allowedUpdates);
    
    console.log('Cliente atualizado com sucesso');
    
  } catch (error) {
    if (error.message.includes('Campos não permitidos')) {
      alert('Você está tentando atualizar campos protegidos!');
    } else if (error.message.includes('Limite de requisições')) {
      alert('Muitas atualizações em pouco tempo. Aguarde.');
    } else {
      alert('Erro ao atualizar: ' + error.message);
    }
    throw error;
  }
}
```

### Proteções Aplicadas
✅ Apenas campos permitidos podem ser atualizados  
✅ Campos críticos (`createdAt`, `createdBy`) são protegidos  
✅ Rate limiting previne spam de atualizações  
✅ Audit log registra quem fez a alteração

---

## Exemplo 4: Soft Delete

### ❌ NUNCA FAÇA ISSO
```javascript
import { deleteDoc } from 'firebase/firestore';

// ❌ Delete direto é BLOQUEADO pelas regras do Firestore
await deleteDoc(doc(db, 'clients', clientId));
// Erro: Missing or insufficient permissions
```

### ✅ FAÇA ISSO (Soft Delete)
```javascript
import { deleteClientSecure } from './app/services/secureClientService.js';

async function deleteClient(clientId) {
  try {
    await deleteClientSecure(clientId);
    
    console.log('Cliente marcado como deletado');
    // Status agora é 'DELETED'
    // Dados ainda existem no banco (LGPD - direito ao esquecimento)
    
  } catch (error) {
    alert('Erro ao deletar: ' + error.message);
    throw error;
  }
}

// Para listar apenas clientes ativos
async function getActiveClients() {
  const q = query(
    collection(db, 'clients'),
    where('status', '!=', 'DELETED')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Por que Soft Delete?
✅ **LGPD**: Mantém histórico para auditoria  
✅ **Recuperação**: Possível restaurar dados deletados acidentalmente  
✅ **Integridade**: Preserva relacionamentos (faturas, tickets, etc.)

---

## Exemplo 5: Consultar Audit Logs

### Dashboard de Auditoria
```javascript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

async function getRecentLogs(userId = null, maxResults = 50) {
  const db = getFirestore();
  
  let q = query(
    collection(db, 'audit_logs'),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );
  
  // Filtrar por usuário específico
  if (userId) {
    q = query(
      collection(db, 'audit_logs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
  }
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      action: data.action,
      details: data.details,
      timestamp: data.timestamp?.toDate(),
      ip: data.ip,
      userAgent: data.userAgent
    };
  });
}

// Exemplo de uso
async function showAuditDashboard() {
  const logs = await getRecentLogs();
  
  console.log('=== ÚLTIMAS AÇÕES ===');
  logs.forEach(log => {
    console.log(`[${log.timestamp.toLocaleString()}] ${log.action}`);
    console.log(`  Usuário: ${log.userId}`);
    console.log(`  IP: ${log.ip}`);
    console.log(`  Detalhes:`, log.details);
    console.log('---');
  });
}

// Detectar atividade suspeita
async function detectSuspiciousActivity() {
  const logs = await getRecentLogs(null, 100);
  
  // Agrupar por IP
  const ipCounts = {};
  logs.forEach(log => {
    ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
  });
  
  // IPs com mais de 20 ações em pouco tempo
  const suspicious = Object.entries(ipCounts)
    .filter(([ip, count]) => count > 20)
    .map(([ip, count]) => ({ ip, count }));
  
  if (suspicious.length > 0) {
    console.warn('⚠️ IPs suspeitos detectados:', suspicious);
  }
  
  return suspicious;
}
```

---

## Exemplo 6: Validação de Permissões

### Verificar Role do Usuário
```javascript
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

async function getUserRole() {
  const auth = getAuth();
  const db = getFirestore();
  
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
  
  if (!userDoc.exists()) {
    throw new Error('Dados do usuário não encontrados');
  }
  
  return userDoc.data().role; // 'editor' ou 'viewer'
}

async function checkPermission(requiredRole) {
  const userRole = await getUserRole();
  
  const roleHierarchy = {
    'viewer': 1,
    'editor': 2,
    'admin': 3
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Exemplo de uso em componente
async function handleDeleteClient(clientId) {
  try {
    // Verificar permissão antes de tentar deletar
    const hasPermission = await checkPermission('editor');
    
    if (!hasPermission) {
      alert('Você não tem permissão para deletar clientes');
      return;
    }
    
    await deleteClientSecure(clientId);
    alert('Cliente deletado com sucesso');
    
  } catch (error) {
    alert('Erro: ' + error.message);
  }
}
```

### Ocultar Botões Baseado em Permissão
```javascript
// No componente React/HTML
async function renderClientActions(clientId) {
  const userRole = await getUserRole();
  
  const actionsHTML = `
    <div class="client-actions">
      <button onclick="viewClient('${clientId}')">
        👁️ Visualizar
      </button>
      
      ${userRole === 'editor' || userRole === 'admin' ? `
        <button onclick="editClient('${clientId}')">
          ✏️ Editar
        </button>
        <button onclick="deleteClient('${clientId}')">
          🗑️ Deletar
        </button>
      ` : ''}
    </div>
  `;
  
  return actionsHTML;
}
```

---

## 🎯 Resumo de Boas Práticas

### ✅ SEMPRE FAÇA
- Use `secureLogin()` ao invés de `signInWithEmailAndPassword()`
- Use `saveClientSecure()` para criar/atualizar clientes
- Use soft delete (`deleteClientSecure()`) ao invés de `deleteDoc()`
- Verifique permissões antes de ações críticas
- Consulte audit logs regularmente
- Valide dados no client-side E no Firestore Rules

### ❌ NUNCA FAÇA
- Armazenar dados sensíveis em texto plano
- Usar `deleteDoc()` diretamente
- Ignorar erros de rate limiting
- Modificar campos críticos (`createdAt`, `createdBy`)
- Confiar apenas em validação client-side
- Expor chaves de criptografia

---

## 📚 Recursos Adicionais

- [Guia de Implementação Completo](./SECURITY_IMPLEMENTATION.md)
- [Resumo da Implementação](./SECURITY_SUMMARY.md)
- [Página de Testes](../public/test_security.html)
- [Código Fonte - secureClientService.js](../public/app/services/secureClientService.js)

---

**Última atualização**: 2025-12-07
