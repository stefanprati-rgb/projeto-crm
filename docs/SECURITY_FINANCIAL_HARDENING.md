# Hardening de Segurança Financeira no Onboarding

Este documento detalha o reforço de segurança aplicado aos campos financeiros críticos do módulo de Onboarding no Firestore.

## 🛡️ Objetivo

Proteger a integridade dos dados financeiros, garantindo que apenas administradores ou sistemas autorizados possam alterar o status de faturamento e datas de primeira fatura.

## 🏗️ Implementação: Firestore Rules

Foram adicionados helpers e regras estritas na coleção `clients` para bloquear atualizações não autorizadas.

### Novos Helpers de Segurança

```javascript
function isSystem() {
  return isAuth() && request.auth.token.get('system', false) == true;
}

function canUpdateFinancialFields() {
  return isAdmin() || isSystem();
}
```

### Regras de Proteção

A regra de `update` na coleção `clients` agora verifica se os campos protegidos estão sendo alterados:

- `onboarding.hasBeenInvoiced`
- `onboarding.firstInvoiceAt`

Se houver tentativa de alteração nestes campos, o Firestore exige que o usuário tenha a role `admin` ou que o token de autenticação possua a claim corporativa `system: true`.

```javascript
// Trecho das Regras (firestore.rules)
allow update: if isEditor() &&
  isAllowedBase(resource.data.database) &&
  // ... validações de auditoria ...
  (
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['onboarding']) ||
    !request.resource.data.onboarding.diff(resource.data.get('onboarding', {})).affectedKeys().hasAny(['hasBeenInvoiced', 'firstInvoiceAt']) ||
    canUpdateFinancialFields()
  ) &&
  (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['onboarding']) || validOnboarding());
```

## 🧪 Cenários de Teste (Vitest)

Arquivo de testes: `tests/financial_hardening.test.js`

| Cenário | Resultado Esperado | Motivo |
| :--- | :--- | :--- |
| **Editor** tenta marcar como faturado | ❌ **FAIL** | Editor não possui permissão para campos protegidos. |
| **Editor** altera `pipelineStatus` | ✅ **SUCCESS** | Outros campos do onboarding permanecem editáveis. |
| **Admin** marca como faturado | ✅ **SUCCESS** | Admins têm permissão total. |
| **System Agent** atualiza fatura | ✅ **SUCCESS** | Tokens com claim `system: true` têm bypass de segurança para automações. |

## 🚀 Como Validar

Para rodar os testes de segurança, certifique-se de ter o Firebase Emulator Suite instalado e Java 21+ disponível:

```bash
# Iniciar emulador e rodar testes
npx firebase emulators:exec "npm run test -- tests/financial_hardening.test.js --run"
```

## ⚠️ Observações Técnicas

1. **Idempotência**: A regra utiliza `resource.data.get('onboarding', {})` para lidar com documentos antigos que ainda não possuem o objeto de onboarding, garantindo que a regra não quebre em registros legados.
2. **Custom Claims**: O sistema de importação ou faturamento automático deve emitir tokens com a claim `{ "system": true }` para realizar as atualizações sem intervenção humana.
