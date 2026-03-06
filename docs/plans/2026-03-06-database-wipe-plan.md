# Database Wipe Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Resetar completamente os dados do CRM (clientes, históricos, usinas e arquivos locais) para um estado limpo.

**Architecture:** Utilização da Firebase CLI para remoção recursiva no Firestore e comandos de sistema para remoção de arquivos locais.

**Tech Stack:** Firebase CLI, PowerShell.

---

### Task 1: Limpeza Online (Firestore)

**Step 1: Remover documentos de clientes e subcoleções**
Run: `firebase firestore:delete --recursive clients --project crm-energia-solar -y`
Expected: Confirmação de exclusão da coleção `clients`.

**Step 2: Remover histórico de eventos**
Run: `firebase firestore:delete --recursive client_events --project crm-energia-solar -y`
Expected: Confirmação de exclusão da coleção `client_events`.

**Step 3: Remover coleção de usinas**
Run: `firebase firestore:delete --recursive plants --project crm-energia-solar -y`
Expected: Confirmação de exclusão da coleção `plants`.

**Step 4: Commit opcional de logs**
(Não há código para comitar, mas registraremos no log da sessão)

### Task 2: Limpeza de Arquivos Locais

**Files:**
- Delete: `c:/Projetos/Projeto CRM/clientes_teste.csv`
- Delete: `c:/Projetos/Projeto CRM/faturas_exportacao_financeiro.csv`

**Step 1: Remover clientes_teste.csv**
Run: `Remove-Item "c:/Projetos/Projeto CRM/clientes_teste.csv"`
Expected: Arquivo removido com sucesso.

**Step 2: Remover faturas_exportacao_financeiro.csv**
Run: `Remove-Item "c:/Projetos/Projeto CRM/faturas_exportacao_financeiro.csv"`
Expected: Arquivo removido com sucesso.

### Task 3: Preparação da Instrução de Cache Offline

**Step 1: Gerar script de limpeza de IndexedDB**
Gerar o bloco de código JavaScript que o usuário deve rodar no navegador.

**Step 2: Notificar o usuário**
Finalizar a tarefa apresentando as instruções finais.
