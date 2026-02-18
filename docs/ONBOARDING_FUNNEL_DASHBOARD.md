# Documentação: Dashboard de Funil de Onboarding

Este documento descreve as funcionalidades e a lógica de negócio do Dashboard Executivo de Onboarding do Hube CRM.

---

## 1️⃣ Visão Geral

O Dashboard de Onboarding é uma ferramenta de gestão estratégica que permite visualizar o fluxo de entrada e ativação de novos clientes. Ele transforma o estado operacional da esteira em indicadores de desempenho (KPIs) e gráficos de tendência.

---

## 2️⃣ KPIs (Indicadores Chave)

O dashboard exibe 5 cartões de estatísticas principais correspondentes às fases do pipeline:

1.  **Aguardando Rateio:** Volume bruto de novos contratos parados no início da esteira.
2.  **Enviado para Rateio:** Volume que já saiu do comercial e está sob análise técnica.
3.  **Rateio Concluído:** Clientes prontos para ativação na distribuidora.
4.  **Em Compensação:** Clientes que já possuem o benefício ativo, aguardando o primeiro ciclo financeiro.
5.  **Faturados:** Clientes que completaram o ciclo de onboarding com sucesso.

---

## 3️⃣ Inteligência Operacional (Alertas)

O sistema detecta automaticamente gargalos baseados em tempo:
*   **Gargalo no Rateio:** Exibe alerta vermelho se houver clientes em `waiting_apportionment` por mais de **30 dias**.
*   **Atraso na Compensação:** Exibe alerta âmbar se houver clientes em `waiting_compensation` por mais de **60 dias** (possível atraso na distribuidora ou falha de monitoramento).

---

## 4️⃣ Componentes de Visualização

### Funil de Onboarding
Um gráfico de barras horizontais que mostra a taxa de retenção em cada fase. Ideal para identificar "buracos" no processo onde os clientes costumam ficar presos.

### Previsão de Ativações
Gráfico de barras que projeta o volume de Unidades Consumidoras que entrarão em faturamento nos próximos 6 meses, baseado no campo `compensationForecastDate`.

---

## 5️⃣ Implementação Técnica

*   **Hook `useOnboardingMetrics`:** Centraliza o processamento dos dados em memória (aproveitando o estado reativo do Zustand).
*   **Isolamento:** Respeita o filtro de `database` (tenant) do usuário logado.
*   **Performance:** Utiliza `useMemo` para garantir que os cálculos complexos de data e agrupamento ocorram apenas quando a lista de clientes mudar.

---

## 🚀 Próximos Passos (Roadmap)

*   **Taxa de Conversão Mensal:** Gráfico comparando quantos clientes entraram vs quantos faturaram no mês.
*   **Métricas por Usina:** Filtrar o onboarding por projeto específico de geração.
*   **Exportação PDF:** Botão para gerar relatório executivo para apresentação em reuniões de acompanhamento.
