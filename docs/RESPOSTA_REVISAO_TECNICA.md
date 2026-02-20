# Auditoria Técnica Profunda: Módulo de Onboarding & Segurança

**Status**: Versão 1.0 (Auditado em 2026-02-18)  
**Escopo**: Módulo de Onboarding, Consolidação de Dados e Segurança de Tenancy.  
**Classificação Geral**: **Beta Operacional (Produção Restrita)**

---

## 1️⃣ Fonte de Verdade do Onboarding

*   **O objeto `onboarding` é sempre atualizado pelo consolidator ou pode ser editado manualmente?**  
    O objeto é atualizado automaticamente pelo `consolidationService.js` no ato da importação. No entanto, existe a função `clientService.updateOnboarding` que permite a edição via UI, o que configura um modelo de **escrita concorrente sem controle de prioridade**.
*   **Existe flag `manualOverride`?**  
    **Não.** Qualquer nova importação de planilha de Base (Clients) sobrescreve os campos de onboarding atuais, ignorando ajustes manuais feitos pelo time de CS.
*   **Importações sobrescrevem alterações humanas?**  
    **Sim.** A lógica no `consolidationService` faz um spread do objeto existente, mas sobrescreve campos como `sentToApportionment`, `apportionmentRegistered`, `compensationForecastDate` e `hasBeenInvoiced` se os campos estiverem presentes na planilha.
*   **Há versionamento ou histórico de mudanças?**  
    **Não.** Embora a especificação (`ONBOARDING_PIPELINE_SPEC.md`) mencione um array `history`, o código atual do `consolidationService.js` não implementa essa gravação, resultando em perda de rastro de alterações.

**Classificação de Risco de Divergência:** 🚨 **Alto**

---

## 2️⃣ Chave UC — Normalização & Unicidade

*   **Qual função oficial de normalização é usada?**  
    `normalization.normalizeUC(uc)` em `src/utils/normalization.js`. Ela remove espaços, barras, traços, pontos e zeros à esquerda.
*   **A UC é persistida já normalizada?**  
    **Sim**, no campo `uc_normalized`.
*   **Existe índice único `database + UC`?**  
    **Não.** O Firestore não suporta restrição de unicidade nativa para campos. A unicidade depende da lógica de importação que usa o `clientsMap` para match, mas não impede a criação duplicada via UI ou bugs de serviço.
*   **Como tratam duplicatas existentes?**  
    O motor de consolidação carrega todos os clientes em um `Map`. Se houver dois registros com a mesma UC normalizada no banco, o último registro processado pelo `Map.set()` "vencerá" em memória, podendo causar atualizações no registro errado.
*   **Há validação no write ou só na importação?**  
    Apenas na importação. O `clientService.create` não valida se a UC já existe.

**Classificação de Risco de Colisão de Dados:** ⚠️ **Médio**

---

## 3️⃣ Pipeline Status — Derivação

*   **`pipelineStatus` é persistido ou calculado?**  
    **Persistido.** É calculado no momento da gravação (`calculatePipelineStatus`) e salvo no documento.
*   **Existe risco de inconsistência com campos base?**  
    **Sim.** Se um desenvolvedor atualizar `hasBeenInvoiced: true` via `updateDoc` comum sem chamar o serviço de consolidação ou o cálculo de status, o `pipelineStatus` ficará desatualizado em relação ao dado factual.
*   **O consolidator recalcula sempre?**  
    Sim, o motor invoca o cálculo em cada linha processada.
*   **Há testes cobrindo o algoritmo?**  
    **Não.** Não foram encontrados testes unitários para a lógica de `calculatePipelineStatus`.

**Classificar modelo:** 🏗️ **Híbrido** (Calculado no write, persistido no read).

---

## 4️⃣ Segurança do Schema Onboarding

*   **Tipagem de campos?**  
    Parcial. As Rules validam que `onboarding` é um `map`.
*   **Campos obrigatórios?**  
    Não. As Rules não exigem subcampos.
*   **Bloqueio de campos extras?**  
    Não. O mapa aceita qualquer chave.
*   **Bloqueio de alteração de `hasBeenInvoiced`?**  
    **Não.** Qualquer usuário com role `editor` pode alterar este campo via `update`, o que é um risco financeiro.
*   **Bloqueio de alteração de `database` (Tenant)?**  
    **Sim.** As Rules bloqueiam a alteração da chave `database` após a criação.

**Classificação de Robustez:** 🟡 **Média**

---

## 5️⃣ Consolidação — Idempotência & Integridade

*   **O motor compara antes de escrever?**  
    **Não.** Ele prepara o `batch.update` ou `batch.set` incondicionalmente para cada item da planilha, gerando writes desnecessários se o dado for idêntico.
*   **Evita writes desnecessários?**  
    Não.
*   **Processa em batch?**  
    Sim, lotes de 400 operações (dentro do limite de 500 do Firestore).
*   **Há retry seguro?**  
    Não há lógica de retry exponencial implementada em `consolidationService.js`.
*   **Existe rollback de importação?**  
    Não. Se um batch de 400 falhar no meio de uma planilha de 1000, os primeiros 400 estarão gravados e o restante não.

**Classificação de Risco de Corrupção de Dados:** ⚠️ **Médio**

---

## 6️⃣ Importação — Isolamento Multi-Tenant

*   **Import valida `database` antes de atualizar?**  
    Sim. O motor busca apenas clientes onde `database == targetDatabase`.
*   **Pode sobrescrever outra base?**  
    Teoricamente não, pois se uma UC de outra base vier na planilha, ela não será encontrada no `clientsMap` carregado e o motor tentará criar um novo cliente na base *atual* em vez de atualizar o da outra base.
*   **Logs têm tenant?**  
    Sim, registrados na coleção `import_logs`.
*   **Existe teste simulando erro de base?**  
    Não nos testes automatizados encontrados.

**Classificação de Isolamento:** ✅ **Seguro**

---

## 7️⃣ Queries da Esteira

*   **Usa filtro `database`?** Sim.
*   **Usa índice composto?** Sim (`onboarding.pipelineStatus` + `onboarding.updatedAt`).
*   **Usa paginação (`limit + startAfter`)?** Sim.
*   **Carrega onboarding parcial ou documento inteiro?** Documento inteiro.

**Estimação de Custo/Performance:**
| Volume | Custo de Read | UX / Latência |
| :--- | :--- | :--- |
| **1k UCs** | Baixo | Fluído |
| **10k UCs** | Médio | Aceitável |
| **100k UCs** | **Alto** | **Pobre** (Limite de queries e custo de reads) |

---

## 8️⃣ Busca por UC

*   **Usa equality ou prefix search?**  
    ERRO TÉCNICO: A busca atual em `getOnboardingPipeline` é um `filter` no array de resultados da página (limitado a 20). **Não encontra registros fora da página atual.**
*   **Indexada?** Não para busca parcial.
*   **Debounce?** Sim (300ms).
*   **Pode gerar full scan?** Se migrado para client-side total, sim. Atualmente é ineficaz.

**Classificação de Risco de Custo:** 🧨 **Crítico** (Não por custo de Firestore, mas por falha operacional de busca).

---

## 9️⃣ Dashboard de Funil

*   **Métricas são client-side?**  
    Sim, calculadas via `useOnboardingMetrics`.
*   **Usa agregações (`count()`)?**  
    **Não.** Itera sobre o estado global `clients`.
*   **Lê todos documentos?**  
    **NÃO.** Lê apenas o que o listener global carregou, que está limitado a **500 documentos** (`clientService.js` line 153).
*   **Alertas rodam onde?** Client-side.

**Classificação de Eficiência Analítica:** ❌ **Incorreto para Escala** (> 500 docs).

---

## 🔐 10️⃣ Multi-Tenancy End-to-End

*   **Um usuário pode ler outra base?** Não (Rules).
*   **Pode escrever?** Não (Rules).
*   **Pode importar?** Sim, se tiver role `editor` e acesso à base.
*   **Pode usar collectionGroup cross-base?** Bloqueado por Rules se não incluir filtro de base.

**Classificação Final:** ✅ **Seguro** (Fundações sólidas via Rules).

---

## 11️⃣ Testes Automatizados

*   **Cobertura:**
    *   Rules tenancy: **Alta**
    *   Rules schema: **Média** (Status validados, campos não)
    *   Importação: **Zero**
    *   Consolidação: **Zero**
    *   Derivação pipeline: **Zero**

**Classificação de Cobertura:** 🟡 **Baixa**

---

## 12️⃣ Logs & Auditoria

*   **Alterações onboarding são auditadas?** Apenas importações geram `import_logs`. Alterações manuais não possuem trilha dedicada além do campo `updatedAt`.
*   **Importações rastreáveis por UC?** Sim, via `import_logs.errors`.
*   **Há correlação usuário + tenant?** Sim.
*   **Existe trilha imutável?** Sim, em `audit_logs` (Rules impedem update/delete), mas nem tudo é enviado para lá.

---

# MATRIZ DE RISCO

| Área | Vulnerabilidade | Impacto | Probabilidade | Severidade | Mitigação |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Performance | Dashboard limitado a 500 registros | Alto | 100% | **Crítica** | Implementar `count()` aggregations ou Dashboard Function. |
| Operação | Busca não localiza UCs fora da página | Alto | 100% | **Crítica** | Implementar query de busca real no Firestore. |
| Integridade | Sobrescrita de dados humanos | Médio | Alta | **Alta** | Implementar flag `manualOverride` e historização. |
| Finanças | Alteração livre do campo `invoiced` | Alto | Baixa | **Alta** | Bloquear campo `hasBeenInvoiced` em rules p/ usuários comuns. |
| Dados | UC Duplicada (Colisão) | Médio | Média | **Média** | Validar existência da UC no `create`. |

---

# DÉBITOS TÉCNICOS ENCONTRADOS

1.  **Arquitetural**: Falta de Cloud Functions para derivação de status (Status desincroniza se o Front falhar).
2.  **Performance**: Cálculo de KPI em memória no browser (Não escala > 1000 clientes).
3.  **Dados**: Ausência de campo `history` no objeto `onboarding` conforme especificado.
4.  **Observabilidade**: Erros de importação não detalham *qual* dado estava inválido na planilha.

---

# QUICK WINS

1.  **Fix Busca Pipeline**: Alterar `searchTerm` para disparar uma query `where('uc', '==', term)` no Firestore.
2.  **Hardening Rules**: Proibir atualização de `onboarding.hasBeenInvoiced` para roles não-admin.
3.  **Indempotência**: Adicionar check JSON stringify em `_runConsolidation` antes do `batch.update`.

---

# ROADMAP DE HARDENING

### P0 — Crítico imediato
*   Corrigir busca textual na esteira de onboarding.
*   Implementar `count()` ou Cloud Function para KPIs do dashboard.
*   Corrigir limite de 500 registros no listener global que "cega" o dashboard.

### P1 — Estrutural curto prazo
*   Implementar Histórico de Alterações (`onboarding.history`).
*   Adicionar flag `manualOverride` para proteger dados editados por CS.
*   Implementar Soft Delete na base de clientes.

### P2 — Escala futura
*   Migrar lógica de consolidação para Firebase Functions (evita timeout do browser em planilhas gigantes).
*   Integrar Algolia para busca prefix/fuzzy.

---

# AVALIAÇÃO FINAL DO MÓDULO

Classificação: **Beta operacional**

**Justificativa**: O sistema possui regras de isolamento multi-tenant extremamente robustas (fundações nota 10), mas falha na camada de escala e lógica de aplicação. A busca "quebrada" e o Dashboard limitado a 500 registros impedem a escala para grandes operações de energia. O motor de consolidação é funcional, mas perigoso por não respeitar alterações manuais.

**Assinado**,
*Antigravity Auditoria de Sistemas*
