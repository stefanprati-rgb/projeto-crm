# Smoke Tests P0 - Produção

Este documento descreve os testes manuais básicos que **devem** ser realizados após cada deploy para garantir que as regras CRÍTICAS (P0) não foram quebradas.

## 1. Multi-Tenancy (Isolamento de Dados)
- **Ação**: Logue com dois usuários de empresas (bases) diferentes.
- **Validação**: O Usuário A NÃO pode ver dados, faturas ou eventos do Usuário B.
- **Risco**: Erro nas regras de `database`.

## 2. Linha do Tempo de CRM (Eventos) E Auditoria
- **Ação**: No detalhe de um cliente, adicione uma anotação ou registro de ligação.
- **Validação**: 
  - O registro deve aparecer na timeline.
  - Recarregue a página e confirme que o dado persiste.
  - **Teste Adicional**: Usuário comum tenta editar nota via UI ou emulador local → DEVE FALHAR.
  - Tente (como usuário regular) excluir a nota → DEVE FALHAR.
- **Risco**: Falta de regras para `client_events` ou falha nas validações de imutabilidade.

## 2.1. Permissões de Configurações Globais (Settings)
- **Ação 1**: Faça login como Usuário Comum e tente acessar rotas ou realizar buscas que leiam `settings`.
- **Validação**: Acesso negado. A leitura via UI Console deve falhar (`permission-denied`).
- **Ação 2**: Faça login como Administrador (`isAdmin`).
- **Validação**: Acesso a `settings` deve ser liberado.
- **Risco**: Configurações sensíveis (chaves, webhooks) expostas a usuários comuns.

## 3. Consolidação e Importação
- **Ação**: Realize uma importação de planilha de exemplo.
- **Validação**:
  - Verifique se o log de importação aparece na lista.
  - Confirme se os status de onboarding do cliente foram atualizados corretamente conforme a regra da planilha (ex: se foi faturado, status deve mudar para `invoiced`).
- **Risco**: Falta de regras para `import_logs` ou erro no matching de UC.

## 4. Cache / Versão do App
- **Ação**: Após um deploy de correção visual, recarregue a página uma vez.
- **Validação**: As mudanças devem refletir imediatamente.
- **Risco**: Cache de 1 ano no `index.html`.

## 5. Pesquisa e Filtros (Pipeline)
- **Ação**: Navegue até a página de Onboarding e aplique um filtro de status.
- **Validação**: A lista deve carregar sem erros de console (especialmente erros de "Missing Index").
- **Risco**: Ausência de índices compostos.

---

## Como Reverter em Emergência
Caso algum dos testes falhe catastroficamente:
1. Vá ao Console do Firebase > Hosting.
2. Selecione a versão anterior e clique em **Rollback**.
3. Notifique o time técnico.
