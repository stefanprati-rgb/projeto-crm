# 🔐 Guia de Segurança - Projeto CRM

## ⚠️ IMPORTANTE: Proteção de Credenciais

Este documento contém diretrizes essenciais de segurança para o projeto.

---

## 1. Firebase API Keys

### ✅ O que é SEGURO expor:
- **API Key do Firebase** (`apiKey` no `firebaseConfig`)
  - Esta chave é **pública por design** do Firebase
  - É usada no frontend e não representa risco de segurança
  - A segurança é garantida pelas **Firestore Rules** e **Authentication**

### ⚠️ O que NUNCA deve ser exposto:

#### Service Account Keys (CRÍTICO)
- **NUNCA** commite arquivos `*-firebase-adminsdk-*.json`
- **NUNCA** compartilhe service accounts em:
  - README.md
  - Código fonte
  - Issues públicas
  - Pull requests
  - Documentação pública

#### GitHub Secrets
- Service accounts devem estar **APENAS** em:
  - GitHub Secrets (para CI/CD)
  - Variáveis de ambiente do servidor (para backend)
  - Cofres de senha seguros (1Password, LastPass, etc.)

---

## 2. Configuração do Firebase

### Arquivo Atual: `public/app/config/firebaseConfig.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBD_qBqWHHnq1QQjROI2jkJu1K6RbBnE",  // ✅ PÚBLICO - OK
  authDomain: "crm-energia-solar.firebaseapp.com",
  projectId: "crm-energia-solar",
  storageBucket: "crm-energia-solar.firebasestorage.app",
  messagingSenderId: "83187644189",
  appId: "1:83187644189:web:d3cf98a894e87c2c8093f4",
  measurementId: "G-QC5dRD90W"
};
```

**Status**: ✅ Seguro para commit

---

## 3. Proteção via Firestore Rules

A segurança real do Firebase vem das **Firestore Security Rules** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Exemplo: Apenas usuários autenticados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Checklist de Segurança:
- [ ] Regras de leitura/escrita baseadas em autenticação
- [ ] Validação de dados no servidor
- [ ] Limitação de acesso por role/permissão
- [ ] Auditoria regular das regras

---

## 4. GitHub Actions & CI/CD

### Secret Necessário:
- `FIREBASE_SERVICE_ACCOUNT_CRM_ENERGIA_SOLAR`

### Como Configurar (Admin apenas):

1. **Gerar Service Account** (Firebase Console):
   - Project Settings → Service Accounts
   - Generate new private key
   - **Baixar JSON** (manter seguro!)

2. **Adicionar ao GitHub**:
   - Repository Settings → Secrets and variables → Actions
   - New repository secret
   - Nome: `FIREBASE_SERVICE_ACCOUNT_CRM_ENERGIA_SOLAR`
   - Valor: Conteúdo completo do JSON

3. **Deletar arquivo local**:
   ```bash
   # NUNCA commite este arquivo!
   rm nome-do-arquivo-firebase-adminsdk.json
   ```

---

## 5. Arquivos Protegidos pelo .gitignore

```gitignore
# Service accounts
firebase-key.json
*-firebase-adminsdk-*.json

# Configurações locais
.env
.env.local
.env.*.local

# Backups que podem conter credenciais
*.backup.js
*.old.js
```

---

## 6. Boas Práticas

### ✅ FAZER:
- Usar Firebase Authentication para controle de acesso
- Implementar regras de segurança robustas no Firestore
- Manter service accounts em GitHub Secrets
- Revisar permissões regularmente
- Usar variáveis de ambiente para configurações sensíveis

### ❌ NÃO FAZER:
- Commitar service accounts
- Compartilhar credenciais em documentação pública
- Usar regras permissivas (`allow read, write: if true`)
- Expor endpoints de API sem autenticação
- Documentar como obter credenciais em README público

---

## 7. Auditoria de Segurança

### Checklist Mensal:
- [ ] Revisar Firestore Rules
- [ ] Verificar logs de acesso no Firebase Console
- [ ] Auditar usuários com permissões elevadas
- [ ] Verificar se há service accounts vazadas (GitHub, logs)
- [ ] Atualizar dependências (`npm audit`)

### Em Caso de Vazamento:

1. **Revogar imediatamente** a service account comprometida
2. **Gerar nova** service account
3. **Atualizar** GitHub Secret
4. **Revisar logs** de acesso para atividades suspeitas
5. **Notificar** equipe de segurança

---

## 8. Recursos Adicionais

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Última atualização**: 2025-12-03  
**Responsável**: Equipe de Desenvolvimento
