# Revisão de Arquitetura Firestore e Otimização de Custos: Hube CRM

Este documento analisa a eficiência das queries, a estrutura de dados e o modelo de custos do Firestore para o Hube CRM, focando em escalabilidade e isolamento multi-tenant.

---

## 1️⃣ Estrutura de Coleções Atual

| Coleção | Tipo | Documento Pai | Chave de Partição (Tenancy) |
| :--- | :--- | :--- | :--- |
| `users` | Root | - | `uid` (Auth) |
| `clients` | Root | - | `database` (campo) |
| `tickets` | Sub-coleção | `clients/{clientId}` | `database` (via ancestral) |
| `invoices` | Root | - | `database` (campo) |
| `audit_logs` | Root | - | `database` (implícito via `userId`) |

---

## 2️⃣ Análise de Queries Críticas

### Query A: Listagem de Clientes (`clientService.getAll`)
*   **Filtro Database:** ✅ Implementado via `where('database', '==', baseFilter)`.
*   **Paginação:** ✅ Implementada via `limit` e `startAfter(lastDoc)`.
*   **Índice:** ✅ Existente (composto: `database` ASC, `name` ASC).
*   **Eficiência:** Alta. O custo é estritamente proporcional ao `pageSize` (25-50).
*   **Risco:** Se o `baseFilter` vier vazio/nulo, a query retorna dados de todos os tenants (vazamento).

### Query B: Busca de Clientes (`clientService.search`)
*   **Filtro Database:** ❌ Ineficiente. Baixa a lista completa via `getAllForDashboard`.
*   **Paginação:** ❌ Não possui. Filtra em memória.
*   **Índice:** N/A (Client-side).
*   **Eficiência:** **MUITO BAIXA**. Consome leituras de todos os documentos da base a cada busca.
*   **Custo:** O(N) onde N é o total de clientes da empresa.

### Query C: Monitor de Tickets Global (`ticketService.getAll`)
*   **Filtro Database:** ❌ **AUSENTE**. Usa `collectionGroup('tickets')` globalmente.
*   **Paginação:** ✅ Implementada via `limit`.
*   **Índice:** ✅ Existente (CG: `createdAt` DESC).
*   **Risco Técnico:** Retorna tickets de todos os inquilinos misturados, dependendo apenas do frontend para filtrar (vulnerabilidade crítica apontada no `SECURITY_AUDIT.md`).

---

## 3️⃣ Collection Group: Desempenho e Custos

O uso de `collectionGroup` para tickets é elegante estruturalmente (dados próximos ao cliente), mas caro e vulnerável se não houver um campo redundante de tenancy no próprio ticket.

*   **Problema de Custo:** Para filtrar tickets de uma base específica usando `collectionGroup`, é necessário adicionar o campo `database` em cada documento de ticket (desnormalização).
*   **Índice Composto Sugerido:**
    *   `Collection Group: tickets`
    *   `database` (ASC) + `createdAt` (DESC)
*   **Custo Atual:** Alto risco de "Over-reading" (ler dados que serão descartados pelo frontend).

---

## 4️⃣ Paginação e Performance

O sistema utiliza o padrão recomendado (`limit` + `startAfter`), o que garante que o custo de scroll não aumente conforme o usuário navega. 

*   **Ponto de Atenção:** A persistência do cursor (`lastDoc`) é feita no estado do componente. Se o usuário atualizar a página, ele volta para a página 1. 
*   **Recomendação:** Salvar o estado da página na URL (query params) para permitir compartilhamento de visualizações específicas.

---

## 5️⃣ Estimativa de Custos (Tier Gratuito vs 10k Docs)

| Operação | Leituras | Escritas | Custo 10k Clientes | Risco |
| :--- | :--- | :--- | :--- | :--- |
| Carregar Dashboard | ~50 | 0 | Baixo | Baixo |
| Busca de Cliente | **Total Docs** | 0 | **EXTREMO** | Esgotamento de cota diária |
| Listar Tickets | ~50 | 0 | Baixo | Cross-tenant leak |
| Importação Lote | 0 | ~400/batch | Moderado | Limite de escrita/seg |

---

## 6️⃣ Tenancy by Design: Proposta de Refatoração

Para garantir isolamento e otimização de custos, a estrutura deve evoluir para:

1.  **Redundância de Tenancy:** Adicionar o campo `database` em **todos** os documentos, inclusive tickets e faturas.
2.  **Índices Compostos de Isolamento:** Criar índices que sempre começam por `database` para todas as listagens.
3.  **Filtragem de Busca Server-Side:**
    *   **Opção S (Firestore):** Usar busca por prefixo (`startAt(termo)`, `endAt(termo + '\uf8ff')`) — Limitado a 1 campo.
    *   **Opção M (Algolia):** Ideal para busca por nome/email/CNPJ simultâneos.

---

## 7️⃣ Roadmap de Arquitetura Firestore

### P0 — Isolamento (Fix Imediato)
*   [ ] Adicionar campo `database` em `ticketService.create`.
*   [ ] Atualizar `ticketService.getAll` para incluir `where('database', '==', currentBase)`.
*   [ ] Criar índice composto de `collectionGroup` para `database` + `status` + `createdAt`.

### P1 — Otimização de Busca
*   [ ] Implementar busca parametrizada no Firestore (limitada ao nome) para substituir o `getAllForDashboard`.
*   [ ] Adicionar lógica de `Debounce` (300ms) em todos os campos de busca.

### P2 — Estrutura Massiva
*   [ ] Migrar `audit_logs` para uma root collection separada ou exportar para BigQuery para reduzir custos de armazenamento e leitura no Firestore.
*   [ ] Implementar aggregations nativas do Firestore (`count()`, `sum()`) para o Dashboard, evitando ler documentos para contar totais.
