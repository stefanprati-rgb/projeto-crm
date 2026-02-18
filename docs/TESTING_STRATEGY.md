# Estratégia de Testes e Arquitetura de Qualidade: Hube CRM

Este documento define a estratégia, ferramentas e processos de garantia de qualidade para o projeto Hube CRM, com foco central em segurança multi-tenant e integridade de processos de negócio (SLA).

---

## 1️⃣ Stack de Testes Recomendada

| Camada | Ferramenta | Objetivo |
| :--- | :--- | :--- |
| **Unitário / Integração** | [Vitest](https://vitest.dev/) | Testar services, stores e hooks com alta performance. |
| **Componentes** | [React Testing Library](https://testing-library.com/) | Validar comportamento da UI e acessibilidade. |
| **Segurança (Rules)** | [@firebase/rules-unit-testing](https://www.npmjs.com/package/@firebase/rules-unit-testing) | Validar isolamento multi-tenant no Firestore Emulator. |
| **E2E / Fluxos** | [Playwright](https://playwright.dev/) | Testar jornadas completas (Login -> Cadastro -> Ticket). |
| **Infra de Dev** | [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) | Ambiente local isolado e determinístico. |

---

## 2️⃣ Matriz de Cobertura e Prioridades

| Módulo | Risco | Tipo de Teste | Prioridade |
| :--- | :--- | :--- | :--- |
| **Firestore Rules** | 🔥 Crítico | Integração (Emulator) | **P0** |
| **Tenancy Isolation** | 🔥 Crítico | E2E (Multi-context) | **P0** |
| **Cálculo de SLA** | ⚠️ Alto | Unitário (Logic) | **P1** |
| **Sync de Store (Zustand)** | ⚠️ Alto | Unitário | **P1** |
| **Services (Firebase SDK)** | Médio | Integração (Emulator) | **P1** |
| **UI Components (Atômicos)** | Baixo | Snapshot / Unitário | **P2** |

---

## 3️⃣ Estratégia por Camada

### A. Testes de Segurança (Firestore Rules)
O objetivo é garantir que o Hardening proposto no `SECURITY_AUDIT.md` funcione.
*   **Cenário 1:** Usuário A da base "EGS" tenta ler cliente da base "GIRASSOL" (Deve falhar).
*   **Cenário 2:** Editor tenta criar ticket sem o campo `database` (Deve falhar).
*   **Cenário 3:** Usuário não autenticado acessa qualquer coleção (Deve falhar).

### B. Testes Unitários de Lógica (SLA)
Testar o `ticketService.calculateDueDate` e `ticketService.getMetrics` sem depender do Firebase.
*   **Teste:** Passar prioridade 'high' e verificar se a `dueDate` é exatamente +4h.
*   **Teste:** Simular 10 tickets vencidos e validar se o `complianceRate` é calculado corretamente.

### C. Testes de Integração de Services
Validar se as queries de persistência estão enviando e recebendo os dados corretos no Emulator.
*   **Teste:** `clientService.getAll` deve retornar apenas itens com o `database` correspondente ao filtro.

### D. Testes E2E (Caminho Feliz e Infeliz)
*   **Fluxo Crítico:** Login -> Dashboard -> aba Clientes -> Novo Cliente -> Novo Ticket -> Verificar SLA no Dashboard.
*   **Fluxo de Segurança:** Logar com Usuário A -> Tentar acessar URL `/clientes/{id_da_outra_base}` -> Verificar redirecionamento ou erro 403.

---

## 4️⃣ Estrutura de Pastas de Teste

```text
/tests
  ├── unit/              # Testes de lógica pura (SLA, formatters)
  ├── services/          # Integração com Firestore Emulator
  ├── security/          # Testes específicos de firestore.rules
  └── e2e/               # Jornadas Playwright
```

---

## 5️⃣ Scripts Necessários (`package.json`)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:rules": "firebase emulators:exec 'vitest run tests/security'",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 🛠️ Roadmap de Implementação

### Fase 1: Hardening de Segurança (P0)
*   [ ] Configurar as pastas de teste e Vitest.
*   [ ] Implementar suíte de testes para `firestore.rules` focada em multi-tenancy.
*   [ ] Bloquear commits que falhem nos testes de regras.

### Fase 2: Estabilização de Negócio (P1)
*   [ ] Testar unitariamente a lógica de SLA e métricas do Dashboard.
*   [ ] Testar os `services` de Clientes e Tickets contra o Firestore Emulator.
*   [ ] Garantir que a busca (ao ser refatorada) tenha testes de performance básicos.

### Fase 3: Confiabilidade de Produção (P2)
*   [ ] Implementar 3 fluxos críticos de E2E com Playwright.
*   [ ] Configurar CI (GitHub Actions) para rodar a suíte completa em todo Pull Request.
*   [ ] Implementar testes de regressão visual para os gráficos do Dashboard.

---

## 📑 Glossário de Qualidade

*   **Idempotência:** Garantir que o teste possa rodar N vezes no emulador sem deixar lixo ou falhar por estado anterior.
*   **Shadowing:** Simular comportamentos de rede lenta para testar os estados de `loading` da store Zustand.
*   **Rules Unit Testing:** Biblioteca oficial do Firebase para injetar contextos de autenticação falsos e testar permissões.
