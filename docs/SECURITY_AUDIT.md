# Auditoria de Segurança e Isolamento Multi-Tenant: Hube CRM

Este documento detalha a análise de segurança do sistema Hube CRM, focando em autenticação, autorização e a integridade do isolamento multi-tenant entre diferentes bases de clientes.

---

## 1️⃣ Resumo Executivo: Estado de Tenancy

| Área | Status | Notas |
| :--- | :---: | :--- |
| **Autenticação** | ✅ Seguro | Firebase Auth implementado corretamente. |
| **Isolamento de Dados** | ⚠️ Frágil | As regras do Firestore permitem leitura de qualquer cliente por qualquer usuário autenticado. |
| **Controle de Role** | ✅ Seguro | RBAC (Role-Based Access Control) baseado em documento do Firestore. |
| **Integridade de Escrita** | ⚠️ Frágil | Validação de schema incompleta e falta de verificação de tenancy na criação. |
| **Audit Logs** | ✅ Seguro | Estrutura append-only implementada. |

---

## 2️⃣ Análise Multi-Tenant (CRÍTICA)

O sistema utiliza um modelo de **Tenancy Lógico**, onde o isolamento é feito por um campo `database` (ex: "EGS", "GIRASSOL").

### Vulnerabilidade Identificada: Vazamento Cross-Tenant
*   **Problema:** No arquivo `firestore.rules`, a regra de leitura para a coleção `clients` é:
    ```javascript
    allow read: if isAuth();
    ```
*   **Impacto:** Qualquer usuário logado no sistema, independente de sua role ou das bases permitidas (`allowedBases`), pode teoricamente baixar a lista completa de clientes de **todos** os projetos se fizer uma query manual via SDK ou console do navegador.
*   **Classificação:** **CRÍTICO**.

### Vulnerabilidade em queries de Coleção Group
*   **Problema:** Tickets usam `collectionGroup` para queries globais. As regras atuais para sub-coleções (linha 41) seguem o mesmo padrão `if isAuth()`.
*   **Risco Técnico:** Exposição de tickets de suporte entre diferentes empresas/projetos.

---

## 3️⃣ Firestore Rules Review: Pontos de Falha

### Falta de Validação de Base Permitida
A função `isEditor()` apenas verifica a role `editor`, mas ignora o array `allowedBases` definido no documento do usuário.

**Risco de Bypass:**
Um editor da base "EGS" pode criar ou atualizar um cliente na base "GIRASSOL" simplesmente enviando o valor `"GIRASSOL"` no campo `database`, pois a regra atual (linha 25-35) não valida se o usuário tem permissão sobre o domínio que está manipulando.

### Shadow-fields e Schema Incompleto
A regra de criação de clientes exige apenas `['name', 'email', 'status', 'createdAt']`.
*   **Omissão:** O campo `database` não é validado na criação, permitindo criar clientes "órfãos" ou em bases inexistentes.

---

## 4️⃣ Vetores de Ataque Identificados

1.  **Escalada de Privilégio (Lateral):**
    *   Um usuário `role: 'user'` de baixo nível descobre o ID de um cliente de outra base e consegue acessar todos os seus dados e faturas, pois a regra de leitura é globalmente permitida para autenticados.
2.  **Manipulação de Tenancy:**
    *   Um `editor` malicioso captura a requisição de criação de cliente e altera o `database` para o projeto de um concorrente, injetando dados falsos.
3.  **Injeção de Metadados:**
    *   Como a escrita em tickets só exige ser `isEditor()` (linha 42) e não possui validação de schema estrita, um editor pode injetar campos arbitrários em tickets para alterar fluxos de SLA.

---

## 5️⃣ Dados Sensíveis e Proteção

*   **PII (Dados Pessoais):** Nome, E-mail, Telefone, CPF/CNPJ. Estão expostos a qualquer usuário autenticado devido à regra de leitura fraca.
*   **Faturas:** Documentadas como "Imutáveis pelo cliente", mas legíveis por qualquer `isAuth()`. Risco de exposição de dados financeiros inter-empresas.
*   **Audit Logs:** Implementação robusta de `userId == request.auth.uid`. Dificulta o repúdio de ações maliciosas.

---

## 6️⃣ Matriz de Risco

| Vulnerabilidade | Impacto | Probabilidade | Severidade | Mitigação |
| :--- | :--- | :--- | :--- | :--- |
| Vazamento de Tenancy via `isAuth()` | Altíssimo | Alta | **CRÍTICO** | Restringir leitura via `allowedBases` no Rules. |
| Edição de base não autorizada | Alto | Média | **ALTO** | Validar `request.resource.data.database` no user doc. |
| Exposição de faturas financeiras | Altíssimo | Baixa | **ALTO** | Aplicar filtro de tenancy nas faturas. |
| Privilege Escalation em Tickets | Médio | Baixa | **MÉDIO** | Adicionar validação de schema em sub-coleções. |

---

## 7️⃣ Hardening Roadmap

### Imediato (P0) - Correções de Isolamento
*   **[Rules]** Refatorar `match /clients/{clientId}`:
    ```javascript
    allow read: if isAuth() && 
      resource.data.database in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.allowedBases;
    ```
*   **[Rules]** Aplicar a mesma lógica para o `collectionGroup` de `tickets`.

### Curto Prazo (P1) - Integridade e Schema
*   **[Rules]** Validar campo `database` na criação (`allow create`) garantindo que ele pertença ao array do usuário.
*   **[Services]** Implementar filtragem forçada de `database` em todos os métodos `getAll` da camada de serviço (segurança em profundidade).
*   **[Auth]** Mudar para *Custom Claims* de JWT para armazenar `role` e `allowedBases`, evitando leituras extras de Firestore em cada validação de regra (`get()` no rules consome cota).

### Longo Prazo (P2) - Governança
*   **[Logs]** Implementar monitoramento de "Acessos do Além" (usuários tentando acessar documentos fora de sua base).
*   **[Compliance]** Mascaramento de dados (PII) no frontend para usuários com role `viewer` (ex: CPF: ***.456.***-**).

---

## 📑 Recomendações de Código Crítico

### Nova Função de Validação sugerida para Firestore Rules:
```javascript
function canAccessBase(base) {
  let userBases = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.allowedBases;
  return base in userBases || getRole() == 'admin';
}

// Uso:
match /clients/{clientId} {
  allow read: if isAuth() && canAccessBase(resource.data.database);
  allow create: if isEditor() && canAccessBase(request.resource.data.database);
}
```
