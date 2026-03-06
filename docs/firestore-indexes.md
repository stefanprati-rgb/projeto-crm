# Índices de Produção - Firestore

Este documento lista os índices compostos necessários para que as consultas do Hube CRM funcionem sem erros de "Missing Index" em produção.

## Coleção: `clients`

### 1. Pipeline de Onboarding (Completo)
- **Campos**: `database` (asc), `onboarding.pipelineStatus` (asc), `onboarding.updatedAt` (desc)
- **Uso**: `clientService.getOnboardingPipeline` com filtro de status.

### 2. Pipeline de Onboarding (Sem Filtro de Status)
- **Campos**: `database` (asc), `onboarding.updatedAt` (desc)
- **Uso**: `clientService.getOnboardingPipeline` quando nenhum status é selecionado.

### 3. Dashboard / Listagem Geral
- **Campos**: `database` (asc), `createdAt` (desc)
- **Uso**: `clientService.getAll`, `clientService.getAllForDashboard`.

---

## Coleção: `client_events`

### 1. Timeline do Cliente
- **Campos**: `clientId` (asc), `createdAt` (desc)
- **Uso**: `eventService.getEvents`.

### 2. Dashboard de Atividades / Exportação
- **Campos**: `database` (asc), `createdAt` (desc)
- **Uso**: `eventService.getRecentEvents`, `exportService.exportEvents`.

---

## Coleção: `tickets` (Collection Group)

### 1. Listagem Global de Tickets
- **Query Scope**: Collection Group
- **Campos**: `database` (asc), `createdAt` (desc)
- **Uso**: `ticketService.getAll`.

### 2. Listagem de Tickets por Status
- **Query Scope**: Collection Group
- **Campos**: `database` (asc), `status` (asc), `createdAt` (desc)
- **Uso**: `ticketService.getAll` com filtro de status.

---

## Instruções para Aplicação

Os índices acima foram incluídos no arquivo `firestore.indexes.json`. Para implantar as alterações, execute:

```bash
firebase deploy --only firestore:indexes
```

Em caso de erros em tempo de execução, o Firestore geralmente retorna uma URL no console do navegador que cria o índice necessário automaticamente. Liste esses links aqui se novos padrões de consulta forem criados.
