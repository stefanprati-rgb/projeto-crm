# Motor de Consolidação de Dados: Onboarding

Este documento descreve a arquitetura e as regras do motor de consolidação que processa as três fontes de dados operacionais (Cadastro, Rateio e Faturamento) para manter a esteira de onboarding atualizada.

---

## 1️⃣ Modelo de Dados e Chave de Match

A **UC (Unidade Consumidora)** é a chave primária de match entre todos os sistemas. 

### Regras de Normalização da UC
Para garantir o match preciso, todas as UCs devem passar pelo processo de normalização antes da comparação:
1.  Remover espaços em branco.
2.  Remover caracteres não numéricos (opcional, dependendo da concessionária).
3.  Remover zeros à esquerda (padronização).
4.  Remover barras e traços.

---

## 2️⃣ Fontes de Dados e Impactos

### Fonte A: Base de Clientes (Cadastral)
*   **Ação:** Upsert de clientes.
*   **Regra:** Se a UC não existir, cria o cliente com status `new`.
*   **Campo Chave:** `sentToApportionment`. Marcado como `true` se houver uma "Usina Vinculada" na planilha.

### Fonte B: Planilha de Rateio (Operacional)
*   **Ação:** Enriquecimento técnica.
*   **Regra:** Atualiza campos de percentual de rateio e previsão de compensação.
*   **Impacto:** Define `apportionmentRegistered: true` e preenche `compensationForecastDate`.

### Fonte C: Planilha de Faturamento (Financeira)
*   **Ação:** Conclusão da esteira.
*   **Regra:** Identifica o primeiro faturamento real daquela UC.
*   **Impacto:** Define `hasBeenInvoiced: true` e registra `firstInvoiceAt`.

---

## 3️⃣ Algoritmo de Cálculo de Status (Pipeline)

O status é derivado do estado dos campos, seguindo a precedência abaixo:

```javascript
function calculateStatus(onboarding) {
  if (onboarding.hasBeenInvoiced) return "invoiced";
  if (onboarding.compensationForecastDate) return "waiting_compensation";
  if (onboarding.apportionmentRegistered) return "apportionment_done";
  if (onboarding.sentToApportionment) return "sent_to_apportionment";
  return "waiting_apportionment";
}
```

---

## 4️⃣ Lógica de Prioridade e Conflitos

A planilha de faturamento tem **soberania** sobre o status final. Se um cliente foi faturado, ele deve ser marcado como `invoiced` mesmo que a planilha de rateio esteja desatualizada.

---

## 5️⃣ Arquitetura do Processador

O processador opera em três etapas:

1.  **Parser:** Converte CSV/Excel em objetos JSON padronizados.
2.  **Normalizer:** Limpa as chaves (UC) e formata datas.
3.  **Consolidator:** 
    *   Busca clientes existentes no `database` (tenant) atual.
    *   Realiza o match via UC.
    *   Prepara o `writeBatch` do Firestore.
    *   Gera logs de erro para UCs não encontradas nas planilhas de rateio/faturamento.

---

## 6️⃣ Logs de Importação (`import_logs`)

Cada operação gera um log detalhado para auditoria:
*   `type`: `clients | apportionment | invoicing`
*   `status`: `success | partial_success | failure`
*   `stats`: `{ total, updated, created, errors }`
*   `errors`: Array de objetos `{ uc, reason }`

---

## 7️⃣ Performance e Segurança

*   **Batches:** Limite de 500 operações por batch do Firestore.
*   **Isolamento:** O processador deve receber o `currentBase` (tenant) e nunca permitir que uma planilha de um projeto altere dados de outro.
*   **Auditoria:** Todo campo alterado pelo motor deve registrar `updatedBy: "system_import"`.

---

## 🛠️ Roadmap de Implementação Code-First

1.  **`consolidationService.js`:** Lógica central de match e update.
2.  **`importParsers.js`:** Mapeamento de headers para cada fonte.
3.  **`normalization.js`:** Utilitários de limpeza de UC e datas.
