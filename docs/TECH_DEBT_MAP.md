# Mapa de Débito Técnico: Hube CRM

Este documento cataloga, classifica e prioriza as dívidas técnicas identificadas no projeto Hube CRM, servindo como guia para o processo de refatoração e endurecimento do sistema.

---

## 📊 Matriz de Priorização

| Débito | Impacto | Esforço | Prioridade | Quick Win? |
| :--- | :---: | :---: | :---: | :---: |
| Busca de Clientes Client-Side | Crítico | M | **P0** | Não |
| Falta de ClientSelector em Tickets | Crítico | S | **P0** | ✅ Sim |
| Ausência de Testes Automatizados | Médio | L | **P1** | Não |
| Hard Delete em Lote (deleteAll) | Alto | S | **P1** | ✅ Sim |
| Isolamento Global Multi-tenant | Alto | M | **P1** | Não |
| Prop Drilling em Modais | Médio | S | **P2** | ✅ Sim |
| Validação de Schema em Firestore Rules | Médio | S | **P2** | ✅ Sim |

---

## 1️⃣ Arquitetura & Escalabilidade

### Busca e Filtragem Client-Side
*   **Descrição:** A função `clientService.search` baixa todos os clientes via `getAllForDashboard` e filtra em memória usando JavaScript.
*   **Impacto no Negócio:** Lentidão extrema ao escalar acima de 500 clientes. Inviabiliza o uso do sistema por CS com grandes carteiras.
*   **Severidade:** Crítica
*   **Risco Técnico:** Crash do navegador e alto consumo de banda.
*   **Probabilidade de Incidente:** 100% (conforme a base cresce).
*   **Custo Atual:** Latência moderada.
*   **Custo Futuro:** Sistema inutilizável.
*   **Esforço de Correção:** M (Migração para Indexação de busca ou filtering no Firestore).
*   **Prioridade:** P0

### Estrutura de Sub-coleções (Tickets)
*   **Descrição:** Tickets são armazenados em `clients/{clientId}/tickets`. Queries globais dependem de `collectionGroup`.
*   **Risco:** Se o `clientId` não for propagado corretamente ou se as regras de indexação falharem, o sistema não recupera tickets.
*   **Prioridade:** P1

---

## 2️⃣ Firebase & Backend

### Hard Delete (Segurança de Dados)
*   **Descrição:** A função `clientService.deleteAll` remove documentos fisicamente do Firestore.
*   **Descrição Técnica:** Não há mecanismo de `deletedAt` ou `soft delete`.
*   **Impacto no Negócio:** Perda irreversível de dados em caso de erro humano ou bug.
*   **Severidade:** Alta
*   **Esforço:** S (Implementar flag `active: false` e filtrar queries).
*   **Prioridade:** P1

### Multi-tenancy Implícito
*   **Descrição:** O isolamento entre bases (EGS, Girassol) é feito via campo `database`, mas muitas queries não forçam esse filtro na camada de serviço, dependendo puramente das `Security Rules`.
*   **Custo Futuro:** Risco de vazamento de dados se as regras forem alteradas acidentalmente.
*   **Prioridade:** P1

---

## 3️⃣ Frontend & UI/UX

### BUG P0: Tickets Incompleto (ClientSelector)
*   **Descrição:** O componente `TicketModal` não permite selecionar o cliente de forma robusta, dependendo de props externas que nem sempre estão presentes.
*   **Quick Win:** ✅ Sim. Implementar o `ClientSelector` conforme planejado em `docs/P0_BLOQUEADORES_SOLUCOES.md`.
*   **Prioridade:** P0

### Sincronização Dashboard vs Real-time
*   **Descrição:** O Dashboard utiliza métricas calculadas que podem desincronizar se o listener de clientes não estiver ativo na página principal.
*   **Probabilidade de Incidente:** Alta (erro de contagem de usuários).
*   **Esforço:** S (Sincronizar hooks de métricas com a store global).
*   **Prioridade:** P1

---

## 4️⃣ Segurança

### Regras de Escrita vs Schema (Firestore Rules)
*   **Descrição:** Embora existam regras, elas não validam todos os sub-campos de objetos complexos (ex: faturas ou metadados de tickets).
*   **Risco:** Injeção de campos desnecessários ou maliciosos que podem quebrar o frontend.
*   **Prioridade:** P2

---

## 5️⃣ Testes e Qualidade

### Cobertura Zero
*   **Descrição:** Não existem testes unitários (Vitest) ou E2E (Playwright).
*   **Risco Técnico:** Regressões frequentes em refatorações de serviços críticos.
*   **Prioridade:** P1

---

## 🚀 Quick Wins (Baixo Esforço / Alto Ganho)

1.  **Implementar ClientSelector:** Resolve o bloqueador de criação de tickets.
2.  **Fix Edição de Cliente:** Adicionar `reset(client)` no `ClientModal` para garantir preenchimento de campos.
3.  **Soft Delete Flag:** Mudar `delete` para apenas marcar `status: 'deleted'`.
4.  **Debounce na Busca:** Evitar execuções excessivas do filtro em memória enquanto o usuário digita.

---

## 🛠️ Roadmap de Correção

### Fase 1: Hardening Imediato (Semana 1)
*   [ ] Implementar `ClientSelector` e corrigir modais de edição.
*   [ ] Adicionar lógica de Soft Delete.
*   [ ] Reforçar logs de auditoria no Firestore.

### Fase 2: Estabilização (Semana 2-3)
*   [ ] Implementar busca paginada e filtrada via Firestore (remover `search` client-side).
*   [ ] Criar suíte de testes unitários para a camada de `services`.
*   [ ] Sincronizar metricas do Dashboard com a store global.

### Fase 3: Escala (Semana 4+)
*   [ ] Integrar busca full-text (Algolia ou Similar).
*   [ ] Implementar sistema de notificações (Push API).
*   [ ] Refatoração para Clean Architecture (isolamento total do Firebase SDK das Views).

---

## 📑 Glossário Técnico de Débitos

*   **P0:** Bloqueia uso do sistema ou causa erro fatal.
*   **P1:** Compromete integridade de dados ou escalabilidade.
*   **P2:** Melhora UX ou DX mas não impede operação.
*   **O(n) Search:** O custo da busca aumenta linearmente com o número de itens, tornando o app lento.
