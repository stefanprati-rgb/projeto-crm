# ✅ CHECKLIST RÁPIDO - Teste Data Sync

**Data:** ___/___/___  
**Testador:** _______________  
**Hora Início:** _____  
**Hora Fim:** _____

---

## 🎯 TESTE 1: CONSOLE LOGS

- [ ] Abri console (F12)
- [ ] Fiz login
- [ ] Vi mensagem: "🔄 Iniciando listeners globais de dados..."
- [ ] Mensagem apareceu apenas 1x (não duplicada)

**Status:** ⬜ PASSOU | ⬜ FALHOU

---

## 🎯 TESTE 2: DASHBOARD

**Métricas anotadas:**
- Total Clientes: _______________
- Clientes Ativos: _______________
- Tickets Abertos: _______________
- Receita Mensal: R$ _______________

**Verificações:**
- [ ] Total de Clientes é razoável (não 500)
- [ ] Todos os valores aparecem
- [ ] Gráficos renderizam

**Status:** ⬜ PASSOU | ⬜ FALHOU

---

## 🎯 TESTE 3: PÁGINA CLIENTES

**Métricas anotadas:**
- Total: _______________
- Ativos: _______________

**Verificações:**
- [ ] Total = Total do Dashboard
- [ ] Lista de clientes carrega

**Status:** ⬜ PASSOU | ⬜ FALHOU

---

## 🎯 TESTE 4: DROPDOWN TICKETS (CRÍTICO!)

**IMPORTANTE:** Recarreguei página antes de testar

**Passos:**
- [ ] Fui DIRETO para /tickets (sem passar por /clientes)
- [ ] Abri modal "Novo Ticket"
- [ ] Cliquei no dropdown "Cliente"

**O que vi:**
- [ ] Fase 1: "Carregando clientes..." (1-3s)
- [ ] Fase 2: Lista de clientes apareceu
- [ ] Consegui selecionar um cliente

**Clientes no dropdown:** _______________

**Status:** ⬜ PASSOU | ⬜ FALHOU

---

## 🎯 TESTE 5: REAL-TIME (OPCIONAL)

- [ ] Abri 2 abas
- [ ] Criei cliente na Aba 1
- [ ] Aba 2 atualizou automaticamente

**Status:** ⬜ PASSOU | ⬜ FALHOU | ⬜ NÃO TESTADO

---

## 🎯 TESTE 6: NETWORK (AVANÇADO)

- [ ] Abri Network tab
- [ ] Recarreguei página
- [ ] Vi ~3 queries ao Firestore
- [ ] SEM listeners duplicados

**Status:** ⬜ PASSOU | ⬜ FALHOU | ⬜ NÃO TESTADO

---

## 📊 RESULTADO FINAL

**Testes Passados:** _____ / 6

**Classificação:**
- ⬜ 6/6 - ✅ PERFEITO
- ⬜ 5/6 - ✅ BOM
- ⬜ 4/6 - ⚠️ PARCIAL
- ⬜ 3/6 ou menos - ❌ PROBLEMA

---

## 📝 PROBLEMAS ENCONTRADOS

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## ✅ DECISÃO

- ⬜ APROVAR e fazer commit
- ⬜ REJEITAR e debugar
- ⬜ PARCIAL - ajustes necessários

**Assinatura:** _______________
