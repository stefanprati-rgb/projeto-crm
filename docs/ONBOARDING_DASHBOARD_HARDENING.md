# Hardening do Dashboard de Onboarding (V2 - Escalabilidade)

Este documento detalha o processo de endurecimento e escalabilidade do Dashboard de Onboarding, visando suportar dezenas de milhares de registros sem degradação de performance ou aumento linear de custos.

---

## 🛡️ Motivação: Por que o Hardening?

O Dashboard original dependia de um **listener global** que baixava todos os documentos de clientes da base atual para o navegador (até 500 registros) para então calcular totais e alertas em memória.

**Problemas da abordagem anterior:**
1.  **Limite de 500 Records:** Se a base tivesse 2000 clientes em onboarding, 1500 seriam ignorados nas métricas.
2.  **Custo de Leitura:** Cada carregamento do dashboard consumia leituras de documentos inteiros.
3.  **Processamento Client-Side:** O navegador ficava pesado ao iterar grandes listas para gerar gráficos de funil e alertas.

---

## 🏗️ Nova Arquitetura: Aggregation-First

A nova implementação utiliza as APIs de agregação nativas do Firestore (`getCountFromServer`), garantindo que o processamento ocorra no servidor do Google e retorne apenas o número inteiro desejado.

### 1. Hook `useOnboardingAggregations`
Localizado em `src/hooks/useOnboardingAggregations.js`, este hook substitui o processamento em memória por queries otimizadas.

**Principais Mudanças:**
*   **KPIs de Status:** 5 queries paralelas de `count()` filtradas por `pipelineStatus`.
*   **Alertas de SLA:** Queries de `count()` com filtros temporais (`updatedAt < 30/60 dias`).
*   **Previsão de Ativação (Time-Based Aging):** Foram implementadas 6 queries de contagem, uma para cada mês do semestre atual, baseadas no campo `compensationForecastDate`.

### 2. Performance
*   **Zero Documentos Lidos:** As agregações no Firestore custam apenas uma pequena fração do custo de leitura de documento (e em muitos casos são processadas via índice).
*   **Isolamento de Tenancy:** Todas as queries de agregação incluem obrigatoriamente o filtro `where('database', '==', currentBase)`.
*   **Não reativo por padrão:** Diferente do `onSnapshot`, o dashboard agora usa um padrão de **on-demand refresh**, reduzindo o volume de queries automáticas e dando controle ao usuário via botão de "Refresh".

---

## ⚠️ Requisitos de Dados (Data Integrity)

Para que o dashboard funcione corretamente com agregações server-side, os dados devem estar normalizados:
1.  **Timestamps/Strings:** O campo `onboarding.updatedAt` e `onboarding.compensationForecastDate` devem seguir o formato ISO para comparação correta de strings no Firestore.
2.  **Campos Existentes:** Diferente do JS, o Firestore não conta documentos onde o campo da query está ausente (`undefined`). É recomendado garantir um valor padrão (`waiting_apportionment`) na criação do cliente.

---

## 🚀 Ganhos Obtidos

| Métrica | Antes (Memória) | Depois (Hardening) |
| :--- | :--- | :--- |
| **Limite de Registros** | 500 documentos | **Ilimitado** |
| **Consumo de Banda** | Alto (Documentos Full) | **Mínimo** (Contadores) |
| **Tempo de UI Bloqueada** | Proporcional ao volume | **Constante** (Server-side) |
| **Alertas** | Calculados no Client | **Calculados no Server** |

---

### Próximos Passos Sugeridos
*   **Firebase Functions:** Se houver necessidade de somas de valores (R$) e não apenas contagem, considerar a implementação de `onWrite` triggers para atualizar um documento de `totals` consolidado em tempo real.
