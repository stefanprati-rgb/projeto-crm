# Documentação da Interface: Esteira de Onboarding

Este documento descreve as funcionalidades e o design da tela operacional da Esteira de Onboarding do Hube CRM.

---

## 1️⃣ Visão Geral

A tela de Esteira de Onboarding foi projetada para dar visibilidade total ao ciclo de vida de ativação do cliente. Ela consolida informações de cadastro, rateio e faturamento em uma única visão tabular altamente filtrável.

---

## 2️⃣ Funcionalidades Implementadas

### Sistema de Filtros Inteligentes
*   **Busca por UC:** Filtro em tempo real (com debounce de 300ms) para localizar rapidamente uma Unidade Consumidora específica.
*   **Status do Pipeline:** Filtro multi-seleção que permite focar em gargalos específicos (ex: ver apenas quem está "Aguardando Rateio").
*   **Competência de Compensação:** Filtro por mês/ano para gerenciar a volumetria de ativações futuras.

### Monitoramento Visual (Badges)
As cores foram mapeadas para facilitar a identificação rápida do estágio:
*   ⚪ **Cinza (waiting_apportionment):** Estágio inicial, aguardando dados operacionais.
*   🔵 **Azul (sent_to_apportionment):** Já enviado para o time técnico.
*   🟣 **Roxo (apportionment_done):** Rateio configurado com sucesso.
*   🟡 **Amarelo (waiting_compensation):** Aguardando o ciclo da distribuidora.
*   🟢 **Verde (invoiced):** Processo concluído com sucesso.

### Dados Exibidos
*   **UC & Cliente:** Identificação primária.
*   **Status:** Badge colorido com o estado atual.
*   **Percentual de Rateio:** Visualização rápida da cota alocada.
*   **Previsão de Compensação:** Data esperada para o início do benefício.
*   **Faturamento:** Indicador visual (Check/X) se já houve a primeira fatura.

---

## 3️⃣ Performance e UX

*   **Paginação Server-side:** Utiliza `limit` e `startAfter` do Firestore para garantir fluidez mesmo com milhares de clientes.
*   **Isolamento Multi-tenant:** Todas as queries são forçadas pelo identificador da base (`database`), garantindo privacidade total dos dados.
*   **Skeleton Loading:** Feedback visual durante o carregamento dos dados para reduzir a percepção de latência.

---

## 4️⃣ Ações Rápidas (P1)

A interface permite atualizações rápidas para ajustes manuais:
*   Inclusão de Previsão de Compensação.
*   Alteração manual de status para fins de correção.

---

## 5️⃣ Queries Utilizadas

```javascript
// Exemplo de query para a esteira
query(
  collection(db, 'clients'),
  where('database', '==', currentBase),
  where('onboarding.pipelineStatus', 'in', selectedStatuses),
  orderBy('onboarding.updatedAt', 'desc'),
  limit(20)
);
```
