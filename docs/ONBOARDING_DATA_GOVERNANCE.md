# Governança de Dados do Onboarding

Este documento define as regras de integridade, rastreabilidade e idempotência para o módulo de Onboarding.

---

## 1. Manual Override (Soberania Manual)

Para evitar que importações automáticas sobrescrevam ajustes manuais feitos pelo time de CS ou Operacional, foi introduzido o campo:

`onboarding.manualOverride: boolean`

### Regras:
- Se `manualOverride` for `true`, o motor de consolidação (`consolidationService`) **não** alterará nenhum dado deste cliente.
- Apenas usuários com permissão podem ativar/desativar este campo via interface.
- Toda alteração manual na interface deve, opcionalmente ou compulsoriamente, ativar este flag se o usuário desejar proteger o dado.

---

## 2. Rastreabilidade (History)

Todas as alterações críticas no objeto de onboarding são registradas no array `onboarding.history[]`.

### Estrutura do Item de Histórico:
```json
{
  "field": "pipelineStatus | apportionmentRegistered | ...",
  "oldValue": "valor_anterior",
  "newValue": "novo_valor",
  "updatedBy": "uid_do_usuario | system_import",
  "updatedAt": "ISO8601",
  "source": "manual | import"
}
```

---

## 3. Idempotência

O motor de consolidação implementa uma verificação de "antes-de-escrever":
1. O valor atual no Firestore é comparado com o valor calculado da planilha.
2. Se forem idênticos, nenhuma escrita é realizada para aquele campo/documento.
3. Isso evita inflar o histórico com entradas redundantes e economiza operações de escrita (W) no Firestore.

---

## 4. Implementação Técnica

### No `consolidationService.js`:
- Antes de processar cada UC, o serviço verifica o `manualOverride`.
- Compara campo a campo: `sentToApportionment`, `apportionmentRegistered`, `compensationForecastDate`, `hasBeenInvoiced`.
- Se houver mudança, gera uma entrada no `history` com `source: "import"`.

### No `clientService.js`:
- O método `updateOnboarding` agora aceita um parâmetro `updatedBy` e gera entradas de histórico com `source: "manual"`.

---

## 5. Auditoria e Debug

Para auditar mudanças em massa, consulte a coleção `import_logs`. Para mudanças granulares por cliente, consulte o campo `history` dentro do documento do cliente na coleção `clients`.
