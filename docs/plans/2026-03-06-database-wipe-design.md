# Design Doc - Limpeza Total de Dados (Database Wipe)

**Data:** 2026-03-06
**Status:** Aprovado pelo Usuário
**Objetivo:** Garantir a remoção completa e segura de todos os dados de clientes, históricos, usinas e arquivos de teste vinculados ao CRM, tanto no ambiente online (Firestore) quanto no local (Navegador e Arquivos).

## 1. Escopo de Exclusão

### 1.1 Online (Firebase Firestore)
Remoção recursiva das seguintes coleções no projeto `crm-energia-solar`:
- `clients`: Dados principais, subcoleções de tickets e projetos.
- `client_events`: Histórico de interações.
- `plants`: Registros de usinas e operadores.

### 1.2 Local (Sistema de Arquivos)
Exclusão definitiva dos arquivos de carga de teste:
- `clientes_teste.csv`
- `faturas_exportacao_financeiro.csv`

### 1.3 Local (Persistência Offline - Browser)
Instruir o usuário sobre a limpeza do IndexedDB para evitar ressincronização indesejada de cache.

## 2. Estratégia de Execução

### Fase 1: Limpeza Online
Utilização da Firebase CLI via terminal para garantir que subcoleções sejam removidas com sucesso (exclusão em lote).

### Fase 2: Limpeza de Arquivos
Uso de comandos de sistema (PowerShell/CMD) para remover os CSVs identificados.

### Fase 3: Instrução de Cache
Fornecimento de script JavaScript para execução no console do navegador (F12).

## 3. Riscos e Prevenção
- **Risco:** Exclusão de dados de autenticação.
  - **Mitigação:** Confirmado com o usuário que **apenas** documentos e históricos serão apagados; os usuários (auth) permanecem.
- **Risco:** Ressincronização de dados offline.
  - **Mitigação:** Limpeza obrigatória do IndexedDB após a exclusão online.

## 4. Próximos Passos
1. Criar plano de tarefas detalhado.
2. Executar comandos de exclusão online.
3. Deletar arquivos locais.
4. Apresentar script de limpeza de cache ao usuário.
