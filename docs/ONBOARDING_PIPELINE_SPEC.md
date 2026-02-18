# Especificação: Módulo de Onboarding e Esteira do Cliente

Este documento especifica o módulo de Onboarding, permitindo o acompanhamento do ciclo de vida inicial do cliente desde o cadastro até o primeiro faturamento.

---

## 1️⃣ Visão Geral do Módulo

O objetivo é fornecer uma visão clara e objetiva para o time de Customer Success (CS) sobre o "estágio" de ativação de cada cliente ou Unidade Consumidora (UC). Isso reduz a fricção entre vendas, operacional de rateio e faturamento.

---

## 2️⃣ Modelagem de Dados

Os campos de onboarding serão armazenados dentro do documento do cliente na coleção `clients`, em um objeto aninhado chamado `onboarding`.

### Schema do Objeto `onboarding`
```json
{
  "pipelineStatus": "new | waiting_apportionment | sent_to_apportionment | apportionment_done | waiting_compensation | invoiced",
  "isNewClient": true,
  "sentToApportionment": false,
  "apportionmentRegistered": false,
  "apportionmentRegisteredAt": "ISO8601",
  "compensationForecastDate": "ISO8601",
  "hasBeenInvoiced": false,
  "firstInvoiceAt": "ISO8601",
  "updatedAt": "ISO8601",
  "updatedBy": "uid",
  "history": [
    {
      "status": "string",
      "changedAt": "ISO8601",
      "changedBy": "uid"
    }
  ]
}
```

---

## 3️⃣ Pipeline Status: Estados e Regras

Abaixo, a definição de cada estágio oficial da esteira:

| Status | Descrição | Regra de Entrada |
| :--- | :--- | :--- |
| `new` | Cliente recém cadastrado. | Cadastro inicial do cliente. |
| `waiting_apportionment` | Aguardando envio para rateio. | Documentação técnica validada. |
| `sent_to_apportionment` | Enviado para o time de rateio. | Ação manual: "Enviar para Rateio". |
| `apportionment_done` | Rateio cadastrado no sistema. | Ativação do campo `apportionmentRegistered`. |
| `waiting_compensation` | Aguardando data de previsão. | Quando há `compensationForecastDate` definida. |
| `invoiced` | Processo concluído. | Quando a primeira fatura é gerada (`hasBeenInvoiced`). |

---

## 4️⃣ Visão Operacional (Interface)

A tela de "Esteira de Onboarding" deve permitir a gestão rápida via filtros:

### Filtros Obrigatórios
*   **Buscar por UC/Cliente:** Campo de busca textual (Search).
*   **Status do Pipeline:** Dropdown multi-seleção.
*   **Base (Database):** Filtro multi-tenant obrigatório.
*   **Previsão de Compensação:** Filtro por período (Mês/Ano).

### Colunas da Tabela
| UC | Cliente | Status Atual | Previsão Comp. | Rateio? | Última Alt. |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 12345/01 | João Silva | `sent_to_apportionment` | 10/05/2026 | ❌ Não | Há 2 dias |
| 56789/02 | Empresa LTDA | `apportionment_done` | 15/04/2026 | ✅ Sim | Há 1 hora |

---

## 5️⃣ Queries Firestore (Com Tenancy)

As queries devem sempre incluir o filtro de `database` para garantir o isolamento.

```javascript
// Ex: Clientes em fase de rateio
query(
  collection(db, "clients"),
  where("database", "==", "EGS"),
  where("onboarding.pipelineStatus", "==", "sent_to_apportionment"),
  orderBy("onboarding.updatedAt", "asc")
);

// Ex: Previsão de compensação para o mês atual
query(
  collection(db, "clients"),
  where("database", "==", "GIRASSOL"),
  where("onboarding.compensationForecastDate", ">=", "2026-05-01"),
  where("onboarding.compensationForecastDate", "<=", "2026-05-31")
);
```

---

## 6️⃣ Automações e Triggers

As transições de status devem ser preferencialmente automáticas via **Cloud Functions**:

*   **Trigger: Update Apportionment:** Quando `apportionmentRegistered` mudar de `false` para `true`, o `pipelineStatus` deve mudar para `apportionment_done` automaticamente.
*   **Trigger: First Invoice:** Quando um documento for criado em `/invoices` para um cliente específico pela primeira vez, atualizar `hasBeenInvoiced: true` e status para `invoiced`.
*   **Trigger: SLA de Onboarding:** Se um cliente ficar mais de 5 dias em `waiting_apportionment`, emitir um log de `WARN` no painel operacional.

---

## 7️⃣ Métricas de Eficiência (Mód. Relatórios)

O módulo de relatórios deve consumir esses campos para calcular:

*   **Time-to-Apportionment:** Tempo médio entre `new` e `sent_to_apportionment`.
*   **Onboarding Velocity:** Dias totais de `new` até `invoiced`.
*   **Gargalo do Pipeline:** Identificar em qual estágio os clientes passam mais tempo parados.

---

## 🛠️ Roadmap de Implementação

### Fase 0: Core & Backend (P0)
*   [ ] Refatorar o schema da coleção `clients` para incluir o objeto `onboarding`.
*   [ ] Criar o script de migração (Backfill) para clientes existentes (marcar como `new` ou `invoiced`).
*   [ ] Garantir que o `audit_logs` registre mudanças no objeto de onboarding.

### Fase 1: UI do Pipeline (P1)
*   [ ] Desenvolver a página `OnboardingPage.jsx`.
*   [ ] Implementar filtros de busca por UC e Status.
*   [ ] Adicionar modal de atualização rápida de status (Quick Edit).

### Fase 2: Inteligência & Alertas (P2)
*   [ ] Implementar Cloud Functions para automação de troca de status.
*   [ ] Criar gráficos de "Funil de Onboarding" no Dashboard.
*   [ ] Configurar alertas de atraso na esteira.
