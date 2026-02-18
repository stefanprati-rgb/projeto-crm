# Arquitetura de Observabilidade: Hube CRM

Este documento define a estratégia, ferramentas e processos para monitoramento operacional, segurança e auditoria do Hube CRM. O objetivo é garantir visibilidade total sobre a saúde do sistema, custos do Firebase e isolamento multi-tenant.

---

## 1️⃣ Estrutura de Logging

O sistema deve adotar um padrão de logs estruturados (JSON) para facilitar a indexação e análise via Cloud Logging.

### Níveis de Log
*   **INFO:** Fluxos normais (Login, Criação de Cliente).
*   **WARN:** Anomalias não fatais (Retry de conexão, Latência acima do SLA).
*   **ERROR:** Falhas de sistema (Crash no frontend, Falha de escrita no DB).
*   **SECURITY:** Violação de regras, acesso negado, tentativas de bypass.

### Campos Obrigatórios (Payload)
```json
{
  "timestamp": "ISO8601",
  "level": "LEVEL",
  "userId": "firebase_uid",
  "userEmail": "string",
  "tenantId": "database_name",
  "action": "string",
  "context": "string (ex: TicketModal)",
  "traceId": "unique_id",
  "details": {}
}
```

---

## 2️⃣ Audit Trail (Trilha de Auditoria)

Eventos críticos que **devem** ser persistidos na coleção `audit_logs` no Firestore de forma imutável (append-only).

| Evento | O que logar | Gatilho |
| :--- | :--- | :--- |
| **Auth** | Login bem/mal sucedido | `useAuth` hook |
| **Clientes** | CRUD completo (old vs new value) | `clientService` |
| **Tickets** | Mudança de status ou prioridade | `ticketService` |
| **Segurança** | Tentativa de acesso a base não autorizada | `Security Rules` (via Cloud Logging) |
| **Sistema** | Importação de planilha Excel/CSV | `batchImport` |

---

## 3️⃣ Monitoramento de Tenancy e Segurança

### Detecção de Vazamento Potential
*   **Queries Negadas:** Monitorar o erro `PERMISSION_DENIED` do Firestore. Um pico neste erro indica tentativa de brute-force ou bug na propagação do `tenantId`.
*   **Acesso Cross-Tenant:** Alerta imediato se um `userId` associado à base A tentar realizar query na base B.

### Firebase Security Rules Monitoring
*   Integração com o **Firebase Extensions: Firestore Security Rules Auditor** para reportar tentativas de escrita que falharam na validação de schema.

---

## 4️⃣ Monitoramento de SLA (Business Metrics)

Métricas-chave extraídas automaticamente dos dados de tickets:

*   **Compliance Rate:** % de tickets resolvidos dentro do prazo (SLA).
*   **Overdue Rate:** % de tickets que entraram em atraso nas últimas 24h.
*   **MTTR (Mean Time to Resolution):** Tempo médio desde a abertura até o status `resolved`.
*   **Distribuição por Categoria:** Identificar gargalos operacionais específicos.

---

## 5️⃣ Stack de Ferramentas Sugerida

| Ferramenta | Função | Motivo |
| :--- | :--- | :--- |
| **Firebase Cloud Logging** | Logs de Sistema | Integrado nativamente ao Firestore e Cloud Functions. |
| **Sentry** | Rastreamento de Erros | Captura de exceptions no frontend React em tempo real. |
| **Google Analytics 4** | Comportamento | Medir conversão e uso de funcionalidades (ex: Importação). |
| **BigQuery (Export)** | Long-term BI | Análise histórica de tickets e faturas (Custo p/ BigQuery < Firestore). |
| **Slack / Email Alerts** | Notificações | Alertas de erro crítico e quebra de SLA. |

---

## 6️⃣ Dashboards Administrativos

1.  **Engenharia:** Taxa de erro, latência de query, consumo de cota Firebase (Read/Write).
2.  **Segurança:** Tentativas de acesso negado, logs de auditoria de admins.
3.  **Customer Success:** Dashboard de SLA, volume de tickets por base, clientes inativos.

---

## 7️⃣ Estratégia de Alertas

*   **P0 (Crítico):** Falhas massivas de autenticação ou erro 5xx constante. (Notificação via PagerDuty/Slack).
*   **P1 (Sério):** Compliance de SLA abaixo de 80%. (E-mail para gestores de CS).
*   **P2 (Informativo):** Pico de importação de dados por um tenant específico. (Log INFO).

---

## 🛠️ Roadmap de Observabilidade

### Fase 1: Visibilidade Crítica (P0)
*   [ ] Implementar o serviço de `Logger` no frontend injetando `tenantId`.
*   [ ] Configurar Sentry para captura de erros fatais.
*   [ ] Ativar o log de auditoria simplificado para CRUD de Clientes.

### Fase 2: Monitoramento de Negócio (P1)
*   [ ] Implementar calculador de métricas de SLA server-side (ou via Cloud Functions).
*   [ ] Integrar BigQuery para armazenamento histórico (faturas e furos de SLA).
*   [ ] Criar dashboards de CS no Google Looker Studio.

### Fase 3: Hardening e IA (P2)
*   [ ] Implementar detecção de anomalias (picos de leitura atípicos por tenant).
*   [ ] Configurar Auditoria Automática de Conformidade (LGPD logs).
*   [ ] Exportação de logs para SIEM externo se necessário.
