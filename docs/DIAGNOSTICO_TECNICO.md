# DIAGNÓSTICO ESTRUTURAL COMPLETO: PROJETO HUBE CRM

Este diagnóstico foi realizado através de uma auditoria técnica profunda no código-fonte, configurações de infraestrutura (Firebase) e padrões de arquitetura do sistema.

---

# 1. VISÃO GERAL DA ARQUITETURA

O projeto utiliza uma arquitetura **Modular baseada em Responsabilidades** (Separation of Concerns), bem estruturada para o ecossistema React/Vite.

- **Estrutura de Pastas**: Segue o padrão de mercado com `src/components`, `src/services`, `src/hooks`, `src/stores` e `src/pages`.
- **Organização**: Organizada por **tipo de recurso** (técnico) em vez de features (domínio), o que é aceitável para o tamanho atual, mas pode dificultar a escalabilidade de módulos.
- **Camadas**:
    - **UI**: Components Reais + Tailwind (atômicos e reutilizáveis).
    - **Lógica de Negócio**: Centralizada em custom `hooks` e `stores` (Zustand).
    - **Acesso a Dados**: Camada de `services` abstraindo o Firebase SDK.
    - **Estado Central**: Zustand gerenciando sessões, temas e dados globais.
- **Pontos de Acoplamento**: Observou-se um acoplamento forte entre os componentes de página e os serviços do Firebase através de hooks específicos. Algumas páginas (como `OnboardingPipelinePage`) implementam lógica de filtragem que deveria estar abstraída.

---

# 2. MODELAGEM DO FIRESTORE

## 2.1 Estrutura Atual
O banco é semi-relacional, utilizando coleções raiz e subcoleções para tickets.

- **`users`**: Perfis de acesso, roles e permissões de bases.
- **`clients`**: Documento principal. Contém objeto `onboarding` embutido.
    - **Subcoleção `tickets`**: Tickets relacionados ao cliente.
        - **Subcoleção `timeline`**: Histórico de interações do ticket.
- **`bases`**: Definição de tenants (empresas/projetos).
- **`audit_logs`**: Logs de sistema (Admin only).
- **`import_logs`**: Logs de processamento de planilhas.
- **`client_events`**: Timeline de CRM do cliente (Notas, WhatsApp, etc).

## 2.2 Multi-tenant
A segmentação é feita via **campo `database`** em cada documento de cliente/ticket. 
- **Isolamento**: Implementado via Firestore Rules usando a função `isAllowedBase(resource.data.database)`.
- **Risco de Vazamento**: Existe um risco estrutural em consultas de `collectionGroup` (ex: tickets de todos os clientes). Se o desenvolvedor esquecer de aplicar o filtro `.where('database', '==', currentBase)` no frontend, e as regras não forem 100% estritas em todas as rotas, dados podem vazar visualmente (embora as regras atuais bloqueiem a leitura se o filtro não for exato para usuários não-admin).

## 2.3 Custos
- **Leitura Excessiva**: O `consolidationService.js` baixa **TODOS** os clientes de um tenant para a memória para fazer o matching de importação. Para uma base de 10.000 clientes, isso gera 10k de reads a cada importação.
- **Busca Ineficiente**: O serviço de busca (`clientService.search`) busca fixamente 500 documentos para filtrar via JavaScript (client-side). Isso é um "queima de dinheiro" em escala.

---

# 3. FIRESTORE RULES

As regras atuais estão em um nível **intermediário/avançado**, mas com falhas críticas:

- **Isolamento por Empresa**: Bem implementado para `clients` e `tickets` via helper `isAllowedBase`.
- **Riscos Encontrados**:
    - **`client_events`**: Não possui regras explícitas no arquivo `firestore.rules`. Como o fallback final é `allow read, write: if false`, **a funcionalidade de timeline de CRM está bloqueada em produção para todos os usuários**.
    - **`import_logs`**: Também sem regras explícitas; usuários não conseguem ver o status de suas importações.
    - **`request.auth != null`**: As regras de `settings` dependem apenas de estar logado, permitindo que qualquer usuário de qualquer empresa leia as configurações globais do sistema.
- **Privilege Escalation**: Baixo risco inicial, pois a escrita na coleção `users` (onde ficam os roles) está bloqueada (`allow write: if false`).

---

# 4. AUTENTICAÇÃO E AUTORIZAÇÃO

- **Definição de Roles**: `admin`, `editor`, `user`.
- **Armazenamento**: Firestore (`users/{uid}`).
- **Confiabilidade**: Alta no backend (pelas regras de bloqueio de escrita no profile).
- **Vulnerabilidade Client-side**: O frontend confia no estado do Zustand (`userRole`). Um usuário técnico poderia manipular o estado local para ver botões de admin, mas as **Firestore Rules** impediriam a execução de qualquer ação no banco de dados.
- **Spoofing**: Protegido pelo Firebase Auth.

---

# 5. ESTADO GLOBAL (ZUSTAND)

- **Persistência**: Ativada via middleware `persist`.
- **Segurança**: Corretamente configurada para **NÃO** persistir dados sensíveis (`partialize` salvando apenas tema e configurações de UI).
- **Risco Offline**: A persistência do Firestore está ativada (`enableIndexedDbPersistence`). Isso é bom para resiliência, mas pode causar conflitos de versão em importações concorrentes.

---

# 6. DEPLOY E PIPELINE

- **Fluxo**: Automático via GitHub Actions (`deploy.yml`).
- **Trigger**: Push na branch `main`.
- **Ambiente**: Firebase Hosting.
- **Falha de Segurança**: Observamos caches de 1 ano para arquivos JS/CSS no `firebase.json`. Isso pode causar problemas de "versão travada" no browser do cliente após um deploy de correção urgente.

---

# 7. PERFORMANCE

- **Virtualização**: Implementada com `@tanstack/react-virtual` na lista de clientes (Excelente).
- **Search**: Péssima performance em bases grandes (faz filtro client-side).
- **Re-renders**: Controlados via seletores no Zustand.
- **Dashboard**: O `useOnboardingAggregations` (referenciado em tasks) precisa garantir que use as novas aggregations do Firestore (`count()`) em vez de carregar documentos. No código atual (`OnboardingPipelinePage.jsx`), a listagem já usa paginação, o que é positivo.

---

# 8. ESCALABILIDADE

| Escopo | 10 Empresas | 100 Empresas | 1.000 Empresas |
| :--- | :--- | :--- | :--- |
| **Banco** | OK | OK | OK |
| **Custos** | Baixo | Moderado | **Crítico** (Serviço de Consolidação) |
| **Performance** | OK | OK | **Gargalo** no Matching de Importação |
| **Regras** | OK | OK | OK (Chega ao limite de 20 `get()` calls) |

**O que quebra primeiro?** 
A **Consolidação de Dados**. A estratégia de dar `getDocs` em todos os clientes do tenant para comparar UCs em memória vai travar o browser do operador e estourar a conta do Firebase assim que uma única empresa ultrapassar ~5.000 clientes.

---

# 9. SEGURANÇA

- **Vulnerabilidades**:
    - Falta de validação de schema em `client_events`.
    - Roles salvos localmente no Zustand (risco UI-only).
    - API Keys expostas no `dist` (padrão Firebase, mitigado por restrições de domínio no console).
- **LGPD**: O sistema possui `privacyMode` (mascaramento), mas não existe uma função automatizada para anonimização ou exportação total de dados do titular via UI.

---

# 10. DÍVIDA TÉCNICA OCULTA

1.  **Redundância de UI**: Existem dois seletores de projeto (um no Sidebar e um no Header). Isso gera confusão e múltiplos estados de sincronização.
2.  **Lógica de SLA no Frontend**: O cálculo de horas úteis está no `ticketService.js` (frontend). Se o usuário mudar o relógio do computador, o SLA pode ser burlado visualmente (embora o servidor registre o tempo real).
3.  **Falta de Indexes**: Consultas complexas em `OnboardingPipelinePage` (filtros compostos de status + base + ordenação) falharão em produção sem os índices manuais configurados.

---

# 11. NÍVEL DE MATURIDADE DO PROJETO

- **Arquitetura**: 8/10 (Bem modular, mas lógica de serviço pesada demais no client).
- **Segurança**: 7/10 (Firestore rules sólidas, mas com buracos em coleções novas).
- **Escalabilidade**: 4/10 (O motor de importação/consolidação é um limitador fatal).
- **Organização**: 9/10 (Código limpo e fácil de ler).

**Pronto para produção real?** **NÃO.** 
**Justificativa**: A ausência de regras para `client_events` e o risco de custo/performance na importação de dados cadastrais impedem um lançamento em escala com segurança financeira e técnica.

---

# 12. PRIORIDADES CRÍTICAS

### **P0 – Corrigir imediatamente**
1.  **Atualizar `firestore.rules`**: Incluir regras para `client_events` e `import_logs`. Sem isso, o CRM está "mudo".
2.  **Refatorar `consolidationService.js`**: Remover o `getDocs` global do matching de importação. Deve-se fazer queries pontuais por UC ou usar um processo server-side (Cloud Functions).

### **P1 – Alta prioridade**
1.  **Server-side Search**: Migrar o `search` de client-side para queries reais do Firestore ou serviço de indexação (Algolia).
2.  **Sincronizar seletores**: Unificar o `ProjectSelector` para evitar inconsistência de estado.

### **P2 – Evolução estratégica**
1.  **Cloud Functions**: Mover a lógica de SLA e Consolidação para o backend.
2.  **Audit Logs completos**: Garantir que toda atualização de campo crítico gere um log na coleção `audit_logs`.
